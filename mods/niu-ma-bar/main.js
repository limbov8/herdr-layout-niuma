// The NiuMa layout's two bars.
//   props {}                  over the panes: every space as a pill (click to switch, + for a
//                             new one), the space's branch and tabs, and buttons that split the
//                             tab (a new panel, not a new tab). `niu-ma-bar.split` and
//                             `niu-ma-bar.split-agent` (keys.json) do the same.
//   props { role: "agents" }  the ⚙ dialog: the start command for Claude Code and Codex, kept
//                             as their `run` in programs.json.
//   props { role: "upgrade" } the update window the bar's update icon opens: installed vs latest
//                             version, what changed, Upgrade.
//   props { role: "shell" }   over the bottom terminal: its folder, cd to the space, clear,
//                             restart. If the shell is gone (exit), starts a new one and points
//                             the layout's `shell-term` block at it.
import { View, div, image, svg } from "gpui-kit";
import { InputState, Input, TextView } from "gpui-base";
import { spaces, panes, focused, terminals, run, exec, theme, props, layout, knownAgents, nextCommand, hc, home, appHome,
  openOverlay, closeOverlay, readTextFile, writeTextFile, shared, setShared, notify, window as appWindow } from "herdr";

const SHELL_NAME = "niu-ma-shell";

// ---- Versions and upgrades ---------------------------------------------------
// The repo's VERSION and CHANGELOG.md on main are the latest release; the installed one is
// this mod's own VERSION file. The bar checks every CHECK_HOURS (shared "niu-ma.update":
// {current, latest, checked, error}); shared "niu-ma.update-check" false turns it off.
const REPO = "limbov8/herdr-layout-niuma";
const RAW = `https://raw.githubusercontent.com/${REPO}/refs/heads/main`;
const TARBALL = `https://codeload.github.com/${REPO}/tar.gz/refs/heads/main`;
const SPONSOR_URL = "https://github.com/sponsors/limbov8";
const CHECK_HOURS = 6;
const UPDATE_KEY = "niu-ma.update";

const parseVersion = (v) => (String(v ?? "").match(/\d+(?:\.\d+)*/)?.[0] ?? "").split(".").filter(Boolean).map(Number);
// > 0 when a is newer than b.
const compareVersions = (a, b) => {
  const x = parseVersion(a), y = parseVersion(b);
  for (let i = 0; i < Math.max(x.length, y.length); i++) {
    const d = (x[i] ?? 0) - (y[i] ?? 0);
    if (d) return d;
  }
  return 0;
};
const isNewer = (u) => !!u?.latest && compareVersions(u.latest, u.current ?? "0") > 0;

// GitHub over Herdr's fetch, else curl. A query string keeps the CDN from serving a stale copy.
async function fetchText(url) {
  const busted = `${url}?t=${Date.now()}`;
  try {
    const r = await fetch(busted);
    if (r.ok) return await r.text();
    if (r.status === 404) throw new Error(`${url}: not found`);
  } catch (e) {
    if (String(e).includes("not found")) throw e;
  }
  const r = await exec("curl", ["-fsSL", "--max-time", "20", busted], { timeout: 30000 });
  if (r.code !== 0) throw new Error((r.stderr || `curl exited ${r.code}`).trim());
  return r.stdout;
}

async function installedVersion() {
  const v = await readTextFile(`${appHome()}/mods/niu-ma-bar/VERSION`).catch(() => null);
  return v?.trim() || null;
}

async function checkForUpdate() {
  const current = await installedVersion();
  const prev = shared(UPDATE_KEY) ?? {};
  let next;
  try {
    const latest = (await fetchText(`${RAW}/VERSION`)).trim();
    if (!parseVersion(latest).length) throw new Error(`unexpected VERSION: ${latest.slice(0, 40)}`);
    next = { current, latest, checked: Date.now(), error: null };
  } catch (e) {
    next = { ...prev, current, checked: Date.now(), error: String(e?.message ?? e) };
  }
  setShared(UPDATE_KEY, next);
  return next;
}

