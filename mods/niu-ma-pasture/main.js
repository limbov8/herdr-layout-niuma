// NiuMa pasture: a meadow under far mountains, a creek and drifting clouds. Every agent is a
// pixel horse or cow (sixteen breeds and sizes, plus a bull, ox, water buffalo and bison;
// picked when it arrives and kept with its spot; a rare unicorn, and in November and
// December a Christmas moose), scattered over the
// meadow and never on the water; nearer ones are larger.
//   working  grazing, or drinking at the creek (head bobbing, tail swishing)
//   idle     standing, tail swishing
//   blocked  standing with a red "!" sign over its head
//   done     lying down, eyes closed, happy
// Over each animal: a name tag with a summary of the last question it was asked, its space
// and tab. Under its feet, centred: its status badge. The status counts sit at the bottom
// centre, between the two runs of an oak fence along the front.
// Click to go there; it also rears, bucks, paws or tosses its head (a horse), or hops,
// paws, shakes its head or moos (a cow). Animals keep their spot; new ones fade in.
// Sub-agents are small animals (rabbits, squirrels, hedgehogs) around their horse or cow:
// Herdr's own (terminals an agent started with `hc run`) and Claude Code's (its Task/Agent
// calls, read off the agent's screen). Busy, they nibble and hop about; finished, they run
// off the edge of the meadow.
// Plain terminals (no agent) are a cooking pot, fire pit or magic crystal, much smaller:
// unlit/dim when idle; flames, bubbles, steam or a pulse while a command runs (a small
// steady blue flame for an interactive program); a green flash on success; red sparks on
// failure, its exit code staying up until you click it or run another command. A command
// running over 2 s gets a dark bubble with the command, project and elapsed time. Running
// state comes from the core's foreground process; the command, times and exit codes from
// shell/niu-ma.zsh, which labels the terminal (see that file). The sky follows the clock
// (evening 17–19, night 19–6) or is pinned by clicking the sun or moon; the app theme is separate.
// Props: { demo: true } draws made-up agents and terminals in every state (for screenshots);
// { sky: "day" | "evening" | "night" } pins the sky over the click choice.
// Art: sprites/ (tools/sprites.py). Scenery is drawn natively with gradients and paths.
import { View, div, image, PathBuilder, Background } from "gpui-kit";
import { agents, terminals, spaces, panes, run, hc, settings, props } from "herdr";

const DIR = "mods/niu-ma-pasture/sprites";
const AW = 36, AH = 28, FEET = 27;
// Head top (art px) in each pose, for the name tag and the "!" sign.
const HEAD_TOP = { stand: 1, graze: 10, sit: 5 };
const BREEDS = [
  { key: "chestnut", kind: "horse", name: "Chestnut horse", size: 1.0 },
  { key: "holstein", kind: "cow", name: "Holstein cow", size: 1.1 },
  { key: "grey", kind: "horse", name: "Grey horse", size: 1.0 },
  { key: "jersey", kind: "cow", name: "Jersey cow", size: 0.88 },
  { key: "palomino", kind: "horse", name: "Palomino", size: 0.95 },
  { key: "highland", kind: "cow", name: "Highland cow", size: 0.92 },
  { key: "black", kind: "horse", name: "Black horse", size: 1.05 },
  { key: "hereford", kind: "cow", name: "Hereford cow", size: 1.05 },
  { key: "pinto", kind: "horse", name: "Pinto pony", size: 0.78 },
  { key: "angus", kind: "cow", name: "Angus cow", size: 1.05 },
  { key: "bay", kind: "horse", name: "Bay horse", size: 1.0 },
  { key: "galloway", kind: "cow", name: "Belted Galloway", size: 0.95 },
  { key: "buckskin", kind: "horse", name: "Buckskin horse", size: 0.95 },
  { key: "brownswiss", kind: "cow", name: "Brown Swiss cow", size: 1.12 },
  { key: "appaloosa", kind: "horse", name: "Appaloosa", size: 0.95 },
  { key: "shire", kind: "horse", name: "Shire draft horse", size: 1.25 },
  // Other cattle (they act like cows): added later, so see breedOf.
  { key: "bull", kind: "cow", name: "Bull", size: 1.18 },
  { key: "ox", kind: "cow", name: "Ox", size: 1.22 },
  { key: "buffalo", kind: "cow", name: "Water buffalo", size: 1.12 },
  { key: "bison", kind: "cow", name: "Bison", size: 1.2 },
  // Rare: about one new agent in ten (see newBreed). Acts like a horse; sparkles.
  { key: "unicorn", kind: "horse", name: "Unicorn", size: 1.0 },
  // Seasonal: in November and December about one new agent in five (see newBreed). Acts
  // like a horse; its antler lights twinkle. Out of season a saved moose shows as another breed.
  { key: "moose", kind: "horse", name: "Christmas moose", size: 1.22 },
];
const REGULAR = BREEDS.length - 2; // the breeds before the unicorn and the moose
const MOOSE_SEASON = () => new Date().getMonth() >= 10; // November, December
// Where the moose's antler lights are (art px, facing right) in each still pose.
const MOOSE_LIGHTS = {
  stand: [[23.0, 2.2], [24.6, 1.4], [26.0, 2.4], [30.8, 1.8], [32.4, 1.6]],
  graze: [[23.6, 14.8], [25.2, 14.1], [26.4, 15.0], [30.6, 14.8], [32.0, 14.6]],
  sit: [[23.0, 6.2], [24.6, 5.4], [26.0, 6.4], [30.8, 5.8], [32.4, 5.6]],
};
const STATUS = {
  working: { color: "#3d8be0", word: "Working", glyph: null },
  blocked: { color: "#e5484d", word: "Needs you", glyph: "!" },
  done: { color: "#3fb26b", word: "Done", glyph: "✓" },
  idle: { color: "#8b93a1", word: "Idle", glyph: "z" },
};
const CLOUDS = [
  { img: "cloud3", w: 52, h: 18, y: 0.06, s: 1.25, from: -0.12, to: 0.62, period: 150000, morph: 11000 },
  { img: "cloud1", w: 40, h: 16, y: 0.16, s: 1.0, from: 0.55, to: 1.0, period: 110000, morph: 9000 },
  { img: "cloud2", w: 30, h: 13, y: 0.03, s: 1.1, from: 0.3, to: 0.92, period: 130000, morph: 13000 },
  { img: "cloud4", w: 24, h: 11, y: 0.2, s: 1.0, from: 0.05, to: 0.45, period: 90000, morph: 7000 },
  { img: "cloud1", w: 40, h: 16, y: 0.11, s: 0.8, from: 0.95, to: 0.4, period: 170000, morph: 12000 },
];

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rand(seed) {
  let x = seed || 1;
  return () => ((x = Math.imul(x ^ (x >>> 15), 2246822507) ^ Math.imul(x ^ (x >>> 13), 3266489909)) >>> 0) / 4294967296;
}
const byAddress = (address) => agents().find((a) => a.address === address) ?? { address };
// The sky, separate from the app's theme: "auto" follows the clock (evening 17–19, night
// 19–6), or it's pinned to day, evening or night. Clicking the sun or moon cycles it.
const SKY_MODES = ["auto", "day", "evening", "night"];
const SKY_NAMES = { auto: "Auto (follows the clock)", day: "Day", evening: "Evening", night: "Night" };
const clockPhase = () => { const h = new Date().getHours(); return h < 6 || h >= 19 ? "night" : h >= 17 ? "evening" : "day"; };
const statusOf = (a) => (STATUS[a.status] ? a.status : "idle");
// An animal's breed is kept with its spot (`b`), picked from all of them when it arrives.
// A spot saved before there were 20 breeds has none: it keeps the one it had then.
const breedOf = (address, spot) => {
  if (spot?.b === "moose" && !MOOSE_SEASON()) return BREEDS[hash(`breed${address}`) % REGULAR];
  return BREEDS.find((b) => b.key === spot?.b) ?? BREEDS[hash(address) % 16];
};
const newBreed = (address) => (hash(`unicorn${address}`) % 10 === 0 ? "unicorn"
  : MOOSE_SEASON() && hash(`moose${address}`) % 5 === 0 ? "moose"
  : BREEDS[hash(`breed${address}`) % REGULAR].key);
