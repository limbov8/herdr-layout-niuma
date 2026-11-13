// The 牛马 layout's two bars.
//   props {}                  over the panes: the space, its tabs, and buttons that split the
//                             tab (a new panel, not a new tab). `niu-ma-bar.split` and
//                             `niu-ma-bar.split-agent` (keys.json) do the same.
//   props { role: "shell" }   over the bottom terminal: its folder, cd to the space, clear,
//                             restart. If the shell is gone (exit), starts a new one and points
//                             the layout's `shell-term` block at it.
import { View, div, image, svg } from "gpui-kit";
import { spaces, panes, focused, terminals, run, theme, props, layout, knownAgents, nextCommand, hc, home } from "herdr";

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
const tilde = (p) => (p && p.startsWith(home()) ? `~${p.slice(home().length)}` : p ?? "");
const quote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

export default class Bar extends View {
  init(_props, cx) {
    this.shell = props()?.role === "shell";
    this.agents = [];
    this.fixing = false;
    if (this.shell) {
      cx.timer.every(4000, (cx) => this.watch(cx));
      this.watch(cx);
      return;
    }
    cx.spawn(async (cx) => {
      try {
        this.agents = (await knownAgents()).filter((a) => a.installed).slice(0, 3);
      } catch {
        this.agents = [];
      }
      cx.notify();
    });
    cx.spawn(async (cx) => {
      for (;;) {
        const c = await nextCommand();
        if (c === "split") this.split();
        else if (c === "split-agent") this.split(this.agents[0]?.run);
        cx.notify();
      }
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

  render() {
    return this.shell ? this.renderShell() : this.renderMain();
  }

  renderMain() {
    const t = theme();
    const f = focused();
    const space = spaces().find((s) => s.id === f?.space) ?? spaces().find((s) => s.active);
    const tabs = (space?.tabs ?? []).filter((tb) => !tb.settled);
    const here = panes().filter((p) => p.tab === f?.tab);
    const tabPill = (tb) => div().id(`tab-${tb.id}`).h(22).px(8).rounded(6).flex().items_center().gap(5)
      .text_size(11.5).text_color(tb.active ? t.foreground : t.muted)
      .bg(tb.active ? t.selected : "#00000000").hover((s) => s.bg(t.hover)).cursor_pointer()
      .on_click(() => run("tab.select", { id: tb.id }))
      .child(tb.named ? tb.name : `Tab ${tb.name}`)
      .when(tb.panes > 1, (el) => el.child(div().text_size(10).text_color(t.dim).child(`×${tb.panes}`)));
    return div().id("bar").size_full().flex().flex_row().items_center().gap(8).px(10).bg(t.chrome)
      .child(div().text_size(15).child(here.length > 1 ? "🐎" : "🐄"))
      .child(div().text_size(12.5).font_semibold().text_color(t.foreground).truncate().child(space?.name ?? "—"))
      .when(!!space?.branch, (el) => el.child(div().flex().flex_row().items_center().gap(3).text_size(11).text_color(t.dim)
        .child(svg("mods/workspace-chrome/git-branch.svg").size(11).text_color(t.dim)).child(space.branch)))
      .child(div().text_size(11).text_color(t.dim).child(`${here.length} panel${here.length === 1 ? "" : "s"}`))
      .when(tabs.length > 1, (el) => el.child(div().flex().flex_row().gap(2).ml(6).children(tabs.map(tabPill))))
      .child(div().flex_1())
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
