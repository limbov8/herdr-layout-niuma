#!/usr/bin/env python3
# Token use and estimated API cost for the pasture's agents. The mod runs it about once a
# minute while ⚙'s "Show tokens and cost" is on:
#   python3 usage.py <address>:<kind>:<pid>:<cwd> ...
# kind is "claude" or "codex"; pid is the agent program's own process (the terminal's
# foreground). Prints {"<address>": {"tok": n, "today": $, "total": $|null}, ...}.
#   tok    tokens this session, not counting cache reads (input + cache writes + output)
#   today  estimated $ for this session's requests today (local time); null when unknown
#   total  estimated $ for the whole session; null when unknown
# Claude Code: ~/.claude/sessions/<pid>.json names the session, its transcript is
# ~/.claude/projects/*/<session>.jsonl (sub-agents in <session>/subagents/). Codex: the
# newest ~/.codex/sessions rollout for the same folder that started after the process.
# Codex money is not estimated (tokens only). Files are read incrementally: what was summed
# is kept in a cache under the temp folder, keyed by path, size and offset.
import datetime, glob, json, os, subprocess, sys, tempfile

HOME = os.path.expanduser("~")
CACHE = os.path.join(tempfile.gettempdir(), "niu-ma-usage-cache.json")

# $ per million tokens: input, output, cache read. Cache writes are 1.25x input (5 minute)
# and 2x input (1 hour). Longest prefix wins. Anthropic API list prices, 2026-11.
PRICES = [
    ("claude-fable-5-2", 8, 40, 0.20), ("claude-mythos-5-2", 8, 40, 0.20),
    ("claude-fable-5", 10, 50, 1.00), ("claude-mythos-5", 10, 50, 1.00),
    ("claude-opus-5-5", 4, 20, 0.20), ("claude-opus-5", 5, 25, 0.50),
    ("claude-opus-4-8", 5, 25, 0.50), ("claude-opus-4-7", 5, 25, 0.50),
    ("claude-opus-4-6", 5, 25, 0.50), ("claude-opus-4-5", 5, 25, 0.50),
    ("claude-sonnet-5-5", 2, 10, 0.10), ("claude-sonnet-5", 2, 10, 0.20),
    ("claude-sonnet-4", 3, 15, 0.30),
    ("claude-haiku-5-5", 0.10, 0.50, 0.01), ("claude-haiku-4-5", 1, 5, 0.10),
]


def price(model):
    best = None
    for p in PRICES:
        if model and model.startswith(p[0]) and (best is None or len(p[0]) > len(best[0])):
            best = p
    return best


def claude_cost(model, u, speed):
    p = price(model)
    if not p:
        return None
    _, i, o, r = p
    cc = u.get("cache_creation") or {}
    w1h = cc.get("ephemeral_1h_input_tokens", 0) or 0
    w5m = cc.get("ephemeral_5m_input_tokens")
    if w5m is None:
        w5m = max(0, (u.get("cache_creation_input_tokens") or 0) - w1h)
    usd = ((u.get("input_tokens") or 0) * i + (u.get("output_tokens") or 0) * o
           + (u.get("cache_read_input_tokens") or 0) * r + w5m * i * 1.25 + w1h * i * 2) / 1e6
    return usd * (2 if speed == "fast" else 1)


def local_day(ts):
    try:
        t = datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))
        return t.astimezone().date().isoformat()
    except Exception:
        return None


def load_cache():
    try:
        with open(CACHE) as f:
            return json.load(f)
    except Exception:
        return {}


def scan(path, cache, parse):
    """Sums one file from where the cache left off. Entry: offset, size, days {day: [tok, usd]},
    unknown (requests whose cost is unknown), seen (Claude message ids), state (parser's own)."""
    try:
        size = os.path.getsize(path)
    except OSError:
        return None
    e = cache.get(path)
    if not e or e.get("size", 0) > size:
        e = {"offset": 0, "size": 0, "days": {}, "unknown": 0, "seen": [], "state": {}}
    if size != e["size"]:
        seen = set(e["seen"])
        with open(path, "rb") as f:
            f.seek(e["offset"])
            data = f.read()
        end = data.rfind(b"\n") + 1  # leave a half-written last line for next time
        for line in data[:end].splitlines():
            try:
                parse(json.loads(line), e, seen)
            except Exception:
                continue
        e["offset"] += end
        e["size"] = e["offset"]
        e["seen"] = list(seen)[-4000:]
    cache[path] = e
    return e