// A remembered spot this version can use; anything else (an older format) is picked again.
const goodSpot = (s) => !!s && [s.xf, s.t].every((v) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1);
// Each animal's own size within its breed, 0.92 to 1.08.
const sizeOf = (address, spot) => breedOf(address, spot).size * (0.92 + ((hash(`size${address}`) % 1000) / 1000) * 0.16);
const poseOf = (st) => (st === "done" ? "sit" : st === "working" ? "graze" : "stand");
// What it's working on: the last prompt typed into it (a "❯", "›" or ">" line on its
// screen), else its title when that says more than the program's name.
const question = (a, asked) => {
  if (asked) return asked;
  const t = (a.title || "").replace(/^[^\p{L}\p{N}]+/u, "").replace(/\s+/g, " ").trim();
  return t && t.toLowerCase() !== (a.program?.name || "").toLowerCase() ? t : "No question yet";
};
// Prompt lines on the screen, oldest first. The input box at the bottom (a "❯" line right
// under a "────" rule) is a draft, not a question yet.
const PROMPT = /^\s*[❯›>]\s+(\S.*)$/u;
const prompts = (lines) => lines.flatMap((l, i) => {
  const m = l.match(PROMPT);
  if (!m) return [];
  let k = i - 1;
  while (k >= 0 && !lines[k].trim()) k--;
  return k >= 0 && /^\s*[─━-]{8,}\s*$/u.test(lines[k]) ? [] : [{ i, text: m[1].trim() }];
});
const lastPrompt = (text) => {
  const found = prompts(text.split("\n"));
  return found.length ? found[found.length - 1].text.replace(/\s+/g, " ") : null;
};
const CRITTERS = ["rabbit", "squirrel", "bunny", "hedgehog"];
const CW = 16, CH = 12, CFEET = 11.6;
// Every sub-agent seen stays at least this long, so a quick one is still seen.
const MIN_STAY = 6000;
// What a horse or cow does when clicked, a random one each time (sprites/*-act-*,
// tools/actions.py, drawn on a 44 x 38 grid with the usual one at 4, 10). Each step: a frame,
// how long it shows, and how far the animal leaves the ground (art units). Horses rear,
// paw the air, buck, paw the ground, toss their head and piaffe; cows don't rear or piaffe:
// they kick up their heels, paw the ground, shake their head and moo.
const ACT_W = 44, ACT_H = 38, ACT_X = 4, ACT_Y = 10;
const steps = (a, b, n, ms, lift = 0) => Array.from({ length: n * 2 }, (_, i) => [i % 2 ? b : a, ms, i % 2 ? 0 : lift]);
const ACTIONS = {
  horse: [
    { key: "rear", steps: [["rear-a", 1300, 0]] },
    { key: "paw-air", steps: steps("rear-a", "rear-b", 3, 230) },
    { key: "buck", steps: [["buck", 260, 2.5], ["buck", 520, 0]] },
    { key: "paw", steps: steps("paw-a", "paw-b", 3, 260), dust: "paw-b" },
    { key: "toss", steps: steps("toss-up", "toss-down", 3, 230) },
    { key: "piaffe", steps: steps("trot-a", "trot-b", 4, 280, 0.8) },
  ],
  cow: [
    { key: "hop", steps: [["hop", 300, 4], ["hop", 260, 0], ["hop", 300, 4], ["hop", 260, 0]] },
    { key: "paw", steps: steps("paw-a", "paw-b", 3, 280), dust: "paw-b" },
    { key: "shake", steps: steps("shake-a", "shake-b", 3, 170) },
    { key: "moo", steps: [["moo", 1500, 0]], say: "Moo!" },
  ],
};
// Plain terminals' objects. "mixed" picks one per terminal; or "pot", "firepit", "crystal".
const OBJ_VARIANT = "mixed";
const OBJ_KINDS = ["firepit", "pot", "crystal"];
const OW = 12, OH = 12, OFEET = 11.2;
const OBJ_SIZE = 0.75;        // of an animal's scale at the same depth
const TIP_AFTER = 2000;       // a running command's bubble shows after this long
const SUCCESS_SHOW = 4000;    // the green flash, then back to idle
const BURST = 2500;           // red sparks after a failure
const ALWAYS_INTERACTIVE = new Set(["vim", "nvim", "vi", "nano", "emacs", "less", "more", "man", "top", "htop", "btop",
  "ssh", "mosh", "psql", "mysql", "sqlite3", "redis-cli", "mongosh", "lazygit", "tig", "tmux", "fzf", "k9s", "bash",
  "zsh", "fish", "sh", "claude", "codex"]);
const REPLS = new Set(["python", "python3", "node", "ipython", "irb", "ghci", "lua", "r", "deno", "bun", "julia"]);
const base = (p) => String(p ?? "").split("/").pop();
// A program waiting on you rather than working: an editor, pager, REPL (an interpreter with
// no script; macOS reports Python as "Python"), a remote shell.
const interactive = (fg) => {
  const names = [fg?.name, base(fg?.argv?.[0])].map((n) => String(n ?? "").toLowerCase());
  const repl = names.some((n) => REPLS.has(n) || REPLS.has(n.replace(/[0-9.]+$/, "")));
  return names.some((n) => ALWAYS_INTERACTIVE.has(n)) || (repl && (fg?.argv?.length ?? 0) <= 1);
};
const elapsed = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
  return `${Math.floor(s / 3600)}h ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")}m`;
};
const clip = (t, n) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

// Made-up agents, sub-agents and terminals for { demo: true }, timed off `now` so each
// stays in its state.
function demo(now) {
  const prog = { name: "Claude Code", key: "claude", agent: true };
  const ag = (address, status, space_name, tab, title) =>
    ({ address, pane: "", space: "demo", space_name, tab: address, tab_index: tab - 1, tab_name: "", status, title, program: prog });
  const list = [
    ag("d1", "working", "my-app", 1, "Add a dark mode toggle to settings"),
    ag("d2", "blocked", "api-server", 2, "Approve the database migration?"),
    ag("d3", "done", "docs", 1, "Write the release notes for 2.4"),
    ag("d4", "idle", "my-app", 3, "Refactor the auth middleware"),
    ag("d5", "working", "web-ui", 1, "Speed up image uploads"),
    ag("d6", "working", "engine", 2, "Profile the render loop"),
  ];
  const term = (address, space, state, cmd, extra = {}) => ({
    address, state: "live", pid: 1, parent: null, cwd: "~", labels: { "herdr.space": space, "niu-ma.state": state, "niu-ma.cmd": cmd, ...extra.labels },
    foreground: extra.fg ?? { pid: 1, name: "zsh", argv: ["zsh"] },
  });
  const all = [
    ...list.map((a) => ({ address: a.address, state: "live", status: a.status, turn: 1, labels: {} })),
    term("p1", "web-ui", "running", "npm run dev", { labels: { "niu-ma.start": String(now - 95000) }, fg: { pid: 2, name: "node", argv: ["node", "vite"] } }),
    term("p2", "api-server", "done", "pytest tests/api -x", { labels: { "niu-ma.start": String(now - 43000), "niu-ma.end": String(now - 900), "niu-ma.exit": "1" } }),
    term("p3", "engine", "done", "cargo build --release", { labels: { "niu-ma.start": String(now - 61000), "niu-ma.end": String(now - 600), "niu-ma.exit": "0" } }),
    term("p4", "notebooks", "running", "python3", { labels: { "niu-ma.start": String(now - 300000) }, fg: { pid: 3, name: "Python", argv: ["python3"] } }),
  ];
  const subs = {
    d1: [{ name: "Find the settings screens", done: false }, { name: "Check the theme tokens", done: false }],
    d5: [{ name: "Benchmark the upload path", done: false }],
    d6: [{ name: "Read the frame timings", done: false }, { name: "Trace the GPU calls", done: false }, { name: "Diff the shaders", done: false }],
  };
  const names = { "web-ui": "web-ui", "api-server": "api-server", engine: "engine", notebooks: "notebooks" };
  // Fixed spots, spread out and clear of the creek and each other's tags.
  const spots = {
    d1: { xf: 0.79, t: 0.42 }, d2: { xf: 0.09, t: 0.3 }, d3: { xf: 0.42, t: 0.05, b: "bison" },
    d4: { xf: 0.22, t: 0.5, b: "unicorn" }, d5: { xf: 0.37, t: 0.28 }, d6: { xf: 0.95, t: 0.12, b: "bull" },
    "obj:p1": { xf: 0.69, t: 0.12 }, "obj:p2": { xf: 0.31, t: 0.86 }, "obj:p3": { xf: 0.05, t: 0.72 }, "obj:p4": { xf: 0.89, t: 0.75 },
  };
  return { list, all, subs, names, spots };
}
const PLAIN_TOOLS = new Set(["Bash", "Read", "Write", "Edit", "MultiEdit", "Update", "Grep", "Glob", "Search", "List",
  "WebFetch", "WebSearch", "Fetch", "TodoWrite", "NotebookEdit", "Skill", "BashOutput", "KillShell", "ToolSearch"]);
