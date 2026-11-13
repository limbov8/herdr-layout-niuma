// The NiuMa layout's two bars.
//   props {}                  over the panes: every space as a pill (click to switch, + for a
//                             new one), the space's branch and tabs, and buttons that split the
//                             tab (a new panel, not a new tab). `niu-ma-bar.split` and
//                             `niu-ma-bar.split-agent` (keys.json) do the same.
//   props { role: "agents" }  the ⚙ dialog: the start command for Claude Code and Codex, kept
//                             as their `run` in programs.json.
//   props { role: "shell" }   over the bottom terminal: its folder, cd to the space, clear,
//                             restart. If the shell is gone (exit), starts a new one and points
//                             the layout's `shell-term` block at it.
import { View, div, image, svg } from "gpui-kit";
import { InputState, Input } from "gpui-base";
import { spaces, panes, focused, terminals, run, theme, props, layout, knownAgents, nextCommand, hc, home, appHome,
  openOverlay, closeOverlay, readTextFile, writeTextFile, shared, setShared } from "herdr";

const SHELL_NAME = "niu-ma-shell";

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
    if (this.agentsDialog) return this.initAgents(cx);
    this.agents = [];
    this.fixing = false;
    if (this.shell) {
      cx.timer.every(4000, (cx) => this.watch(cx));
      this.watch(cx);
      return;
    }
    this.loadAgents(cx);
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
  split(argv) {
    const f = focused();
    if (!f) return;
    const here = panes().filter((p) => p.tab === f.tab);
    if (!here.length) return run("tab.new", argv ? { argv } : {});
    const sizes = Object.fromEntries(terminals().map((t) => [t.address, { cols: t.cols ?? 0, rows: t.rows ?? 0 }]));
    const cols = (p) => sizes[p.terminal]?.cols ?? 0;
    const target = [...here].sort((a, b) => cols(b) - cols(a) || (b.focused ? 1 : 0) - (a.focused ? 1 : 0))[0];
    run("pane.split", { pane: target.pane, direction: "right", ...(argv ? { argv } : {}) });
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
    if (this.agentsDialog) return this.renderAgents();
    if (!this.shell && (shared("niu-ma.agents") ?? null) !== this.agentsStamp) this.loadAgents(cx);
    return this.shell ? this.renderShell() : this.renderMain();
  }

  // ---- ⚙ agent start commands -------------------------------------------

  initAgents(cx) {
    this.path = `${appHome()}/programs.json`;
    this.rows = AGENT_KEYS.map((a) => ({ ...a, input: InputState.new({ placeholder: a.key }), def: null, installed: null }));
    this.status = "Loading…";
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
      setShared("niu-ma.agents", Date.now());
      this.status = "Saved. New agents start with these commands.";
    } catch (e) {
      this.status = `Not saved: ${e}`;
    }
    cx.notify();
  }

  renderAgents() {
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
      .child(div().text_size(15).font_semibold().text_color(t.foreground).child("Agent start commands"))
      .child(div().text_size(11.5).text_color(t.muted)
        .child("What the agent buttons, ⌘⇧T and Herdr's menus run to start each agent. Saved as its run in programs.json."))
      .children(this.rows.map(row))
      .child(div().flex_1())
      .child(div().flex().flex_row().items_center().gap(8)
        .child(div().flex_1().text_size(11).text_color(this.status.startsWith("Not") || this.status.startsWith("Couldn't") ? t.blocked : t.muted).truncate().child(this.status))
        .child(this.btn("agents-cancel", "Close", () => overlay && closeOverlay(overlay)))
        .child(this.btn("agents-save", "Save", (_e, cx) => cx.spawn(async (cx) => this.saveAgents(cx)), { primary: true })));
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
      .child(div().id("agent-settings").flex_none().size(24).rounded(6).flex().items_center().justify_center()
        .hover((s) => s.bg(t.hover)).cursor_pointer().tooltip("Agent start commands")
        .on_click(() => openOverlay({ mod: "niu-ma-bar", props: { role: "agents" }, kind: "dialog", width: 600, height: 400 }))
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