def add(e, day, tok, usd):
    d = e["days"].setdefault(day or "?", [0, 0.0])
    d[0] += tok
    if usd is None:
        e["unknown"] += 1
    else:
        d[1] += usd


def parse_claude(rec, e, seen):
    if rec.get("type") != "assistant":
        return
    m = rec.get("message") or {}
    u = m.get("usage")
    key = rec.get("requestId") or m.get("id")
    if not u or not key or key in seen:  # one request is written as several lines
        return
    seen.add(key)
    tok = (u.get("input_tokens") or 0) + (u.get("cache_creation_input_tokens") or 0) + (u.get("output_tokens") or 0)
    usd = claude_cost(m.get("model"), u, u.get("speed"))
    if usd is None and tok == 0 and not u.get("cache_read_input_tokens"):
        usd = 0.0  # Claude Code's own placeholder replies ("<synthetic>") use nothing
    add(e, local_day(rec.get("timestamp", "")), tok, usd)


def parse_codex(rec, e, seen):
    p = rec.get("payload") or {}
    if rec.get("type") != "event_msg" or p.get("type") != "token_count":
        return
    last = (p.get("info") or {}).get("last_token_usage")
    if not last:
        return
    tok = max(0, (last.get("input_tokens") or 0) - (last.get("cached_input_tokens") or 0)) + (last.get("output_tokens") or 0)
    add(e, local_day(rec.get("timestamp", "")), tok, None)


def proc_start(pid):
    try:
        out = subprocess.run(["ps", "-o", "lstart=", "-p", str(pid)], capture_output=True, text=True, timeout=5).stdout.strip()
        return datetime.datetime.strptime(out, "%a %b %d %H:%M:%S %Y").timestamp()
    except Exception:
        return None


def claude_files(pid):
    try:
        with open(os.path.join(HOME, ".claude", "sessions", f"{pid}.json")) as f:
            sid = json.load(f)["sessionId"]
    except Exception:
        return []
    main = glob.glob(os.path.join(HOME, ".claude", "projects", "*", f"{sid}.jsonl"))
    subs = glob.glob(os.path.join(HOME, ".claude", "projects", "*", sid, "subagents", "*.jsonl"))
    return main[:1] + subs


def codex_file(pid, cwd):
    start = proc_start(pid)
    best = None
    files = sorted(glob.glob(os.path.join(HOME, ".codex", "sessions", "*", "*", "*", "rollout-*.jsonl")),
                   key=os.path.getmtime, reverse=True)[:40]
    for path in files:
        if start and os.path.getmtime(path) < start - 5:
            break
        try:
            with open(path) as f:
                meta = json.loads(f.readline()).get("payload") or {}
            began = datetime.datetime.fromisoformat(meta["timestamp"].replace("Z", "+00:00")).timestamp()
        except Exception:
            continue
        if meta.get("cwd") == cwd and (not start or began >= start - 5):
            best = path  # newest first: a /new in the same process wins over the first session
            break
    return [best] if best else []


def main():
    cache = load_cache()
    today = datetime.date.today().isoformat()
    out = {}
    for arg in sys.argv[1:]:
        addr, kind, pid, cwd = (arg.split(":", 3) + ["", "", "", ""])[:4]
        files = claude_files(pid) if kind == "claude" else codex_file(pid, cwd) if kind == "codex" else []
        tok, day_usd, all_usd, unknown, any_file = 0, 0.0, 0.0, 0, False
        for path in files:
            e = scan(path, cache, parse_claude if kind == "claude" else parse_codex)
            if not e:
                continue
            any_file = True
            unknown += e["unknown"]
            for d, (t, usd) in e["days"].items():
                tok += t
                all_usd += usd
                if d == today:
                    day_usd += usd
        if any_file:
            priced = kind == "claude" and unknown == 0
            out[addr] = {"tok": tok, "today": round(day_usd, 4) if priced else None,
                         "total": round(all_usd, 4) if priced else None}
    try:
        tmp = CACHE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(cache, f)
        os.replace(tmp, CACHE)
    except Exception:
        pass
    print(json.dumps(out))


if __name__ == "__main__":
    main()