// Claude Code's sub-agents in the current turn (after the last prompt): a "⏺ Task(…)" or
// "⏺ Agent(…)" call, or any call whose output counts tool uses. Finished: "Done (" under
// it, or for a backgrounded one a later `⏺ Agent "…" finished` (completed, failed, stopped).
const subAgents = (text) => {
  const lines = text.split("\n");
  const found = prompts(lines);
  const start = found.length ? found[found.length - 1].i : 0;
  const out = [];
  // Each name's runs in order: a name seen again after it finished is a new run. The
  // same sub-agent shows up to three times (its call, the launch list, the task list),
  // cut short with "…" or wrapped in a narrow pane: a name that starts another is it.
  const runs = new Map();
  const same = (a, b) => a === b || (Math.min(a.length, b.length) >= 6 && (a.startsWith(b) || b.startsWith(a)));
  const add = (name, done) => {
    const cut = /(?:…|\.\.\.)\s*$/u.test(name);
    let key = name.replace(/\s*(?:…|\.\.\.)\s*$/u, "").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!key) return;
    // A cut name only ever finishes the one sub-agent it can be; it never adds one.
    const matches = [...runs.keys()].filter((k) => same(k, key));
    const known = matches.includes(key) ? key : matches.length === 1 ? matches[0] : null;
    if (matches.length > 1 && !known) return;
    if (cut && known && !done) return;
    if (known && key.length > known.length) {
      const list = runs.get(known);
      for (const sub of list) sub.name = key;
      runs.delete(known); runs.set(key, list);
    } else if (known) key = known;
    const list = runs.get(key) ?? [];
    const last = list[list.length - 1];
    if (last && !(last.done && !done)) { if (done) last.done = true; return; }
    const sub = { name: key, done };
    list.push(sub); runs.set(key, list); out.push(sub);
  };
  let footer = false;
  for (let i = start; i < lines.length; i++) {
    let l = lines[i];
    // A wrapped `⏺ Agent "…` or `⏺ 2 background agents` line: join its continuation.
    for (let j = i + 1; j < Math.min(lines.length, i + 4) && /^\s*[⏺●]\s+/u.test(l) && /^\s{2,}\S/u.test(lines[j])
      && ((/^\s*[⏺●]\s+(?:Agent|Task)\s+"/u.test(l) && !/^\s*[⏺●]\s+(?:Agent|Task)\s+".*"/u.test(l))
        || /^\s*[⏺●]\s+\d+\s+(?:background\s+)?agents?\s*$/u.test(l)); j++) {
      l = `${l.trimEnd()} ${lines[j].trim()}`;
      i = j;
    }
    // The task list under the prompt: `• main`, then `○ general-purpose  what it does  5s · ↓ 46.7k tokens`
    if (/^\s*[•●◉⏺]\s+main\s*$/u.test(l)) { footer = true; continue; }
    if (footer) {
      const f = l.match(/^\s*([○◯◌●◉•✓✔✗✻])\s+[\w-]+\s{2,}(.+?)(?:\s{2,}\S.*)?$/u);
      if (f) { add(f[2].trim(), /[✓✔✗]/u.test(f[1])); continue; }
      if (l.trim()) footer = false;
    }
    // `⏺ Agent "…" finished · 4s` (completed, failed, stopped) ends one; any other
    // `⏺ Agent "…" …` line (e.g. "is waiting on its own background work") means it's out.
    // A fan-out's launch list names only the first few, so these find the rest.
    const e = l.match(/^\s*[⏺●]\s+(?:Agent|Task)\s+"(.+?)"\s+(.*)$/u);
    if (e) { add(e[1].trim(), /^(?:finished|completed|failed|stopped|was stopped|killed)\b/u.test(e[2])); continue; }
    // `⏺ 2 background agents launched` then `├ name` / `└ name`
    if (/^\s*[⏺●]\s+\d+\s+(?:background\s+)?agents?\s+launched/u.test(l)) {
      for (let j = i + 1; j < lines.length && /^\s*[├└│]/u.test(lines[j]); j++) {
        const n = lines[j].replace(/^\s*[├└│]\s*/u, "").trim();
        if (n) add(n, false);
      }
      continue;
    }
    // `⏺ Agent(what it does) Haiku 5.5`, or any call whose output counts tool uses
    const m = l.match(/^\s*[⏺●]\s+([A-Z][\w-]*)\((.*?)\)?\s*$/u);
    if (!m) continue;
    let j = i + 1;
    while (j < lines.length && !/^\s*[⏺●]\s/u.test(lines[j]) && !PROMPT.test(lines[j])) j++;
    const block = lines.slice(i + 1, j).join("\n");
    const counted = /\d+\s+tool uses?|tool uses? ·|Initializing…|Backgrounded agent/u.test(block);
    if (!(m[1] === "Task" || m[1] === "Agent" || (counted && !PLAIN_TOOLS.has(m[1])))) continue;
    const what = m[2].replace(/\)\s*[^()]*$/u, "").replace(/^["']|["']$/g, "").trim();
    add(`${m[1] === "Task" || m[1] === "Agent" ? "" : `${m[1]}: `}${what}`, /Done \(/u.test(block));
  }
  return out;
};
// The question cut to its first clause, at most `max` characters on a word boundary.
const summary = (q, max = 44) => {
  let s = q.replace(/^(please|pls|can you|could you|could we|can we|let'?s|i want to|i'd like to)\s+/i, "").trim();
  s = s.split(/(?<=[.?!;])\s|\s[-–—]\s|,\s(?=and |also |then )/)[0].trim();
  if (s.length > max) s = `${s.slice(0, max).replace(/\s+\S*$/, "")}…`;
  return s ? s[0].toUpperCase() + s.slice(1) : q;
};

export default class Pasture extends View {
  init(_props, cx) {
    this.size = { width: 1200, height: 340 };
    // Spots survive a reinstall: drop any this version can't place, so they're picked again.
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem("spots") ?? "{}") ?? {}; } catch { saved = {}; }
    this.spots = Object.fromEntries(Object.entries(saved).filter(([, s]) => goodSpot(s)));
    this.known = null;
    this.entering = {};
    this.asked = {};
    this.subs = {};
    this.critterAt = {};
    this.leaving = {};
    this.firstSeen = {};
    this.fgSince = {};
    this.fgDone = {};
    this.acked = {};
    this.acting = {};
    this.drag = null; // ⇧⌃-drag moving an animal or object: {key, x0, y0, xf0, t0, xf, t, moved}
    this.flip = null; // ⌃-click on an animal: turn it round on release
    this.acts = {};
    this.hoverObj = null;
    // Elapsed times tick and flashes end: redraw once a second only while one is showing.
    cx.timer.every(1000, (cx) => { if (this.ticking) cx.notify(); });
    this.skyMode = SKY_MODES.includes(localStorage.getItem("sky")) ? localStorage.getItem("sky") : "auto";
    this.clock = clockPhase();
    cx.timer.every(60000, (cx) => {
      if (clockPhase() !== this.clock) { this.clock = clockPhase(); cx.notify(); }
    });
    // Working agents' screens change: their sub-agents come and go, a queued message
    // becomes the question. Others have none running.
    cx.timer.every(2500, (cx) => {
      if (this.demo) return;
      for (const a of agents()) {
        if (a.status === "working") this.ask(a.address, cx, 2000);
        else if (this.subs[a.address]?.some((sub) => !sub.done)) {
          this.subs[a.address] = this.subs[a.address].map((sub) => ({ ...sub, done: true }));
          cx.notify();
        }
      }
    });
  }

  geom() {
    // The reported size is in zoomed pixels; this mod's own pixels get zoomed too.
    const z = Number(settings()?.zoom) || 1;
    const W = Math.max(200, this.size.width / z), H = Math.max(120, this.size.height / z);
    const k = Math.min(1.8, Math.max(0.55, H / 320));
    const yH = Math.round(H * 0.38);
    const g0 = yH + H * 0.07, g1 = H - 16 * k;
    return {
      W, H, k, yH, z,
      feet: (t) => g0 + t * (g1 - g0),
      depth: (y) => Math.min(1, Math.max(0, (y - g0) / (g1 - g0))),
      scale: (t) => (2.0 + 2.8 * t) * k, // the nearest are 2.4× the farthest
      // The creek, by y: centre and half width.
      creek: (y) => {
        const t = Math.min(1, Math.max(0, (y - yH) / (H - yH)));
        return { cx: W * (0.63 - 0.11 * t) + Math.sin(t * 5.2) * W * 0.03, hw: (3 + 44 * Math.pow(t, 1.4)) * k + W * 0.006 * t };
      },
    };
  }

  // Whether an animal at (x, feet y) with scale p would stand in the creek, and where the
  // nearest dry spots on either side are.
  wet(g, x, y, p) {
    let lo = Infinity, hi = -Infinity;
    for (const dy of [0, 3, 6, 9]) {
      const c = g.creek(y - dy * p);
      lo = Math.min(lo, c.cx - c.hw); hi = Math.max(hi, c.cx + c.hw);
    }
    const margin = 4 * g.k;
    const left = lo - margin - 34 * p, right = hi + margin - 2 * p;
    return { hit: x + 34 * p > lo - margin && x + 2 * p < hi + margin, left, right };
  }

  dry(g, x, y, p) {
    const w = this.wet(g, x, y, p);
    if (!w.hit) return x;
    const max = g.W - AW * p - 4;
    const options = [w.left, w.right].filter((v) => v >= 4 && v <= max);
    if (!options.length) return w.left >= 4 ? w.left : Math.min(max, w.right);
    return options.sort((a, b) => Math.abs(a - x) - Math.abs(b - x))[0];
  }

  // A new animal's spot: of a few dozen tries away from the water, the one farthest from
  // everyone already there.
  // What a spot covers: the body, and for an animal its name tag over the head.
  boxes(key, spot, g) {
    const y = g.feet(spot.t);
    if (key.startsWith("obj:")) {
      const p = g.scale(spot.t) * OBJ_SIZE, w = OW * p, x = spot.xf * g.W - w / 2;
      return { body: [x, y - OFEET * p, w, OFEET * p], tag: null };
    }
    const p = g.scale(spot.t) * sizeOf(key, spot), w = AW * p, x = spot.xf * g.W - w / 2;
    const fs = Math.min(13, Math.max(10.5, 2.1 * p + 1)), tagH = fs * 2 + 10;
    const tw = Math.max(150, Math.min(260, w + 70));
    return { body: [x + 3 * p, y - 26 * p, 30 * p, 26 * p],
      tag: [x + w / 2 - tw / 2, y - FEET * p + HEAD_TOP.stand * p - tagH - 4, tw, tagH] };
  }

  // How much a spot overlaps the others, as a share of its body: bodies count fully, a tag
  // over a body half, two tags a little.
  crowding(key, spot, g, others) {
    const area = (a, b) => (a && b ? Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0]))
      * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1])) : 0);
    const me = this.boxes(key, spot, g);
    let sum = 0;
    for (const [k, o] of others) {
      if (k === key) continue;
      const it = this.boxes(k, o, g);
      sum += area(me.body, it.body) + 0.5 * (area(me.tag, it.body) + area(me.body, it.tag)) + 0.25 * area(me.tag, it.tag);
    }
    return sum / (me.body[2] * me.body[3]);
  }

  // The least crowded of 120 dry spots, then the one farthest from everyone.
  pick(key, g, others, keep = {}) {
    const r = rand(hash(`spot${key}`));
    let best = null, bestCost = Infinity, bestFar = -1;
    for (let i = 0; i < 120; i++) {
      const spot = { ...keep, xf: 0.03 + r() * 0.94, t: r() };
      const { body } = this.boxes(key, spot, g);
      const p = g.scale(spot.t) * (key.startsWith("obj:") ? OBJ_SIZE : sizeOf(key, spot));
      const x = spot.xf * g.W - (key.startsWith("obj:") ? OW : AW) * p / 2, y = g.feet(spot.t);
      if (body[0] < 4 || body[0] + body[2] > g.W - 4 || this.wet(g, x, y, p).hit) continue;
      const cost = Math.round(this.crowding(key, spot, g, others) * 50) / 50;
      let far = 10;
      for (const [k, o] of others) if (k !== key) far = Math.min(far, Math.hypot((spot.xf - o.xf) * 4, spot.t - o.t));
      if (cost < bestCost || (cost === bestCost && far > bestFar)) { best = spot; bestCost = cost; bestFar = far; }
    }
    return best ?? { ...keep, xf: 0.03 + r() * 0.94, t: r() };
  }

  // Remembered spots picked at another size can end up crowded: move those (later
  // addresses first) once at start and whenever the meadow's size changes a lot.
  spread(g, live) {
    const sizeKey = `${Math.round(g.W / 80)}x${Math.round(g.H / 40)}`;
    if (this.spreadAt === sizeKey || this.demo) return false;
    this.spreadAt = sizeKey;
    const keys = Object.keys(this.spots).filter((k) => k.startsWith("obj:") || live.has(k))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    const kept = [];
    let moved = false;
    for (const k of keys) {
      if (kept.length && this.crowding(k, this.spots[k], g, kept) > 0.15) {
        const { b, f } = this.spots[k];
        const spot = this.pick(k, g, kept, { ...(b ? { b } : {}), ...(f ? { f } : {}) });
        if (this.crowding(k, spot, g, kept) < this.crowding(k, this.spots[k], g, kept)) { this.spots[k] = spot; moved = true; }
      }
      kept.push([k, this.spots[k]]);
    }
    return moved;
  }

  render(cx) {
    const g = this.geom();
    this.demo = props()?.demo ? demo(Date.now()) : null;
    if (this.demo) { this.subs = this.demo.subs; Object.assign(this.spots, this.demo.spots); }
    const list = this.demo?.list ?? agents();
    const all = this.demo?.all ?? terminals();
    const live = new Set(list.map((a) => a.address));
    const parentOf = {};
    for (const t of all) if (t.parent && live.has(t.parent) && live.has(t.address)) parentOf[t.address] = t.parent;

    // Remember each grown-up's spot; a new one fades in there.
    let dirty = false;
    for (const addr of Object.keys(this.spots)) if (!addr.startsWith("obj:") && !live.has(addr)) { delete this.spots[addr]; dirty = true; }
    for (const a of list) {
      if (parentOf[a.address] || goodSpot(this.spots[a.address])) continue;
      this.spots[a.address] = this.pick(a.address, g, Object.entries(this.spots), { b: newBreed(a.address) });
      dirty = true;
      if (this.known) {
        this.entering[a.address] = true;
        cx.timer.after(80, (cx) => { delete this.entering[a.address]; cx.notify(); });
      }
    }
    if (this.spread(g, live)) dirty = true;
    if (dirty) localStorage.setItem("spots", JSON.stringify(this.spots));
    this.known = live;
    // A new turn means a new question: read it from the screen.
    for (const a of this.demo ? [] : list) {
      const turn = all.find((t) => t.address === a.address)?.turn ?? null;
      if (this.asked[a.address]?.turn !== turn) this.ask(a.address, cx, 0, turn);
    }

    const placed = this.place(list, parentOf, g);
    placed.sort((p, q) => p.y - q.y || p.x - q.x);
    const critters = this.critters(placed, all, g, cx);
    const objs = this.objects(all, list, g);
    const helpers = {};
    for (const c of critters) if (!c.leaving) helpers[c.parent] = (helpers[c.parent] ?? 0) + 1;
    const scene = [...placed.map((p) => ({ y: p.y, el: () => this.animal(p, g) })),
      ...critters.map((c) => ({ y: c.y, el: () => this.critter(c, g) })),
      ...objs.map((o) => ({ y: o.y, el: () => this.object(o, g) }))].sort((a, b) => a.y - b.y);

    const pinned = SKY_MODES.includes(props()?.sky) ? props().sky : this.skyMode;
    const phase = pinned === "auto" ? this.clock : pinned;
    this.night = phase === "night";
    this.evening = phase === "evening";
    return div().id("pasture").size_full().relative().overflow_hidden().bg(this.night ? "#0d1633" : "#9ad6ff")
      .on_size_change((size, cx) => { this.size = size; cx.notify(); })
      .on_mouse_move((e, cx) => this.dragTo(e, g, cx))
      .on_mouse_up("left", (_e, cx) => this.drop(g, cx))
      .on_mouse_up("right", (_e, cx) => this.drop(g, cx))
      .on_hover((on, cx) => { if (!on) this.drop(g, cx); })
      .when(!!this.drag, (el) => el.cursor_grabbing())
      .children([
        ...this.sky(g),
        ...this.land(g),
        ...scene.map((s) => s.el()),
        ...this.fence(g),
        ...placed.map((p) => this.tag(p, g, helpers[p.a.address] ?? 0)),
        ...objs.flatMap((o) => this.objTip(o, g)),
        ...(this.night ? [div().absolute().left(0).top(0).w(g.W).h(g.H).bg("#0a123014")] : []),
        ...(this.evening ? [div().absolute().left(0).top(g.yH - g.H * 0.2).w(g.W).h(g.H * 0.82).bg("#ff8a3d14")] : []),
        this.counts(list, g),
        ...(list.length ? [] : [this.empty(g)]),
      ]);
  }

  // ---- where everyone stands --------------------------------------------

  place(list, parentOf, g) {
    const out = [];
    const byAddr = {};
    const drinkers = [];
    const grown = list.filter((a) => !parentOf[a.address]).sort((a, b) => a.address.localeCompare(b.address, undefined, { numeric: true }));
    for (const a of grown) {
      const spot = this.spotOf(a.address) ?? { xf: 0.5, t: 0.5 };
      const h = hash(a.address);
      const st = statusOf(a);
      let face = !!((h >>> 5) & 1) !== !!spot.f ? "r" : "l"; // f: turned round with ⌃-click
      const y = g.feet(spot.t);
      const p = g.scale(spot.t) * sizeOf(a.address, spot);
      const sw = AW * p;
      let x = Math.min(g.W - sw - 4, Math.max(4, spot.xf * g.W - sw / 2));
      let drink = false;
      if (st === "working" && (h >>> 3) & 1) {
        // Drinking, if its own spot is near the creek: a step to the bank, nose at the water.
        const c = g.creek(y);
        const side = x + sw / 2 < c.cx ? "r" : "l";
        const nx = side === "r" ? c.cx - c.hw - 34.5 * p : c.cx + c.hw - 1.5 * p;
        const near = Math.abs(nx - x) < sw * 1.2;
        const crowded = drinkers.some((d) => d.side === side && Math.abs(d.y - y) < AH * p * 0.7);
        if (near && !crowded && nx >= 4 && nx + sw <= g.W - 4) {
          face = side; x = nx; drink = true;
          drinkers.push({ side, y });
        }
      }
      if (!drink) x = this.dry(g, x, y, p);
      const entering = this.entering[a.address];
      const item = { a, x, y, p, face, st, drink, breed: breedOf(a.address, spot), entering };
      out.push(item); byAddr[a.address] = item;
    }
    return out;
  }

  // ---- scenery ----------------------------------------------------------

  path(points, fill, curve = false) {
    let b = PathBuilder.fill().move_to(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      if (curve && i < points.length - 2) {
        const [nx, ny] = points[i + 1];
        b = b.curve_to((x + nx) / 2, (y + ny) / 2, x, y);
      } else b = b.line_to(x, y);
    }
    return window.paint_path(b.close().build(), fill).absolute().top(0).left(0).size_full();
  }

  grad(top, bottom) {
    return Background.linear_gradient(180, top, bottom);
  }

  sky(g) {
    const { W, H, yH, k } = g;
    const els = [this.path([[0, 0], [W, 0], [W, yH + 4], [0, yH + 4]],
      this.night ? this.grad("#0b1230", "#2c3f74") : this.evening ? this.grad("#5566ad", "#ffc183") : this.grad("#6ec3ff", "#dff4ff"))];
    // The sun or moon, in a box you can click to change the sky.
    const body = [];
    if (this.night) {
      const r = rand(7);
      for (let i = 0; i < 26; i++) {
        const x = r() * W, y = r() * yH * 0.8, s = r() < 0.2 ? 2 : 1;
        els.push(div().absolute().left(x).top(y).w(s).h(s).bg("#fff8dc")
          .loop("opacity", { from: 0.2 + r() * 0.3, to: 1, period: 1500 + r() * 3000 }));
      }
      body.push(div().absolute().left(8 * k).top(8 * k).size(44 * k).rounded_full().bg("#fff6c81a")
        .loop("opacity", { from: 0.5, to: 1, period: 4000 }));
      body.push(div().absolute().left(19 * k).top(19 * k).size(22 * k).rounded_full().bg("#f6f0d0")
        .child(div().absolute().left(9 * k).top(-3 * k).size(20 * k).rounded_full().bg("#1a2650")));
    } else {
      const eve = this.evening;
      body.push(div().absolute().left(0).top(0).size(60 * k).rounded_full().bg(eve ? "#ff8a3d55" : "#fff3b040")
        .loop("width", { from: 52 * k, to: 62 * k, period: 3600 }).loop("height", { from: 52 * k, to: 62 * k, period: 3600 }));
      body.push(div().absolute().left(15 * k).top(15 * k).size(30 * k).rounded_full().bg(eve ? "#ffa64d" : "#ffe680")
        .border_2().border_color(eve ? "#ffd29a" : "#fff6b8"));
    }
    const next = SKY_MODES[(SKY_MODES.indexOf(this.skyMode) + 1) % SKY_MODES.length];
    const sunY = this.evening ? yH - H * 0.33 - 30 * k : H * 0.1 - 14 * k;
    els.push(div().id("sky-body").absolute().left(W * 0.74 - 30 * k).top(sunY).size(60 * k).cursor_pointer()
      .tooltip(`Sky: ${SKY_NAMES[this.skyMode]} · click for ${SKY_NAMES[next]}`)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => {
        this.skyMode = next;
        localStorage.setItem("sky", next);
        cx.notify();
      })
      .children(body));
    CLOUDS.forEach((c, i) => {
      const s = c.s * 2 * k;
      const w = c.w * s, h = c.h * s;
      els.push(div().id(`cloud-${i}`).absolute().top(H * c.y).w(w).h(h).opacity(this.night ? 0.35 : this.evening ? 0.85 : 0.95)
        .loop("left", { from: c.from * W - w / 2, to: c.to * W - w / 2, period: c.period, easing: "linear" })
        .children([
          image(`${DIR}/${c.img}a.svg`).absolute().left(0).top(0).w(w).h(h)
            .loop("opacity", { from: 1, to: 0.15, period: c.morph }),
          image(`${DIR}/${c.img}b.svg`).absolute().left(0).top(0).w(w).h(h)
            .loop("opacity", { from: 0, to: 1, period: c.morph }),
        ]));
    });
    return els;
  }

  land(g) {
    const { W, H, yH, k } = g;
    const n = this.night;
    const els = [];
    // Far mountains with snow.
    const r = rand(42);
    const far = [[0, yH + 2]];
    const caps = [];
    for (let x = -40; x < W + 80; x += 90 + r() * 70) {
      const peak = yH - H * (0.14 + r() * 0.17);
      far.push([x, peak]);
      far.push([x + 45 + r() * 30, yH - H * (0.05 + r() * 0.06)]);
      if (yH - peak > H * 0.2) {
        const d = (yH - peak) * 0.28;
        caps.push([[x, peak], [x + d * 0.9, peak + d], [x + d * 0.35, peak + d * 0.75], [x, peak + d * 1.05],
          [x - d * 0.4, peak + d * 0.7], [x - d * 0.9, peak + d]]);
      }
    }
    far.push([W + 80, yH + 2]);
    els.push(this.path(far, n ? this.grad("#34446e", "#4a5d8a") : this.grad("#93acd6", "#cbdaee")));
    for (const c of caps) els.push(this.path(c, n ? "#c9d3ea" : "#fbfdff"));
    // Middle hills, bluish green.
    const mid = [[0, yH + 4], [0, yH - H * 0.06]];
    for (let x = 0; x <= W + 120; x += 110 + r() * 60) mid.push([x, yH - H * (0.05 + r() * 0.07)]);
    mid.push([W + 120, yH - H * 0.06], [W + 120, yH + 4]);
    els.push(this.path(mid, n ? this.grad("#24434a", "#2f5a4c") : this.grad("#6fa6a0", "#94c79a"), true));
    // Barn and trees at the foot of the hills.
    const tk = 1.4 * k;
    els.push(image(`${DIR}/barn.svg`).absolute().left(W * 0.3).top(yH - 12 * tk + 3).w(16 * tk).h(12 * tk));
    for (const [xf, s] of [[0.13, 1.3], [0.17, 1.0], [0.86, 1.2], [0.47, 0.9]]) {
      const ts = tk * s;
      els.push(image(`${DIR}/tree.svg`).absolute().left(W * xf).top(yH - 12 * ts + 3).w(12 * ts).h(12 * ts));
    }
    // Near rolling hills and the meadow.
    const near = [[0, H], [0, yH]];
    for (let x = 0; x <= W + 100; x += 140 + r() * 80) near.push([x, yH - H * (0.005 + r() * 0.03)]);
    near.push([W + 100, yH - H * 0.01], [W + 100, H]);
    els.push(this.path(near, n ? this.grad("#2a5a33", "#1c3f24") : this.grad("#8fd36c", "#4f9b3d"), true));
    // The creek: banks, water, shimmer.
    const left = [], right = [];
    for (let y = yH - 1; y <= H + 2; y += 3) {
      const c = g.creek(y);
      left.push([c.cx - c.hw, y]); right.push([c.cx + c.hw, y]);
    }
    const bank = (pts, d) => pts.map(([x, y], i) => [x + d * (1 + (y - yH) / H * 4), y]);
    els.push(this.path([...bank(left, -1), ...bank(right, 1).reverse()], n ? "#5c5a3c" : "#cdbb84"));
    els.push(this.path([...left, ...right.reverse()], n ? this.grad("#3f5f8f", "#24406a") : this.grad("#d6f2ff", "#4aa3e0")));
    const sr = rand(5);
    for (let i = 0; i < 9; i++) {
      const t = 0.12 + i * 0.1;
      const y = yH + t * (H - yH);
      const c = g.creek(y);
      const w = Math.max(2, c.hw * 0.5);
      els.push(div().absolute().top(y).w(w).h(Math.max(1, k * (0.6 + t))).rounded(1).bg("#ffffff")
        .loop("left", { from: c.cx - c.hw * 0.6, to: c.cx + c.hw * 0.1, period: 1800 + sr() * 1600 })
        .loop("opacity", { from: 0.15, to: n ? 0.45 : 0.85, period: 1300 + sr() * 1200 }));
    }
    // Grass tufts and flowers, larger in front.
    const fr = rand(11);
    const kinds = ["tuft1", "tuft2", "flower-w", "flower-y", "tuft1", "flower-p", "tuft2"];
    const dims = { tuft1: [9, 4], tuft2: [6, 3], "flower-w": [3, 5], "flower-y": [3, 5], "flower-p": [3, 5] };
    const count = Math.round(46 * Math.max(1, W / 1200));
    for (let i = 0; i < count; i++) {
      const t = fr(), xf = fr(), kind = kinds[i % kinds.length];
      const y = g.feet(t * 1.02), s = g.scale(t) * 0.42;
      const [dw, dh] = dims[kind];
      const x = xf * W;
      const c = g.creek(y);
      if (Math.abs(x + dw * s / 2 - c.cx) < c.hw + dw * s) continue;
      let el = image(`${DIR}/${kind}.svg`).absolute().top(y - dh * s).w(dw * s).h(dh * s).opacity(n ? 0.7 : 1);
      el = i % 3 === 0 ? el.loop("left", { from: x - s * 0.6, to: x + s * 0.6, period: 1800 + fr() * 1400 }) : el.left(x);
      els.push(el);
    }
    return els;
  }

  // ---- the animals ------------------------------------------------------

  animal(item, g) {
    const { a, x, y, p, face, st, drink, breed, entering } = item;
    const w = AW * p, h = AH * p;
    const src = (part) => `${DIR}/${breed.key}-${part}-${face}.svg`;
    const layer = (part) => image(src(part)).absolute().left(0).top(0).w(w).h(h);
    const tails = () => [
      layer("tail-a").loop("opacity", { from: 1, to: 0, period: 1300 + (hash(a.address) % 600) }),
      layer("tail-b").loop("opacity", { from: 0, to: 1, period: 1300 + (hash(a.address) % 600) }),
    ];
    let parts;
    if (st === "done") parts = [layer("sit")];
    else if (st === "working") {
      parts = [...tails(), layer("graze-body"),
        layer("graze-head").loop("top", { from: 0, to: p, period: 650 + (hash(a.address) % 300) })];
      if (drink) {
        const mx = face === "r" ? 34.5 * p : 1.5 * p;
        parts.push(div().absolute().left(mx - 3 * p).top(FEET * p - 1.5 * p).h(2 * p).rounded_full()
          .border_1().border_color("#ffffffcc")
          .loop("width", { from: 2 * p, to: 7 * p, period: 1400 })
          .loop("opacity", { from: 1, to: 0.1, period: 1400 }));
      }
    } else parts = [...tails(), layer("stand")];
    // Clicked: its action's current frame over everything else, lifted for a hop or buck.
    const act = this.acting[a.address];
    let lift = 0;
    if (act) {
      const step = act.steps[act.at];
      lift = step[2] * p;
      const aw = ACT_W * p, ah = ACT_H * p;
      parts = [image(`${DIR}/${breed.key}-act-${step[0]}-${face}.svg`).absolute().left(-ACT_X * p).top(-ACT_Y * p).w(aw).h(ah)];
      if (act.dust === step[0]) {
        const hx = face === "r" ? 31 * p : 5 * p;
        parts.push(div().absolute().left(hx - 3 * p).top(FEET * p - 2 * p).w(6 * p).h(2.5 * p).rounded_full()
          .bg("#c9a77a").loop("opacity", { from: 0.7, to: 0.1, period: 400 }));
      }
      if (act.say) {
        parts.push(div().absolute().left(face === "r" ? 30 * p : -6 * p).top(-2 * p).px(6).py(2).rounded(8)
          .bg("#fffdf6").border_1().border_color("#3b3328").text_size(Math.max(11, 2.6 * p)).font_bold()
          .text_color("#3b3328").child(act.say));
      }
    }

    // A unicorn twinkles round its horn (still poses only: an action moves the horn).
    if (breed.key === "unicorn" && !act) {
      const tipY = { stand: 0.3, graze: 17.4, sit: 4.3 }[poseOf(st)] * p;
      const tipX = (face === "r" ? { stand: 31.6, graze: 34.6, sit: 31.6 } : { stand: 4.4, graze: 1.4, sit: 4.4 })[poseOf(st)] * p;
      const seed = hash(a.address);
      [[-2.2, -1.6, 900], [2.0, -0.4, 1300], [0.4, 1.8, 1100]].forEach(([dx, dy, per], i) => {
        const s = (i === 1 ? 1.6 : 1.1) * p;
        parts.push(div().absolute().left(tipX + dx * p - s / 2).top(tipY + dy * p - s / 2).size(s).rounded_full()
          .bg(["#fff6b8", "#ffffff", "#ffc8ec"][i]).loop("opacity", { from: 0, to: 1, period: per + (seed % 300) }));
      });
    }
    // A Christmas moose's antler lights glow on and off (still poses only).
    if (breed.key === "moose" && !act) {
      const seed = hash(a.address);
      MOOSE_LIGHTS[poseOf(st)].forEach(([lx, ly], i) => {
        const s = 1.5 * p, x = (face === "r" ? lx : AW - lx) * p;
        parts.push(div().absolute().left(x - s / 2).top(ly * p - s / 2).size(s).rounded_full()
          .bg(["#ff4d5a88", "#ffd84a88", "#4fd27a88", "#5fb8ff88"][i % 4])
          .loop("opacity", { from: 0.1, to: 1, period: 900 + ((seed >> (i * 3)) % 700) }));
      });
    }
    const body = div().absolute().left(0).top(-lift).w(w).h(h).transition("top", { duration: 200, easing: "ease-out" })
      .children(parts);

    // Status badge, under its feet in the middle.
    const info = STATUS[st];
    const bs = Math.round(Math.min(26, Math.max(15, 3.6 * p)));
    let badge = div().absolute().left(w / 2 - bs / 2).top(FEET * p - bs * 0.35).size(bs).rounded_full().bg(info.color)
      .border_2().border_color("#ffffff").shadow_sm().flex().items_center().justify_center()
      .text_size(bs * 0.62).font_bold().text_color("#ffffff");
    badge = info.glyph ? badge.child(info.glyph) : badge.frames(["◐", "◓", "◑", "◒"], 260);

    // Animals stay on their own spot (no sliding about); a new one fades in.
    // Clicks only on the body, not the picture's empty corners, so the animal behind
    // stays clickable where it shows.
    const hit = div().id(`ani-${a.address}`).absolute().left(3 * p).top(2 * p).w(30 * p).h(25 * p)
      .when(this.drag?.key === a.address, (el) => el.cursor_grabbing())
      .when(this.drag?.key !== a.address, (el) => el.cursor_pointer())
      // ⌃-click turns it round, ⇧⌃-drag moves it, a plain click plays a trick.
      .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.press(a.address, e, cx); })
      .on_mouse_down("right", (e, cx) => { if (e.modifiers.control) { cx.stop_propagation(); this.press(a.address, e, cx); } })
      .on_click((_e, cx) => {
        if (this.dropped === a.address) { this.dropped = null; return; }
        if (_e.modifiers?.control || _e.modifiers?.platform) return;
        this.perform(a, breed, cx); this.go(a);
      })
      // Its name tag already says what a hover card would: hovering just rereads the question.
      .on_hover((on, cx) => { if (on) this.ask(a.address, cx, 20000); });
    return div().absolute().left(x).top(y - FEET * p).w(w).h(h)
      .opacity(entering ? 0 : 1).transition("opacity", { duration: 900, easing: "ease-out" })
      .children([...this.shadow(g, x, 18 * p, FEET * p, 26 * p, p), body, badge, hit]);
  }

  // ---- ⌃-click turns an animal round; ⇧⌃-drag moves an animal or a terminal object ----
  // (⌘ works in place of ⌃; macOS can report ⌃-click as a right click, which counts too.)

  // A spot, or where it is while being dragged.
  spotOf(key) {
    const s = this.spots[key];
    const d = this.drag;
    return s && d?.key === key && d.moved ? { ...s, xf: d.xf, t: d.t } : s;
  }

  press(key, e, cx) {
    const m = e.modifiers ?? {};
    if (!(m.control || m.platform) || this.demo || !this.spots[key]) return;
    if (m.shift) {
      const s = this.spots[key];
      this.drag = { key, x0: e.position.x, y0: e.position.y, xf0: s.xf, t0: s.t, xf: s.xf, t: s.t, moved: false };
    } else if (!key.startsWith("obj:")) {
      this.flip = key;
    }
    cx.notify();
  }

  // Follows the pointer: sideways along the meadow, and up or down in depth, so it grows
  // and shrinks as it goes nearer or farther. Window pixels are zoomed; ours aren't.
  dragTo(e, g, cx) {
    const d = this.drag;
    if (!d) return;
    const dx = (e.position.x - d.x0) / g.z, dy = (e.position.y - d.y0) / g.z;
    if (!d.moved && Math.hypot(dx, dy) < 4) return;
    d.moved = true;
    d.t = g.depth(g.feet(d.t0) + dy);
    d.xf = Math.min(0.98, Math.max(0.02, d.xf0 + dx / g.W));
    cx.notify();
  }

  // Lets go: a ⌃-click turns the animal round; a drag keeps the new spot (on dry land,
  // never in the creek). Both are saved with the spot and survive restarts.
  drop(g, cx) {
    const d = this.drag, f = this.flip;
    this.drag = null; this.flip = null;
    let key = null;
    if (f && this.spots[f]) {
      this.spots[f] = { ...this.spots[f], f: !this.spots[f].f };
      key = f;
    } else if (d?.moved && this.spots[d.key]) {
      const obj = d.key.startsWith("obj:");
      const spot = { ...this.spots[d.key], t: d.t };
      const p = g.scale(d.t) * (obj ? OBJ_SIZE : sizeOf(d.key, spot)), sw = (obj ? OW : AW) * p, y = g.feet(d.t);
      let x = Math.min(g.W - sw - 4, Math.max(4, d.xf * g.W - sw / 2));
      x = obj ? this.dry(g, x - p, y, p * OW / AW) + p : this.dry(g, x, y, p);
      spot.xf = (x + sw / 2) / g.W;
      this.spots[d.key] = spot;
      key = d.key;
    }
    if (key) {
      localStorage.setItem("spots", JSON.stringify(this.spots));
      this.dropped = key; // the release isn't a click
      cx.timer.after(400, () => { if (this.dropped === key) this.dropped = null; });
    }
    if (d || f) cx.notify();
  }

  // A soft shadow on the ground, cast away from the sun (at 74% across the sky): short
  // under a high day sun, long under the low evening sun, faint under the moon. `left` is
  // the element's page x; `mid`, `feet` and `bw` are in its own coordinates.
  shadow(g, left, mid, feet, bw, p) {
    const d = Math.max(-1, Math.min(1, (left + mid - g.W * 0.74) / (g.W * 0.5)));
    const len = this.evening ? 0.55 + 0.45 * Math.abs(d) : this.night ? 0.2 : 0.12 + 0.18 * Math.abs(d);
    const sw = bw * (0.8 + len * 0.9), sh = (this.evening ? 2.6 : 3.4) * p;
    const cx = mid + Math.sign(d || 1) * len * bw * 0.55;
    const tone = this.night ? "#0a12301f" : this.evening ? "#3a1e0a33" : "#1d3a1238";
    return [
      div().absolute().left(cx - sw / 2).top(feet - sh / 2).w(sw).h(sh).rounded_full().bg(tone),
      div().absolute().left(cx - sw * 0.36).top(feet - sh * 0.32).w(sw * 0.72).h(sh * 0.64).rounded_full().bg(tone),
    ];
  }

  // Plays its next action: each step a redraw, so a few over a second or two.
  perform(a, breed, cx) {
    if (this.acting[a.address]) return;
    const list = ACTIONS[breed.kind];
    // A random move, never the same one twice in a row.
    const last = this.acts[a.address];
    let n = Math.floor(Math.random() * (last === undefined ? list.length : list.length - 1));
    if (last !== undefined && n >= last) n++;
    this.acts[a.address] = n;
    const act = { ...list[n], at: 0 };
    this.acting[a.address] = act;
    const next = (cx) => {
      if (this.acting[a.address] !== act) return;
      if (++act.at >= act.steps.length) delete this.acting[a.address];
      else cx.timer.after(act.steps[act.at][1], next);
      cx.notify();
    };
    cx.timer.after(act.steps[0][1], next);
    cx.notify();
  }

  go(a) {
    if (a.pane) run("pane.focus", { pane: a.pane });
    else run("terminal.peek", { terminal: a.address });
  }

  // The name tag over its head: the question's summary, then its space and tab. The red
  // "!" sign of an agent that needs you sits on top of it. Drawn after every animal, so a
  // nearer animal never hides a farther one's tag.
  tag(item, g, helpers = 0) {
    const { a, x, y, p, st, entering } = item;
    const w = AW * p;
    const headTop = y - FEET * p + HEAD_TOP[poseOf(st)] * p;
    const fs = Math.min(13, Math.max(10.5, 2.1 * p + 1));
    const tagH = fs * 2 + 10;
    const tw = Math.max(150, Math.min(260, w + 70));
    const left = Math.min(g.W - tw - 4, Math.max(4, x + w / 2 - tw / 2));
    const top = Math.max(st === "blocked" ? 30 : 4, headTop - tagH - 4);
    const asked = this.asked[a.address]?.text;
    const title = asked ? summary(asked) : question(a);
    const els = [div().id(`tag-${a.address}`).absolute().left(left).top(top).w(tw).flex().justify_center()
      .opacity(entering ? 0 : 1).transition("opacity", { duration: 900, easing: "ease-out" })
      .child(div().id(`tagbox-${a.address}`).max_w(tw).px(7).py(3).rounded(7).bg("#10201ad9")
        .border_1().border_color(st === "blocked" ? STATUS.blocked.color : "#ffffff30")
        .cursor_pointer().on_mouse_down("left", (_e, cx) => cx.stop_propagation()).on_click(() => this.go(a))
        .flex().flex_col().items_center()
        .child(div().max_w(tw - 14).truncate().text_size(fs).font_semibold().text_color("#ffffff").child(title))
        .child(div().max_w(tw - 14).truncate().text_size(fs - 1.5).text_color("#c9e8c4")
          .child(`${a.space_name} · tab ${a.tab_name || a.tab_index + 1}${helpers ? ` · 🐇 ${helpers}` : ""}`)))];
    if (st === "blocked") {
      const s = Math.min(30, Math.max(18, 4.2 * p));
      els.push(div().absolute().left(left + tw / 2 - s / 2).w(s).h(s).rounded(s * 0.28).bg("#e5484d")
        .border_2().border_color("#ffffff").flex().items_center().justify_center()
        .text_size(s * 0.66).font_bold().text_color("#ffffff").child("!")
        .loop("top", { from: top - s - 2, to: top - s - 6, period: 620 }));
    }
    return div().absolute().left(0).top(0).size_full().children(els);
  }

  // Reads the last question from the agent's screen. `fresh`: skip if read this recently.
  ask(address, cx, fresh = 20000, turn) {
    const seen = this.asked[address];
    if (seen?.busy || (seen && fresh && Date.now() - seen.at < fresh)) return;
    const keep = turn === undefined ? seen?.turn : turn;
    this.asked[address] = { ...(seen ?? {}), at: Date.now(), busy: true, turn: keep, text: seen?.text ?? null };
    cx.spawn(async (cx) => {
      const r = await hc(["read", address, "--lines", "400"]).catch(() => null);
      const text = r?.code === 0 ? lastPrompt(r.stdout) : null;
      if (r?.code === 0) {
        const working = agents().find((a) => a.address === address)?.status === "working";
        this.subs[address] = subAgents(r.stdout).map((sub) => (working ? sub : { ...sub, done: true }));
      }
      this.asked[address] = { at: Date.now(), busy: false, turn: keep, text: text ?? seen?.text ?? null };
      cx.notify();
    });
  }

  // Who's out: Herdr's sub-agent terminals and Claude Code's sub-agents, each a small animal
  // by its parent. One that's gone or finished runs off the nearer edge of the meadow.
  critters(placed, all, g, cx) {
    const byAddr = Object.fromEntries(placed.map((p) => [p.a.address, p]));
    const active = [];
    for (const t of all) {
      if (!t.parent || !byAddr[t.parent] || t.state !== "live" || t.status === "done") continue;
      active.push({ id: t.address, parent: t.parent, name: t.name || t.title || t.program?.name || t.address, status: t.status ?? "working" });
    }
    const t = Date.now();
    const listed = new Set();
    for (const [parent, list] of Object.entries(this.subs)) {
      if (!byAddr[parent]) continue;
      list.forEach((sub, i) => {
        const id = `${parent}#${i}:${sub.name}`;
        listed.add(id);
        if (!this.firstSeen[id]) {
          this.firstSeen[id] = t;
          cx.timer.after(MIN_STAY + 50, (cx) => cx.notify());
        }
        if (!sub.done || t - this.firstSeen[id] < MIN_STAY) {
          active.push({ id, parent, name: sub.name, status: sub.done ? "done" : "working" });
        }
      });
    }
    for (const id of Object.keys(this.firstSeen)) if (!listed.has(id)) delete this.firstSeen[id];
    const out = [];
    const count = {};
    const now = new Set();
    for (const c of active) {
      const par = byAddr[c.parent];
      // Beside it, not under it: alternately behind and in front of it, in a row outward.
      const k = (count[c.parent] = (count[c.parent] ?? -1) + 1);
      const p = par.p * 0.5;
      const pw = AW * par.p, cw = CW * p, n = Math.floor(k / 2);
      const left = k % 2 === 0;
      const y = Math.min(g.H - 6, par.y + (n % 2) * 2.5 * par.p);
      let x = left ? par.x + 1.5 * par.p - (n + 1) * cw * 1.08 : par.x + 34.5 * par.p + n * cw * 1.08;
      x = Math.min(g.W - cw - 4, Math.max(4, x));
      const c0 = g.creek(y);
      if (x + cw > c0.cx - c0.hw - 2 && x < c0.cx + c0.hw + 2) x = x + cw / 2 < c0.cx ? c0.cx - c0.hw - cw - 4 : c0.cx + c0.hw + 4;
      const kind = CRITTERS[hash(c.id) % CRITTERS.length];
      const face = x + cw / 2 < par.x + pw / 2 ? "r" : "l";
      const item = { ...c, x, y, p, kind, face, play: hash(`play${c.id}`) % 3 === 0 };
      this.critterAt[c.id] = item;
      now.add(c.id);
      out.push(item);
    }
    for (const [id, item] of Object.entries(this.critterAt)) {
      if (now.has(id) || this.leaving[id]) continue;
      delete this.critterAt[id];
      this.leaving[id] = { ...item, leaving: true, face: item.x < g.W / 2 ? "l" : "r", gone: false };
      cx.timer.after(60, (cx) => { if (this.leaving[id]) { this.leaving[id].gone = true; cx.notify(); } });
      cx.timer.after(3200, (cx) => { delete this.leaving[id]; cx.notify(); });
    }
    for (const item of Object.values(this.leaving)) out.push(item);
    return out;
  }

  critter(c, g) {
    const w = CW * c.p, h = CH * c.p;
    const pic = (pose) => image(`${DIR}/critter-${c.kind}-${pose}-${c.face}.svg`).absolute().left(0).w(w).h(h);
    if (c.leaving) {
      const to = c.face === "l" ? -w - 20 : g.W + 20;
      return div().id(`crit-${c.id}`).absolute().left(c.gone ? to : c.x).top(c.y - CFEET * c.p).w(w).h(h)
        .transition("left", { duration: 2600, easing: "ease-in" })
        .child(pic("hop").top(0).loop("top", { from: 0, to: -3 * c.p, period: 300, easing: "ease-out" }));
    }
    const seed = hash(c.id);
    const body = c.play
      ? pic("hop").top(0).loop("top", { from: 0, to: -2.5 * c.p, period: 340 + (seed % 120), easing: "ease-out" })
        .loop("left", { from: -3 * c.p, to: 3 * c.p, period: 2200 + (seed % 900) })
      : pic("sit").top(0).loop("top", { from: 0, to: -0.5 * c.p, period: 380 + (seed % 200) });
    const els = [...this.shadow(g, c.x, w / 2, CFEET * c.p, w * 0.7, c.p), body];
    if (c.status === "blocked") {
      const s = Math.max(12, 3 * c.p);
      els.push(div().absolute().left(w / 2 - s / 2).w(s).h(s).rounded(s * 0.3).bg(STATUS.blocked.color)
        .border_1().border_color("#ffffff").flex().items_center().justify_center()
        .text_size(s * 0.7).font_bold().text_color("#ffffff").child("!")
        .loop("top", { from: -s - 2, to: -s - 5, period: 600 }));
    }
    const word = STATUS[c.status]?.word ?? "Working";
    return div().id(`crit-${c.id}`).absolute().left(c.x).top(c.y - CFEET * c.p).w(w).h(h)
      .tooltip(`Sub-agent · ${word}: ${c.name}`)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click(() => (c.id.includes("#") ? this.go(byAddress(c.parent)) : run("terminal.peek", { terminal: c.id })))
      .children(els);
  }

  // ---- plain terminals -------------------------------------------------

  // Herdr's terminals that aren't agents (and the bottom shell): what each is doing now.
  objects(all, list, g) {
    const now = Date.now();
    const agentsHere = new Set(list.map((a) => a.address));
    const spaceName = this.demo?.names ?? Object.fromEntries(spaces().map((sp) => [sp.id.split("/").pop(), sp.name]));
    const out = [];
    const keep = new Set();
    let ticking = false;
    let dirty = false;
    for (const t of all) {
      const L = t.labels ?? {};
      if (t.state !== "live" || agentsHere.has(t.address) || (t.parent && agentsHere.has(t.parent))) continue;
      if (!L["herdr.space"] && L["niu-ma.role"] !== "shell") continue;
      const key = `obj:${t.address}`;
      keep.add(key);
      if (!this.spots[key]) {
        this.spots[key] = this.pick(key, g, Object.entries(this.spots));
        dirty = true;
      }
      const fg = t.foreground;
      const fgRunning = !!fg && fg.pid !== t.pid;
      if (fgRunning && !this.fgSince[t.address]) this.fgSince[t.address] = now;
      if (!fgRunning && this.fgSince[t.address]) {
        this.fgDone[t.address] = { start: this.fgSince[t.address], end: now };
        delete this.fgSince[t.address];
      }
      const hooked = !!L["niu-ma.state"];
      let state = "idle", cmd = "", start = 0, end = 0, code = null;
      if (hooked && L["niu-ma.state"] === "running") {
        state = "running"; cmd = L["niu-ma.cmd"] ?? ""; start = Number(L["niu-ma.start"]) || now;
      } else if (!hooked && fgRunning) {
        state = "running"; cmd = (fg.argv ?? []).map((a, i) => (i ? a : base(a))).join(" "); start = this.fgSince[t.address];
      } else if (hooked && L["niu-ma.state"] === "done") {
        cmd = L["niu-ma.cmd"] ?? ""; start = Number(L["niu-ma.start"]) || 0; end = Number(L["niu-ma.end"]) || 0;
        code = Number(L["niu-ma.exit"]);
        if (code === 0 && now - end < SUCCESS_SHOW) state = "success";
        else if (code !== 0 && Number.isFinite(code) && this.acked[t.address] !== end) state = "failed";
      } else if (!hooked && this.fgDone[t.address] && now - this.fgDone[t.address].end < SUCCESS_SHOW) {
        state = "success"; ({ start, end } = this.fgDone[t.address]);
      }
      if (state === "running" && fgRunning && interactive(fg)) state = "interactive";
      if (state === "running" || state === "interactive" || state === "success" || (state === "failed" && now - end < BURST)) ticking = true;
      const spot = this.spotOf(key);
      const y = g.feet(spot.t);
      const p = g.scale(spot.t) * OBJ_SIZE;
      const w = OW * p;
      let x = Math.min(g.W - w - 4, Math.max(4, spot.xf * g.W - w / 2));
      x = this.dry(g, x - p, y, p * OW / AW) + p;
      const kind = OBJ_VARIANT === "mixed" ? OBJ_KINDS[hash(t.address) % OBJ_KINDS.length] : OBJ_VARIANT;
      const project = L["niu-ma.role"] === "shell" ? `Shell · ${base(t.cwd) || "~"}` : (spaceName[L["herdr.space"]] ?? base(t.cwd));
      out.push({ t, x, y, p, kind, state, cmd, start, end, code, hooked, project, now });
    }
    for (const key of Object.keys(this.spots)) if (key.startsWith("obj:") && !keep.has(key)) { delete this.spots[key]; dirty = true; }
    if (dirty) localStorage.setItem("spots", JSON.stringify(this.spots));
    this.ticking = ticking;
    return out;
  }

  object(o, g) {
    const { t, x, y, p, kind, state, now, end } = o;
    const w = OW * p, h = OH * p;
    const pic = (name) => image(`${DIR}/obj-${name}.svg`).absolute().left(0).top(0).w(w).h(h);
    const seed = hash(t.address);
    const lit = state === "running";
    const blue = state === "interactive";
    const dot = (cx0, cy0, size, color) => div().absolute().left(cx0 * p - size / 2).w(size).h(size).rounded_full().bg(color);
    const rise = (el, from, to, period, fade = 0.8) => el
      .loop("top", { from: from * p, to: to * p, period, easing: "ease-out" })
      .loop("opacity", { from: fade, to: 0, period, easing: "ease-in" });
    const layers = [];
    if (kind === "firepit") {
      if (lit) layers.push(dot(6, 0, 8 * p, "#ffb34733").top(2.5 * p).loop("opacity", { from: 0.5, to: 1, period: 700 }));
      layers.push(pic("firepit-base"));
      if (lit) {
        layers.push(pic("firepit-flame-a").loop("opacity", { from: 1, to: 0.15, period: 260 + (seed % 80) }));
        layers.push(pic("firepit-flame-b").loop("opacity", { from: 0.1, to: 1, period: 330 + (seed % 90) }));
        for (let i = 0; i < 3; i++) layers.push(rise(dot(5 + i, 0, Math.max(1.5, 0.45 * p), "#ffcf5a"), 4, -2 - i, 900 + i * 260));
        for (let i = 0; i < 2; i++) layers.push(rise(dot(6 + (i ? 0.8 : -0.6), 0, 1.6 * p, "#c8c8c8"), 1.5, -5, 2400 + i * 700, 0.45));
      } else if (blue) {
        layers.push(dot(6, 0, 4 * p, "#4a8dff33").top(5 * p));
        layers.push(pic("firepit-flame-blue"));
      }
    } else if (kind === "pot") {
      layers.push(pic("pot-base"));
      if (lit) {
        layers.push(pic("pot-fire-a").loop("opacity", { from: 1, to: 0.2, period: 280 + (seed % 80) }));
        layers.push(pic("pot-fire-b").loop("opacity", { from: 0.15, to: 1, period: 350 + (seed % 90) }));
        for (let i = 0; i < 3; i++) {
          layers.push(dot(4.8 + i * 1.2, 0, Math.max(1.5, 0.5 * p), "#d9efff")
            .loop("top", { from: 4.1 * p, to: 3.6 * p, period: 420 + i * 130 }).loop("opacity", { from: 1, to: 0.2, period: 420 + i * 130 }));
        }
        const puffs = now - o.start > 30000 ? 4 : 2;
        for (let i = 0; i < puffs; i++) layers.push(rise(dot(5.2 + (i % 2) * 1.6, 0, 1.8 * p, "#ffffff"), 3.2, -4 - i, 1800 + i * 450, 0.55));
      } else if (blue) layers.push(pic("pot-fire-blue"));
    } else {
      const tone = state === "success" ? "green" : state === "failed" ? "red" : blue ? "blue" : "dim";
      layers.push(pic(tone === "dim" || lit ? "crystal-dim" : `crystal-${tone}`));
      if (lit) {
        layers.push(pic("crystal-lit").loop("opacity", { from: 0.3, to: 1, period: 1200 + (seed % 300) }));
        for (let i = 0; i < 4; i++) {
          layers.push(dot(2.5 + i * 2.3, 0, Math.max(1.5, 0.45 * p), "#e9dcff")
            .loop("top", { from: (9 - i) * p, to: (1 - i * 0.5) * p, period: 1600 + i * 330, easing: "linear" })
            .loop("opacity", { from: 0.9, to: 0, period: 1600 + i * 330 }));
        }
      }
    }
    if (state === "success") {
      for (let i = 0; i < 5; i++) {
        layers.push(div().absolute().left((1.5 + i * 2.2) * p).text_size(Math.max(9, 2.6 * p)).text_color("#7fe39a").child("✦")
          .loop("top", { from: 4 * p, to: (-2 - (i % 3)) * p, period: 900 + i * 170, easing: "ease-out" })
          .loop("opacity", { from: 1, to: 0, period: 900 + i * 170 }));
      }
    }
    if (state === "failed" && now - end < BURST) {
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 * i) / 6;
        layers.push(dot(6, 0, Math.max(1.5, 0.5 * p), "#ff5a4f")
          .loop("left", { from: 6 * p, to: (6 + Math.cos(a) * 5) * p, period: 500 + i * 60, easing: "ease-out" })
          .loop("top", { from: 6 * p, to: (6 + Math.sin(a) * 4 - 2) * p, period: 500 + i * 60, easing: "ease-out" })
          .loop("opacity", { from: 1, to: 0, period: 500 + i * 60 }));
      }
    }
    if (state === "failed") {
      const s = Math.max(11, 3 * p);
      layers.push(div().absolute().left(w - s * 0.6).top(-s * 0.3).size(s).rounded_full().bg(STATUS.blocked.color)
        .border_1().border_color("#ffffff").flex().items_center().justify_center()
        .text_size(s * 0.7).font_bold().text_color("#ffffff").child("!"));
    }
    return div().id(`obj-${t.address}`).absolute().left(x).top(y - OFEET * p).w(w).h(h)
      .cursor_pointer()
      .on_mouse_down("left", (e, cx) => { cx.stop_propagation(); this.press(`obj:${t.address}`, e, cx); })
      .on_mouse_down("right", (e, cx) => { if (e.modifiers.control) { cx.stop_propagation(); this.press(`obj:${t.address}`, e, cx); } })
      .when(this.drag?.key === `obj:${t.address}`, (el) => el.cursor_grabbing())
      .on_click((e, cx) => {
        if (this.dropped === `obj:${t.address}`) { this.dropped = null; return; }
        if (e.modifiers?.control || e.modifiers?.platform) return;
        this.openObj(o, cx);
      })
      .on_hover((on, cx) => {
        if (on) this.hoverObj = t.address;
        else if (this.hoverObj === t.address) this.hoverObj = null;
        cx.notify();
      })
      .children(layers);
  }

  // Clicking one goes to its terminal; a failure counts as seen.
  openObj(o, cx) {
    if (o.state === "failed") this.acked[o.t.address] = o.end;
    const pane = panes().find((p) => p.terminal === o.t.address)?.pane;
    run("pane.focus", pane ? { pane } : { terminal: o.t.address });
    cx.notify();
  }

  // The dark bubble over a running (2 s+), just finished or failed command; or, on hover,
  // what the terminal last ran.
  objTip(o, g) {
    const { t, x, y, p, state, cmd, start, end, code, hooked, project, now } = o;
    const hover = this.hoverObj === t.address;
    const ran = end && start ? elapsed(end - start) : "";
    let head, color = "#ffffff", meta;
    if ((state === "running" || state === "interactive") && (now - start >= TIP_AFTER || hover)) {
      head = `${state === "interactive" ? "▷" : "▶"} ${cmd || "…"}`;
      meta = `${project} · ${state === "interactive" ? "interactive · " : ""}${elapsed(now - start)}`;
    } else if (state === "success") {
      head = hooked ? `✓ exit 0 · ${cmd}` : `✓ finished · ${cmd || "command"}`;
      color = "#9ff0b4"; meta = `${project}${ran ? ` · ${ran}` : ""}`;
    } else if (state === "failed") {
      head = `✗ exit ${code} · ${cmd}`;
      color = "#ffb1ab"; meta = `${project}${ran ? ` · ${ran}` : ""} · click to dismiss`;
    } else if (hover) {
      head = cmd ? `last: ${cmd}` : "Terminal · idle";
      color = "#d6e4d2"; meta = `${project} · ${code === null ? "idle" : `exit ${code}`}`;
    } else return [];
    const tw = hover ? 360 : 230;
    const left = Math.min(g.W - tw - 4, Math.max(4, x + (OW * p) / 2 - tw / 2));
    const top = Math.max(4, y - OFEET * p - (hover ? 58 : 40));
    const line = div().text_size(11).font_semibold().text_color(color);
    return [div().id(`objtip-${t.address}`).absolute().left(left).top(top).w(tw).flex().justify_center()
      .child(div().max_w(tw).px(7).py(3).rounded(7).bg("#10201ad9").border_1()
        .border_color(state === "failed" ? STATUS.blocked.color : state === "success" ? STATUS.done.color : "#ffffff30")
        .flex().flex_col().items_center()
        .child(hover ? line.max_w(tw - 14).child(head) : line.max_w(tw - 14).truncate().child(clip(head, 40)))
        .child(div().max_w(tw - 14).truncate().text_size(9.5).text_color("#c9e8c4").child(meta)))];
  }

  // An oak rail fence right at the front, as if you're leaning on it: a short run at each
  // side, the middle left open.
  fence(g) {
    const { W, H, k } = g;
    const OAK = "#b07d4b", DARK = "#7f5530", LIGHT = "#cfa070";
    const postW = 11 * k, postH = H * 0.24, top = H - postH + 6 * k;
    const railH = 6 * k, rails = [top + postH * 0.22, top + postH * 0.58];
    const gap = Math.max(110, 150 * k);
    const runs = [[-postW * 0.4, W * 0.2], [W * 0.8, W + postW]];
    const els = [];
    const dim = this.night ? 0.75 : 1;
    for (const [x0, x1] of runs) {
      for (const ry of rails) {
        els.push(div().absolute().left(x0).top(ry).w(x1 - x0).h(railH).bg(OAK).opacity(dim)
          .border_b_2().border_color(DARK)
          .child(div().absolute().left(0).top(0).w(x1 - x0).h(Math.max(1, railH * 0.25)).bg(LIGHT)));
      }
      for (let x = x0; x <= x1 - postW * 0.5; x += gap) {
        els.push(div().absolute().left(x).top(top).w(postW).h(postH + 8).rounded_t(3 * k).bg(OAK).opacity(dim)
          .border_r_2().border_color(DARK)
          .child(div().absolute().left(0).top(0).w(Math.max(2, postW * 0.28)).h(postH + 8).bg(LIGHT)));
      }
    }
    return els;
  }

  counts(list, g) {
    const n = { blocked: 0, done: 0, working: 0, idle: 0 };
    for (const a of list) n[statusOf(a)]++;
    const pill = (st) => {
      const info = STATUS[st];
      return div().flex().flex_row().items_center().gap(5).h(20).px(8).rounded_full()
        .bg(n[st] ? "#0f1c22d0" : "#0f1c2270").opacity(n[st] ? 1 : 0.65)
        .text_size(11).text_color("#f2f5f0")
        .child(div().size(14).rounded_full().bg(info.color).flex().items_center().justify_center()
          .text_size(9).font_bold().text_color("#ffffff").child(info.glyph ?? "•"))
        .child(div().child(info.word))
        .child(div().font_bold().child(String(n[st])));
    };
    return div().absolute().left(0).bottom(8).w(g.W).flex().flex_row().justify_center().gap(6)
      .children(["blocked", "done", "working", "idle"].map(pill));
  }

  empty(g) {
    return div().absolute().left(g.W / 2 - 170).top(g.yH + (g.H - g.yH) / 2 - 16).w(340).py(6).rounded(10)
      .bg("#0f1c22b0").text_size(12).text_color("#f2f5f0").flex().justify_center()
      .child("The meadow is quiet. Start an agent and a horse or cow wanders in.");
  }
}