// The changelog sections newer than `current` (all of them when current is unknown),
// newest first, as markdown with their headings one level down.
function changesSince(markdown, current) {
  return markdown.split(/^## /m).slice(1)
    .filter((sec) => !current || compareVersions(sec.split("\n")[0], current) > 0)
    .map((sec) => `### ${sec.trim()}`)
    .join("\n\n");
}

function openUrl(url) {
  const platform = appWindow()?.platform;
  const [cmd, args] = platform === "macos" ? ["open", [url]]
    : platform === "windows" ? ["cmd", ["/c", "start", "", url]] : ["xdg-open", [url]];
  exec(cmd, args).catch(() => notify({ title: "Couldn't open the browser", body: url, level: "error" }));
}

// Upgrade, as the README's manual install: download main, set the current files aside in
// .niu-ma-backup (the previous version only), copy the layout and both mods over, add new
// `layout:niu-ma` keys without replacing any, check the mods. Assumes the default names.
const DOWNLOAD_SH = `set -e
tmp=$(mktemp -d "\${TMPDIR:-/tmp}/niu-ma-upgrade.XXXXXX")
curl -fsSL --max-time 180 "$1" | tar -xz -C "$tmp"
src=$(find "$tmp" -mindepth 1 -maxdepth 1 -type d | head -n 1)
for p in VERSION layouts/niu-ma.json mods/niu-ma-pasture/main.js mods/niu-ma-bar/main.js; do
  [ -e "$src/$p" ] || { echo "the download has no $p" >&2; rm -rf "$tmp"; exit 3; }
done
printf '%s\n%s\n' "$tmp" "$src"`;
const INSTALL_SH = `set -e
home="$1"; tmp="$2"; src="$3"
trap 'rm -rf "$tmp"' EXIT
bak="$home/.niu-ma-backup"
rm -rf "$bak"; mkdir -p "$bak/layouts" "$bak/mods"
for f in niu-ma.json niu-ma.svg; do [ -e "$home/layouts/$f" ] && cp "$home/layouts/$f" "$bak/layouts/"; done
for m in niu-ma-pasture niu-ma-bar; do [ -d "$home/mods/$m" ] && cp -R "$home/mods/$m" "$bak/mods/"; done
mkdir -p "$home/layouts" "$home/mods/niu-ma-pasture" "$home/mods/niu-ma-bar"
cp "$src/layouts/niu-ma.json" "$home/layouts/"
[ -e "$src/layouts/niu-ma.svg" ] && cp "$src/layouts/niu-ma.svg" "$home/layouts/"
cp -R "$src/mods/niu-ma-pasture/." "$home/mods/niu-ma-pasture/"
cp -R "$src/mods/niu-ma-bar/." "$home/mods/niu-ma-bar/"
cp "$src/VERSION" "$home/mods/niu-ma-bar/VERSION"
if command -v herdr-app >/dev/null 2>&1; then
  for m in niu-ma-pasture niu-ma-bar; do herdr-app check "$home/mods/$m" >/dev/null 2>"$tmp/check.err" || { echo "herdr-app check $m failed:" >&2; cat "$tmp/check.err" >&2; exit 4; }; done
fi`;

// The downloaded keys.json's `layout:niu-ma` keys the person doesn't have yet.
async function mergeKeys(src) {
  const theirs = JSON.parse((await readTextFile(`${src}/keys.json`)) ?? "{}");
  const path = `${appHome()}/keys.json`;
  const current = await readTextFile(path);
  const mine = current ? JSON.parse(current) : {};
  let added = 0;
  for (const [section, keys] of Object.entries(theirs)) {
    if (!section.startsWith("layout:niu-ma")) continue;
    mine[section] = mine[section] ?? {};
    for (const [key, action] of Object.entries(keys)) {
      if (!(key in mine[section])) { mine[section][key] = action; added++; }
    }
  }
  if (added) await writeTextFile(path, `${JSON.stringify(mine, null, 2)}\n`, current);
  return added;
}

async function upgrade() {
  const dl = await exec("sh", ["-c", DOWNLOAD_SH, "sh", TARBALL], { timeout: 240000 });
  if (dl.code !== 0) throw new Error(`Download failed: ${(dl.stderr || dl.stdout).trim()}`);
  const [tmp, src] = dl.stdout.trim().split("\n");
  const version = ((await readTextFile(`${src}/VERSION`)) ?? "").trim();
  let added = 0, keysNote = "";
  try { added = await mergeKeys(src); } catch (e) { keysNote = ` Keys not merged: ${e?.message ?? e}.`; }
  const r = await exec("sh", ["-c", INSTALL_SH, "sh", appHome(), tmp, src], { timeout: 240000 });
  if (r.code !== 0) throw new Error(`${(r.stderr || r.stdout).trim()} (previous files are in ~/.config/herdr-app/.niu-ma-backup)`);
  return { version, added, keysNote };
}

function findNode(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const c of node.children ?? []) {
    const f = findNode(c, id);
    if (f) return f;
  }
  return null;
}
// The agents the ⚙ dialog sets up, by programs.json key.
const AGENT_KEYS = [{ key: "claude", name: "Claude Code" }, { key: "codex", name: "Codex" }];
// A command line to argv and back, with "…" and '…' quoting.
const splitArgs = (line) => {
  const out = [];
  let cur = "", quote = null, any = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quote) {
      if (c === quote) quote = null;
      else if (c === "\\" && quote === '"' && i + 1 < line.length) cur += line[++i];
      else cur += c;
    } else if (c === '"' || c === "'") { quote = c; any = true; }
    else if (c === "\\" && i + 1 < line.length) { cur += line[++i]; any = true; }
    else if (/\s/.test(c)) { if (cur || any) out.push(cur); cur = ""; any = false; }
    else { cur += c; any = true; }
  }
  if (cur || any) out.push(cur);
  return out;
};
const joinArgs = (argv) => argv.map((a) => (/^[\w@%+=:,./-]+$/.test(a) ? a : `"${a.replace(/(["\\$`])/g, "\\$1")}"`)).join(" ");
const tilde = (p) => (p && p.startsWith(home()) ? `~${p.slice(home().length)}` : p ?? "");
const quote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export default class Bar extends View {
  init(_props, cx) {
    this.shell = props()?.role === "shell";
    this.agentsDialog = props()?.role === "agents";
    this.upgradeWindow = props()?.role === "upgrade";
    if (this.agentsDialog || this.upgradeWindow) this.initVersion(cx);
    if (this.agentsDialog) return this.initAgents(cx);
    if (this.upgradeWindow) return;
    this.agents = [];
    this.fixing = false;
    if (this.shell) {
      cx.timer.every(4000, (cx) => this.watch(cx));
      this.watch(cx);
      return;
    }
    this.loadAgents(cx);
    // The update check: due every CHECK_HOURS (or when the installed version changed, after
    // an upgrade), looked at every 15 minutes so a sleeping laptop catches up on waking.
    const due = (cx) => {
      if (shared("niu-ma.update-check") === false || this.checking) return;
      this.checking = true;
      cx.spawn(async (cx) => {
        const u = shared(UPDATE_KEY);
        const current = await installedVersion();
        if (!u?.checked || Date.now() - u.checked > CHECK_HOURS * 3600e3 || u.current !== current) await checkForUpdate();
        this.checking = false;
        cx.notify();
      });
    };
    cx.timer.after(5000, due);
    cx.timer.every(15 * 60e3, due);
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        if (c === "split") this.split();
        else if (c === "split-agent") this.split(this.agents[0]?.run);
        cx.notify();
      }
    });
  }

  // The installed agents and their start commands (programs.json `run`), read again when
  // the ⚙ dialog saves (it bumps shared "niu-ma.agents").
  loadAgents(cx) {
    this.agentsStamp = shared("niu-ma.agents") ?? null;
    cx.spawn(async (cx) => {
      try {
        this.agents = (await knownAgents()).filter((a) => a.installed).slice(0, 3);
      } catch {
        this.agents = [];
      }
      cx.notify();
    });
  }

  // A new panel in the shown tab, always side by side: it splits the widest panel (by its
  // terminal's columns) to the right, so the columns stay about even across the centre.
  // An agent starts inside a plain shell panel, typed in like you would: so it gets the
  // shell's own environment (~/.zshrc: cloud credentials, PATH, env for a Vertex or Bedrock
  // Claude), which Herdr's direct start of an argv skips, and the shell stays when it exits.
  // The ⚙ dialog's "Start agents in a shell" (shared "niu-ma.agent-shell") turns it off.
  split(argv) {
    const f = focused();
    if (!f) return;
    const here = panes().filter((p) => p.tab === f.tab);
    const sizes = Object.fromEntries(terminals().map((t) => [t.address, { cols: t.cols ?? 0, rows: t.rows ?? 0 }]));
    const cols = (p) => sizes[p.terminal]?.cols ?? 0;
    const target = [...here].sort((a, b) => cols(b) - cols(a) || (b.focused ? 1 : 0) - (a.focused ? 1 : 0))[0];
    const [name, args] = target ? ["pane.split", { pane: target.pane, direction: "right" }] : ["tab.new", {}];
    if (!argv?.length) return run(name, args);
    if (shared("niu-ma.agent-shell") === false) return run(name, { ...args, argv });
    const flags = Object.entries(args).flatMap(([k, v]) => [`--${k}`, v]);
    exec("herdr-app", ["do", name, ...flags])
      .then((r) => { try { return r.code === 0 ? JSON.parse(r.stdout) : null; } catch { return null; } }, () => null)
      .then((made) => {
        // No herdr-app on PATH: Herdr starts it directly, without the shell's setup.
        if (!made?.terminal) return run(name, { ...args, argv });
        return hc(["send", made.terminal, joinArgs(argv)]).catch(() => null);
      });
  }

  shellAddress() {
    return findNode(layout(), "shell-term")?.content?.terminal ?? null;
  }

  watch(cx) {
    const addr = this.shellAddress();
    const live = (a) => terminals().some((t) => t.address === a && t.state === "live");
    if ((addr && live(addr)) || this.fixing || !findNode(layout(), "shell")) return;
    this.fixing = true;
    cx.spawn(async (cx) => {
      try {
        let next = terminals().find((t) => t.name === SHELL_NAME && t.state === "live")?.address;
        if (!next) {
          const r = await hc(["run", "--json", "--keep", "--bg", "--no-parent", "--name", SHELL_NAME,
            "--label", "niu-ma.role=shell", "--cwd", home()]);
          next = JSON.parse(r.stdout || "{}").address;
        }
        // Herdr drops a terminal block whose terminal ended: put it back under the bar.
        const tree = JSON.parse(JSON.stringify(layout()));
        const column = findNode(tree, "shell");
        const node = findNode(tree, "shell-term");
        if (next && node && node.content?.terminal !== next) {
          node.content = { terminal: next };
          run("layout.set", { layout: tree });
        } else if (next && !node && column) {
          column.children = [...(column.children ?? []), { id: "shell-term", type: "block", content: { terminal: next } }];
          run("layout.set", { layout: tree });
        }
      } catch (e) {
        console.log(`niu-ma-bar: could not restart the shell: ${e}`);
      }
      this.fixing = false;
      cx.notify();
    });
  }

  btn(id, label, onClick, opts = {}) {
    const t = theme();
    return div().id(id).flex().flex_row().items_center().gap(5).h(24).px(9).rounded(6)
      .text_size(12).text_color(opts.primary ? t.accent_foreground : t.foreground)
      .bg(opts.primary ? t.accent : t.raised).border_1().border_color(opts.primary ? t.accent : t.border)
      .hover((s) => s.bg(opts.primary ? t.accent : t.hover).border_color(t.input))
      .cursor_pointer().on_click(onClick)
      .when(!!opts.tip, (el) => el.tooltip(opts.tip))
      .when(!!opts.icon, (el) => el.child(opts.tint ? svg(opts.icon).size(13).text_color(opts.primary ? t.accent_foreground : t.muted) : image(opts.icon).size(13)))
      .child(label);
  }

  render(cx) {
    if (this.agentsDialog) return this.renderAgents(cx);
    if (this.upgradeWindow) return this.renderUpgradeWindow(cx);
    if (!this.shell && (shared("niu-ma.agents") ?? null) !== this.agentsStamp) this.loadAgents(cx);
    return this.shell ? this.renderShell() : this.renderMain();
  }

  // ---- ⚙ agent start commands -------------------------------------------

  initAgents(cx) {
    this.path = `${appHome()}/programs.json`;
    this.rows = AGENT_KEYS.map((a) => ({ ...a, input: InputState.new({ placeholder: a.key }), def: null, installed: null }));
    this.status = "Loading…";
    this.inShell = shared("niu-ma.agent-shell") !== false;
    this.autoCheck = shared("niu-ma.update-check") !== false;
    this.showShell = !!findNode(layout(), "shell") && !findNode(layout(), "shell").hidden;
    cx.spawn(async (cx) => {
      try {
        this.original = await readTextFile(this.path);
        const file = this.original ? JSON.parse(this.original) : {};
        const known = await knownAgents().catch(() => []);
        // Defaults are Herdr's own commands: what knownAgents reports while programs.json
        // doesn't override them, remembered for when it does.
        const saved = JSON.parse(localStorage.getItem("defaults") ?? "{}");
        for (const row of this.rows) {
          const k = known.find((x) => x.key === row.key);
          const override = file.programs?.[row.key]?.run;
          if (!override && k?.run?.length) saved[row.key] = k.run;
          row.def = saved[row.key] ?? [row.key];
          row.installed = k?.installed ?? null;
          row.input.set_value(joinArgs(override ?? row.def));
        }
        localStorage.setItem("defaults", JSON.stringify(saved));
        this.status = "";
      } catch (e) {
        this.status = `Couldn't read programs.json: ${e}`;
      }
      cx.notify();
    });
  }

  async saveAgents(cx) {
    try {
      const current = await readTextFile(this.path);
      const file = current ? JSON.parse(current) : {};
      file.programs = file.programs ?? {};
      for (const row of this.rows) {
        let argv = splitArgs(row.input.value().trim());
        if (!argv.length) argv = [...row.def];
        const entry = { ...(file.programs[row.key] ?? {}) };
        if (JSON.stringify(argv) === JSON.stringify(row.def)) delete entry.run;
        else entry.run = argv;
        if (Object.keys(entry).length) file.programs[row.key] = entry;
        else delete file.programs[row.key];
      }
      if (!Object.keys(file.programs).length) delete file.programs;
      await writeTextFile(this.path, `${JSON.stringify(file, null, 2)}\n`, current);
      setShared("niu-ma.agent-shell", this.inShell);
      setShared("niu-ma.update-check", this.autoCheck);
      // The bottom shell: hidden, not removed, so it keeps running and comes back as it was.
      if (findNode(layout(), "shell")) run(this.showShell ? "layout.show" : "layout.hide", { id: "shell" });
      setShared("niu-ma.agents", Date.now());
      this.status = `Saved at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}. New agents start with these commands.`;
      // Saving the same thing twice changes nothing on screen: say so out loud.
      this.saved = true;
      cx.timer.after(2000, (cx) => { this.saved = false; cx.notify(); });
      notify({ title: "Agent settings saved", body: "New agents start with these commands.", level: "success", timeout: 3000 });
    } catch (e) {
      this.status = `Not saved: ${e}`;
      notify({ title: "Agent settings not saved", body: String(e), level: "error" });
    }
    cx.notify();
  }

  renderAgents(cx) {
    const t = theme();
    const row = (r) => div().flex().flex_col().gap(6).p(12).rounded(8).bg(t.surface).border_1().border_color(t.border)
      .child(div().flex().flex_row().items_center().gap(8)
        .child(div().text_size(13).font_semibold().text_color(t.foreground).child(r.name))
        .when(r.installed === false, (el) => el.child(div().text_size(10.5).text_color(t.dim).child("not installed")))
        .child(div().flex_1())
        .child(div().id(`reset-${r.key}`).text_size(11).text_color(t.accent).cursor_pointer()
          .on_click((_e, cx) => { r.input.set_value(joinArgs(r.def ?? [r.key])); cx.notify(); })
          .child("Reset to default")))
      .child(div().text_size(11).text_color(t.muted).child(`Default: ${r.def ? joinArgs(r.def) : "…"}`))
      .child(Input.new(r.input).h(32).px(9).rounded(6).border_1().border_color(t.input).bg(t.background)
        .text_size(12.5).text_color(t.foreground).font_family("JetBrains Mono"));
    const overlay = props()?.overlay;
    return div().id("agents-dialog").size_full().flex().flex_col().gap(10).p(16).bg(t.popover)
      .child(div().id("agents-scroll").flex_1().min_h_0().overflow_y_scrollbar().flex().flex_col().gap(10).pr(4)
        .child(div().text_size(15).font_semibold().text_color(t.foreground).child("Agent start commands"))
        .child(div().text_size(11.5).text_color(t.muted)
          .child("What the agent buttons, ⌘⇧T and Herdr's menus run to start each agent. Saved as its run in programs.json."))
        .children(this.rows.map(row))
        .child(this.toggle(t, "agent-shell", "Start agents in a shell", this.inShell, (v) => { this.inShell = v; },
          "The agent buttons and ⌘⇧T open a shell panel and type the command, so it gets your ~/.zshrc (env for Vertex, Bedrock, proxies). Off: Herdr starts it directly, without ~/.zshrc."))
        .child(this.toggle(t, "show-shell", "Show the shell at the bottom", this.showShell, (v) => { this.showShell = v; },
          "Off hides the bottom shell and its bar; the shell keeps running and comes back when you turn this on."))
        .child(this.toggle(t, "update-check", `Check for updates every ${CHECK_HOURS} hours`, this.autoCheck, (v) => { this.autoCheck = v; },
          "Asks GitHub for the latest NiuMa version and shows an update icon next to ⚙ when there's a newer one. Nothing else is sent."))
        .child(this.renderVersion(t, cx, { sponsor: true })))
      .child(div().flex().flex_row().items_center().gap(8)
        .child(div().flex_1().text_size(11).text_color(this.status.startsWith("Not") || this.status.startsWith("Couldn't") ? t.blocked : t.muted).truncate().child(this.status))
        .child(this.btn("agents-cancel", "Close", () => overlay && closeOverlay(overlay)))
        .child(this.btn("agents-save", this.saved ? "✓ Saved" : this.saving ? "Saving…" : "Save", (_e, cx) => {
          if (this.saving) return;
          this.saving = true; cx.notify();
          cx.spawn(async (cx) => { await this.saveAgents(cx); this.saving = false; cx.notify(); });
        }, { primary: true })));
  }

  // A switch card in the ⚙ dialog. "Start agents in a shell": whether the bar starts
  // agents typed into a shell panel (your ~/.zshrc and its env) or directly as a program
  // (Herdr's way, which skips ~/.zshrc); only the bar's buttons and ⌘⇧T, Herdr's own menus
  // always start them directly. "Show the shell": the layout's bottom `shell` column.
  toggle(t, id, title, on, set, text) {
    const knob = div().absolute().top(2).left(on ? 16 : 2).size(14).rounded_full().bg("#ffffff")
      .transition("left", { duration: 150, easing: "ease-out" });
    return div().id(id).flex().flex_row().items_center().gap(10).px(12).py(10).rounded(8).bg(t.surface)
      .border_1().border_color(t.border).cursor_pointer()
      .on_click((_e, cx) => { set(!on); cx.notify(); })
      .child(div().relative().w(32).h(18).flex_shrink_0().rounded_full().bg(on ? t.accent : t.input).child(knob))
      .child(div().flex().flex_col().gap(2).flex_1().min_w_0()
        .child(div().text_size(13).font_semibold().text_color(t.foreground).child(title))
        .child(div().text_size(11).text_color(t.muted).child(text)));
  }

  // ---- Version, changelog, upgrade (⚙ and the update window) ---------------

  initVersion(cx) {
    this.upgradeState = null; // null | "running" | "done" | "failed"
    this.upgradeMsg = "";
    this.changelog = null;
    this.changelogFor = null;
    this.installed = null;
    cx.spawn(async (cx) => {
      this.installed = await installedVersion();
      const u = shared(UPDATE_KEY);
      // Opened before the bar's first check, or long after: ask now.
      if (!u?.checked || Date.now() - u.checked > 15 * 60e3 || u.current !== this.installed) await checkForUpdate();
      cx.notify();
    });
  }

  checkNow(cx) {
    if (this.checkingNow) return;
    this.checkingNow = true;
    cx.notify();
    cx.spawn(async (cx) => {
      this.installed = await installedVersion();
      await checkForUpdate();
      this.changelogFor = null;
      this.checkingNow = false;
      cx.notify();
    });
  }

  // CHANGELOG.md from main, fetched once per latest version while a newer one is shown.
  loadChangelog(cx, u) {
    if (this.changelogFor === u.latest) return;
    this.changelogFor = u.latest;
    this.changelog = null;
    cx.spawn(async (cx) => {
      try {
        const md = await fetchText(`${RAW}/CHANGELOG.md`);
        this.changelog = changesSince(md, u.current) || "_No notes for this version._";
      } catch (e) {
        this.changelog = `_Couldn't load the changelog: ${String(e?.message ?? e)}_`;
      }
      cx.notify();
    });
  }

  startUpgrade(cx) {
    if (this.upgradeState === "running") return;
    this.upgradeState = "running";
    this.upgradeMsg = "Downloading and installing…";
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        const { version, added, keysNote } = await upgrade();
        this.upgradeState = "done";
        this.upgradeMsg = `Upgraded to ${version}.${added ? ` Added ${added} new key${added === 1 ? "" : "s"}.` : ""}${keysNote}`;
        setShared(UPDATE_KEY, { ...(shared(UPDATE_KEY) ?? {}), current: version, latest: version, checked: Date.now(), error: null });
        notify({ title: `NiuMa upgraded to ${version}`, body: `The layout and mods reload by themselves.${keysNote}`, level: "success", timeout: 5000 });
      } catch (e) {
        this.upgradeState = "failed";
        this.upgradeMsg = `Upgrade failed: ${String(e?.message ?? e)}`;
        notify({ title: "NiuMa upgrade failed", body: String(e?.message ?? e), level: "error" });
      }
      cx.notify();
    });
  }

  // The version card: installed vs latest, Check now, Sponsor; with a newer version, what
  // changed and Upgrade.
  renderVersion(t, cx, { sponsor }) {
    const u = shared(UPDATE_KEY) ?? {};
    const installed = this.installed ?? u.current;
    const newer = isNewer({ ...u, current: installed });
    const latestText = this.checkingNow ? "checking…" : u.latest ?? (u.error ? "couldn't check" : "checking…");
    const chip = newer ? ["Update available", t.accent]
      : u.latest && !this.checkingNow ? ["Up to date", t.done] : u.error && !this.checkingNow ? ["Offline?", t.blocked] : null;
    const fact = (label, value) => div().flex().flex_col().gap(1)
      .child(div().text_size(10.5).text_color(t.dim).child(label))
      .child(div().text_size(13).font_semibold().text_color(t.foreground).font_family("JetBrains Mono").child(value));
    const card = div().flex().flex_col().gap(10).p(12).rounded(8).bg(t.surface).border_1().border_color(newer ? t.accent : t.border)
      .child(div().flex().flex_row().items_center().gap(14)
        .child(div().text_size(15).child("🐄"))
        .child(fact("Installed", installed ?? "unknown"))
        .child(fact("Latest", latestText))
        .when(!!chip, (el) => el.child(div().text_size(10.5).px(7).py(2).rounded(10).border_1().border_color(chip[1]).text_color(chip[1]).child(chip[0])))
        .child(div().flex_1())
        .child(this.btn("check-now", this.checkingNow ? "Checking…" : "Check now", (_e, cx) => this.checkNow(cx)))
        .when(sponsor, (el) => el.child(this.btn("sponsor", "Sponsor", () => openUrl(SPONSOR_URL),
          { icon: "mods/niu-ma-bar/heart.svg", tint: true, tip: "Support NiuMa on GitHub Sponsors" }))))
      .when(!!u.error && !this.checkingNow, (el) => el.child(div().text_size(11).text_color(t.muted).truncate()
        .child(`Last check failed: ${u.error}`)));
    if (!newer && this.upgradeState !== "done") return card;
    if (newer) this.loadChangelog(cx, { latest: u.latest, current: installed });
    return card.child(div().h(1).bg(t.border))
      .child(div().text_size(13).font_semibold().text_color(t.foreground)
        .child(this.upgradeState === "done" ? this.upgradeMsg : `What's new in ${u.latest}`))
      .when(this.upgradeState !== "done", (el) => el
        .child(div().id("changelog").max_h(220).overflow_y_scrollbar().text_size(12).text_color(t.foreground)
          .child(this.changelog == null ? div().text_color(t.muted).child("Loading the changelog…")
            : TextView.markdown("changelog-md", this.changelog).selectable(true)))
        .child(div().flex().flex_row().items_center().gap(8)
          .child(div().flex_1().text_size(11).truncate()
            .text_color(this.upgradeState === "failed" ? t.blocked : t.muted)
            .child(this.upgradeMsg || "Your previous files are kept in ~/.config/herdr-app/.niu-ma-backup."))
          .child(this.btn("upgrade", this.upgradeState === "running" ? "Upgrading…" : `Upgrade to ${u.latest}`,
            (_e, cx) => this.startUpgrade(cx), { primary: true, icon: "mods/niu-ma-bar/arrow-up-circle.svg", tint: true }))));
  }

  renderUpgradeWindow(cx) {
    const t = theme();
    const overlay = props()?.overlay;
    return div().id("upgrade-window").size_full().flex().flex_col().gap(10).p(16).bg(t.popover)
      .child(div().text_size(15).font_semibold().text_color(t.foreground).child("NiuMa update"))
      .child(div().id("upgrade-scroll").flex_1().min_h_0().overflow_y_scrollbar().child(this.renderVersion(t, cx, { sponsor: false })))
      .child(div().flex().flex_row().items_center().gap(8)
        .child(div().id("sponsor-link").text_size(11.5).text_color(t.accent).cursor_pointer()
          .on_click(() => openUrl(SPONSOR_URL)).child("♥ Sponsor NiuMa"))
        .child(div().flex_1())
        .child(this.btn("upgrade-close", "Close", () => overlay && closeOverlay(overlay))));
  }

  renderMain() {
    const t = theme();
    const f = focused();
    const all = spaces();
    const space = all.find((s) => s.id === f?.space) ?? all.find((s) => s.active);
    const tabs = (space?.tabs ?? []).filter((tb) => !tb.settled);
    const here = panes().filter((p) => p.tab === f?.tab);
    const dot = { blocked: t.blocked, done: t.done, working: t.working };
    // Every space as a pill: its most urgent agent's status, its name; click to go there.
    const spacePill = (sp) => {
      const on = sp.id === space?.id;
      return div().id(`space-${sp.id}`).flex_none().h(24).px(9).rounded(7).flex().flex_row().items_center().gap(6)
        .max_w(190).text_size(12).text_color(on ? t.foreground : t.muted)
        .bg(on ? t.selected : "#00000000").border_1().border_color(on ? t.input : "#00000000")
        .hover((s) => s.bg(on ? t.selected : t.hover)).cursor_pointer()
        .on_click(() => run("space.select", { id: sp.id }))
        .tooltip(`${sp.name}${sp.branch ? ` · ${sp.branch}` : ""}${sp.machine ? ` · on ${sp.machine}` : ""}`)
        .child(div().flex_none().size(7).rounded_full().bg(dot[sp.status] ?? t.dim).opacity(dot[sp.status] ? 1 : 0.5))
        .child(div().truncate().when(on, (el) => el.font_semibold()).child(sp.name))
        .when(!!sp.machine, (el) => el.child(div().flex_none().text_size(10).text_color(t.dim).child(`@${sp.machine}`)));
    };
    const tabPill = (tb) => div().id(`tab-${tb.id}`).flex_none().h(22).px(8).rounded(6).flex().items_center().gap(5)
      .text_size(11.5).text_color(tb.active ? t.foreground : t.muted)
      .bg(tb.active ? t.selected : "#00000000").hover((s) => s.bg(t.hover)).cursor_pointer()
      .on_click(() => run("tab.select", { id: tb.id }))
      .child(tb.named ? tb.name : `Tab ${tb.name}`)
      .when(tb.panes > 1, (el) => el.child(div().text_size(10).text_color(t.dim).child(`×${tb.panes}`)));
    return div().id("bar").size_full().flex().flex_row().items_center().gap(8).px(10).bg(t.chrome)
      .child(div().flex_none().text_size(15).child(here.length > 1 ? "🐎" : "🐄"))
      .child(div().flex().flex_row().items_center().gap(3).min_w(0).flex_shrink(1).overflow_hidden().children(all.map(spacePill)))
      .child(div().id("space-new").flex_none().size(24).rounded(7).flex().items_center().justify_center()
        .hover((s) => s.bg(t.hover)).cursor_pointer().tooltip("New space (⌘N)")
        .on_click(() => run("space.new"))
        .child(svg("mods/workspace-chrome/plus.svg").size(13).text_color(t.muted)))
      .child(div().flex_none().w(1).h(18).bg(t.border))
      .when(!!space?.branch, (el) => el.child(div().flex_none().flex().flex_row().items_center().gap(3).text_size(11).text_color(t.dim)
        .child(svg("mods/workspace-chrome/git-branch.svg").size(11).text_color(t.dim)).child(space.branch)))
      .child(div().flex_none().text_size(11).text_color(t.dim).child(`${here.length} panel${here.length === 1 ? "" : "s"}`))
      .when(tabs.length > 1, (el) => el.child(div().flex_none().flex().flex_row().gap(2).children(tabs.map(tabPill))))
      .child(div().flex_1())
      .when(isNewer(shared(UPDATE_KEY)), (el) => el.child(div().id("update-available").flex_none().h(24).px(7).rounded(6)
        .flex().flex_row().items_center().gap(4).text_size(11).text_color(t.accent)
        .bg(t.raised).border_1().border_color(t.accent).hover((s) => s.bg(t.hover)).cursor_pointer()
        .tooltip(`NiuMa ${shared(UPDATE_KEY).latest} is available`)
        .on_click(() => openOverlay({ mod: "niu-ma-bar", props: { role: "upgrade" }, kind: "dialog", width: 560, height: 520 }))
        .child(svg("mods/niu-ma-bar/arrow-up-circle.svg").size(13).text_color(t.accent))
        .child("Update")))
      .child(div().id("agent-settings").flex_none().size(24).rounded(6).flex().items_center().justify_center()
        .hover((s) => s.bg(t.hover)).cursor_pointer().tooltip("Agent start commands")
        .on_click(() => openOverlay({ mod: "niu-ma-bar", props: { role: "agents" }, kind: "dialog", width: 600, height: 680 }))
        .child(svg("mods/workspace-chrome/settings.svg").size(14).text_color(t.muted)))
      .child(this.btn("split", "Split", () => this.split(), { icon: "mods/workspace-chrome/plus.svg", tint: true, tip: "New panel in this tab (⌘T)" }))
      .children(this.agents.map((a, i) => this.btn(`agent-${a.key}`, a.name, () => this.split(a.run),
        { icon: a.icon, tint: a.tint, primary: i === 0, tip: `New ${a.name} panel${i === 0 ? " (⌘⇧T)" : ""}` })));
  }

  renderShell() {
    const t = theme();
    const addr = this.shellAddress();
    const term = terminals().find((x) => x.address === addr);
    const f = focused();
    const space = spaces().find((s) => s.id === f?.space);
    const folder = panes().find((p) => p.pane === f?.pane)?.cwd ?? space?.folder;
    const send = (text) => addr && hc(["send", "--force", addr, text]).catch(() => null);
    return div().id("shellbar").size_full().flex().flex_row().items_center().gap(8).px(10).bg(t.chrome)
      .border_t_1().border_color(t.border)
      .child(svg("mods/workspace-chrome/terminal.svg").size(13).text_color(t.accent))
      .child(div().text_size(12).font_semibold().text_color(t.foreground).child("Shell"))
      .child(div().text_size(11).text_color(t.dim).truncate().child(term ? tilde(term.cwd) : "starting…"))
      .child(div().flex_1())
      .when(!!folder, (el) => el.child(this.btn("cd", `cd ${tilde(folder)}`, () => {
        send(`cd ${quote(folder)}`);
        if (addr) run("pane.focus", { terminal: addr });
      }, { tip: "Go to the focused panel's folder" })))
      .child(this.btn("clear", "Clear", () => send("clear")))
      .child(this.btn("restart", "Restart", () => addr && run("terminal.kill", { terminal: addr }),
        { tip: "End this shell; a fresh one starts in a moment" }));
  }
}
