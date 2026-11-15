# NiuMa

A pasture across the top of the window where every coding agent is a pixel-art horse or
cow, grazing, waiting or lying down depending on its status. Sub-agents are rabbits,
squirrels and hedgehogs at their parent's feet, and every plain terminal (a dev server, a
test run, a REPL) is a cooking pot, fire pit or magic crystal that burns while a command
runs. Below the pasture: a bar with your spaces as pills, the active tab's panels side by
side across the whole width, and a long-lived shell along the bottom. No sidebar. Dark
(`moss`) theme.

![NiuMa](preview.png)

The same demo pasture in the evening and at night: [previews/evening.png](previews/evening.png),
[previews/night.png](previews/night.png).

## What you see

Top to bottom, then left to right. The system title bar is hidden; on macOS the window
buttons sit over the sky at 14, 14. 1px dividers in the theme's `border` colour between
regions.

**Pasture**, 340px high (drag 180–600), the full width. Dragging empty sky or grass moves
the window. From back to front:

- **Sky**, the top 38% (the horizon is at 0.38 of the height), a vertical gradient:
  - day `#6ec3ff` → `#dff4ff`, the sun (30px `#ffe680` disc, 2px `#fff6b8` ring, a pulsing
    52–62px `#fff3b040` glow) high at 74% of the width;
  - evening `#5566ad` → `#ffc183`, the sun low over the peaks, orange `#ffa64d` with a
    `#ffd29a` ring and a `#ff8a3d55` glow, and a warm `#ff8a3d14` wash over the land;
  - night `#0b1230` → `#2c3f74` with 26 twinkling 1–2px stars and a crescent moon.
  The sky is separate from the app's theme (the dark `moss` theme stays on everywhere
  else).
- **Five clouds**, white pixel blobs (`#ffffff` with a `#dbe8f5` underside), 1.6–2.5×
  scaled, drifting back and forth across different stretches of the sky over 90–170 s;
  each cross-fades between two shapes every 7–13 s, so they slowly change. 85% opacity in
  the evening, 35% at night.
- **Far mountains**: a jagged range across the width, gradient `#93acd6` → `#cbdaee`
  (night `#34446e` → `#4a5d8a`), snow caps `#fbfdff` on the taller peaks.
- **Middle hills**, rounded, bluish green `#6fa6a0` → `#94c79a`; a little red barn (16×12
  art px) at 30% and four small trees at 13%, 17%, 47% and 86% along the hill foot.
- **Meadow**, rolling down to the bottom, `#8fd36c` → `#4f9b3d` (night `#2a5a33` →
  `#1c3f24`), with grass tufts and white, yellow and pink flowers scattered over it
  (46 per 1200px of width), a third of them swaying.
- **Creek**: winds from a thin line at the horizon (63% across) to a wide mouth at the
  bottom (about 52% across), widening with depth. Sandy banks `#cdbb84`, water gradient
  `#d6f2ff` → `#4aa3e0`, nine white shimmer streaks sliding across it.
- **Animals, critters and terminal objects**, drawn far to near, nearer ones larger
  (below).
- **Oak fence** right at the front, as if you're leaning on it: two runs only, the left
  20% and the right 20% of the width, the middle open. Posts 11px wide and 24% of the
  pasture high, every 150px; two rails 6px high. Oak `#b07d4b` with a `#cfa070` highlight
  and a `#7f5530` edge.
- **Name tags and command bubbles** (above everything else).
- **Status counts**, centred at the bottom between the fence runs: four pills, 20px high,
  `#0f1c22d0`, 11px white text, each with a 14px status circle: `! Needs you N`,
  `✓ Done N`, `• Working N`, `z Idle N`. A zero pill is dimmed.

Depth: an object's feet sit between `horizon + 7%` (far, t = 0) and `bottom − 16px` (near,
t = 1). An animal's art pixel is `(3 + 1.8t) × k` screen pixels (the nearest 1.6× the farthest), `k = height / 320` (0.55–1.8),
so a near cow is about 173px wide at the default height and a far one about 108px.

**Animals** (one per agent). 36 × 28 art units, drawn at 3 pixels per unit (108 × 84),
facing left or right. Twenty-two breeds (the moose only in November and December), each with its own size; each animal also varies
0.92–1.08 on top. A new animal's breed is picked when it arrives (by its address): a
unicorn one time in ten, else one of the other twenty. It's saved with its spot as `b`; a
spot saved without one uses the first sixteen, so animals from before the later breeds
were added keep their breed:

| Breed | Size | Look |
|---|---|---|
| Chestnut horse | 1.0 | red-brown `#b8693a`, dark mane |
| Grey horse | 1.0 | `#eceff3`, grey mane |
| Black horse | 1.05 | `#3d3d4a`, white blaze and socks |
| Palomino | 0.95 | gold `#e8bf6c`, cream mane |
| Pinto pony | 0.78 | white with brown patches |
| Bay horse | 1.0 | `#8a4b2a`, black mane and legs |
| Buckskin horse | 0.95 | tan `#dcb978`, black points |
| Appaloosa | 0.95 | white with dark spots on the rump |
| Shire draft horse | 1.25 | dark bay, white blaze and feathered socks |
| Holstein cow | 1.1 | white with black patches, pink muzzle |
| Jersey cow | 0.88 | `#c98a4f`, darker face, black nose |
| Highland cow | 0.92 | shaggy orange, fringe over the eyes, long horns |
| Hereford cow | 1.05 | red `#8e3b20`, white face and belly |
| Angus cow | 1.05 | black, no horns |
| Belted Galloway | 0.95 | black with a white belt, no horns |
| Brown Swiss cow | 1.12 | grey-brown `#8e7c6c`, dark muzzle |
| Bull | 1.18 | dark brown `#4a2c20`, a muscled crest over the shoulders, short thick horns, a brass `#d9a934` nose ring |
| Ox | 1.22 | pale `#d9cdb8`, long horns sweeping out and up |
| Water buffalo | 1.12 | slate `#4c5058`, big crescent horns curving back, ridged |
| Bison | 1.2 | `#8a5f3c` hindquarters, a high hump and a shaggy dark `#4a3020` cape over the front half, head and beard, short black horns |
| Unicorn (rare) | 1.0 | pearly `#fbf8ff`, a golden `#f2c94c` spiral horn, mane and tail in pastel rainbow bands (`#ff9ecb` `#ffc49b` `#fff09a` `#a8f0c0` `#9fd8ff` `#c8a8ff`), pale gold hooves; three sparkles twinkle round the horn while it isn't doing a click move. Acts like a horse |

Each is shaded (lighter top edge, darker bottom edge) with a one-pixel dark outline, an
eye with a white highlight, nostrils and a mouth line. No udders. The bull, ox, buffalo
and bison act like cows.

**Shadows**: under every animal and pet, two stacked soft ellipses on the ground at its
feet, cast away from the sun (which sits at 74% across): by day short (0.12–0.30 of the
body width past it, tone `#1d3a1238`), in the evening long and flat (0.55–1.0, `#3a1e0a33`),
at night faint (`#0a12301f`). They stay on the ground while an animal hops or bucks.

- **Name tag** over the head, always shown: a rounded 7px box `#10201ad9` with a 1px
  `#ffffff30` border (`#e5484d` when it needs you). Line 1: a short summary of the last
  question asked, 10.5–13px semibold white (up to 44 characters, first clause, leading
  "please / can you / could we…" dropped, then `…`). Line 2, 1.5px smaller, `#c9e8c4`:
  `<space> · tab <n>`, plus ` · 🐇 N` while N sub-agents are out.
- **Status badge** centred under its feet: a 15–26px circle with a 2px white border, in
  the status colour: working `#3d8be0` with a turning `◐◓◑◒`, needs you `#e5484d` with
  `!`, done `#3fb26b` with `✓`, idle `#8b93a1` with `z`.
- No hover card: the name tag already says it. Hovering only rereads the question.

**Critters** (one per sub-agent), 16 × 12 art units at half the parent's scale: a brown
rabbit, a white bunny, a red squirrel holding a nut, or a hedgehog. They line up beside
the parent, alternately behind and in front of it, never on it.

**Terminal objects** (one per plain terminal), 12 × 12 art units at 0.75 of an animal's
scale (27–54px), scattered like the animals:

- **Fire pit**: a ring of grey stones around crossed logs on ash.
- **Cooking pot**: an iron pot of water hanging from a wooden tripod over two logs.
- **Magic crystal**: three crystal shards in a grass tuft; dim purple when idle.

**Below the pasture**, the full width (no sidebar), a column:

- **Bar**, 36px, `chrome`, left to right:
  - 🐄 (🐎 when the tab is split);
  - **space pills**, one per space: 24px high, 7px radius, at most 190px, a 7px dot in
    the space's status colour (`blocked`, `done`, `working` from the theme; `dim` at half
    opacity when idle), its name (12px, cut short with `…`), and `@<machine>` (10px
    `dim`) for a space on another machine. The current space is `selected` with a 1px
    `input` border and a semibold name. They shrink and clip when there are many.
    Tooltip: `<name> · <branch> · on <machine>`;
  - a 24px **+** (`plus` icon, `muted`), tooltip `New space (⌘N)`;
  - a 1×18px divider in `border`;
  - the current space's git branch (11px `dim`, branch icon), `N panels`, and the
    space's tabs as small pills (`Tab 1 ×2`) when there's more than one;
  - on the right: a 24px **⚙** (`settings` icon), tooltip `Agent start commands`; a
    `+ Split` button; one button per installed agent (up to three, the first filled with
    `accent`), 24px high, 12px text, 6px radius.
- **Panels**, `canvas` background with 6px padding: the active tab's panes as cards, 6px
  apart, 8px radius, `background` fill, 1px `border` (1px `accent` when focused), a 28px
  Herdr `pane` header on top of each; a single pane is framed too.
- **Shell**, 210px (80–700): a 30px bar (terminal icon in `accent`, `Shell`, its folder in
  `dim`, and on the right `cd <focused panel's folder>`, `Clear`, `Restart`) over a live
  terminal.
- **Agent start commands** (the ⚙ dialog, 600 × 560, `popover` background): the title
  (15px semibold), `What the agent buttons, ⌘⇧T and Herdr's menus run to start each
  agent. Saved as its run in programs.json.` (11.5px `muted`), then a card each for
  **Claude Code** and **Codex** (`surface`, 1px `border`, 8px radius): the name (13px
  semibold), `not installed` when it isn't, `Reset to default` (11px `accent`) on the
  right, `Default: <command>` (11px `muted`), and a 32px text field in JetBrains Mono
  12.5px with the current command. Under them a card with a 32 × 18 switch (`accent` on,
  `input` off, a white knob sliding 150 ms), **Start agents in a shell** and, wrapping,
  `The agent buttons and ⌘⇧T open a shell panel and type the command, so it gets your
  ~/.zshrc (env for Vertex, Bedrock, proxies). Off: Herdr starts it directly, without
  ~/.zshrc.` Then a second switch card, **Show the shell at the bottom**: `Off hides the
  bottom shell and its bar; the shell keeps running and comes back when you turn this
  on.` At the bottom: a status line, `Close` and `Save`.
- Terminals have 10 × 6px padding and full opacity.

## How it behaves

**Agent statuses**:

| Status | The animal | Tag |
|---|---|---|
| working | head down grazing, the head bobbing 1 art px every 0.65–0.95 s; tail swishing (two tail positions cross-fading every 1.3–1.9 s). About half of working animals (picked by address) drink instead when their spot is within about one body length of the creek and nobody else drinks on that bank at that depth: they step to the bank and drink with the nose at the water, a ripple ring growing at the muzzle | blue spinner badge |
| blocked (needs you) | standing, tail swishing; a bouncing 18–30px red `!` sign over its tag | red-bordered tag, `!` badge |
| done | lying down, legs folded, eyes closed in a happy arc, blushing | `✓` badge |
| idle | standing, tail swishing | `z` badge |

- **Spots.** A new animal fades in (0.9 s) at the least crowded of 120 spots that keep
  its whole body off the creek, ties going to the one farthest from everyone. Crowding is
  overlap with every other animal and terminal object, as a share of its body: bodies
  fully, a name tag over a body half, two tags a quarter. It keeps that spot (remembered
  across restarts in `localStorage` `spots`; on load any spot this version can't use,
  e.g. one saved by an older version, is dropped and picked again); animals never slide
  around. Remembered spots more than 15% crowded
  move once at start and when the meadow's size changes a lot (later addresses move
  first). They're drawn far to near.
- **Questions.** The tag's summary is the last prompt line on
  the agent's screen (`❯`, `›` or `>` followed by text), read with `hc read <t> --lines
  400`. The input box at the bottom (a prompt line right under a `────` rule) is skipped:
  it's a draft. Read again on every new turn, on hover (at most every 20 s) and every
  2.5 s while working. Falls back to the terminal title if that says more than the
  program's name, else `No question yet`.
- **Sub-agents.** Two kinds, both shown as critters:
  - Herdr's own: terminals whose `parent` is an agent (`hc run` from an agent), while
    live and not done. Clicking one peeks at it.
  - Claude Code's Task/Agent calls, read off the parent's screen in the current turn:
    `⏺ Agent(<what>) <model>` (or `Task(…)`, or any tool call whose output counts tool
    uses), `⏺ N background agents launched` followed by `├ <what>` / `└ <what>` lines,
    and any later `⏺ Agent "<what>" …` status line (a fan-out's launch list names only
    the first two; e.g. `… is waiting on its own background work` names the rest).
    Finished when `Done (` shows under the call, or `⏺ Agent "<what>" finished`
    (completed, failed, stopped) appears. A name that shows up again after it finished is
    a new sub-agent (the same task fanned out twice in one turn). The same sub-agent can
    show three times (call, launch list, the task list under the prompt) and, in a narrow
    pane, cut short with `…` or wrapped: names that start one another are one sub-agent,
    wrapped `⏺ Agent "…` lines are joined first, and a cut name only finishes the single
    sub-agent it matches, never adds one. Clicking one goes to the
    parent.
  - Busy critters sit and nibble (bobbing 0.5 art px), one in three hops back and forth;
    one that needs input wears a small `!`. Each stays at least 6 s, so a quick one is
    still seen. Finished (or when the parent stops working), it hops off the nearer edge
    of the meadow over 2.6 s and is gone. Hovering one shows `Sub-agent · Working:
    <what>`.
- **Terminal objects** (any of Herdr's terminals that isn't an agent or an agent's
  sub-agent, plus the bottom shell):

  | State | Fire pit | Pot | Crystal | Bubble |
  |---|---|---|---|---|
  | idle | unlit logs | still, no fire | dim purple | none (hover: `last: <cmd>` and its exit) |
  | running | flickering flames (two shapes cross-fading every 0.26–0.42 s), an orange glow, three sparks and two smoke puffs rising | fire under the pot, three bubbles popping on the water, two steam puffs (four after 30 s) | bright violet, pulsing every 1.2–1.5 s, four particles floating up | after 2 s: `▶ <command>` (40 characters, `…`), `<project> · <elapsed>` ticking every second; hover shows the whole command |
  | interactive (a REPL, editor, pager, `ssh`, …) | a small steady blue flame | a small blue fire | steady blue | `▷ <command>`, `<project> · interactive · <elapsed>` |
  | success | out, five green `✦` rising | still, green `✦` | green, `✦` | green border: `✓ exit 0 · <command>`, `<project> · <duration>`, for 4 s, then idle |
  | failed | out, six red sparks bursting outward for 2.5 s, a red `!` badge | same | red, sparks, `!` | red border: `✗ exit <code> · <command>`, `<project> · <duration> · click to dismiss`; stays until clicked or another command starts |

  `<project>` is the terminal's space name (`Shell · <folder>` for the bottom shell).
  Interactive means the foreground program is one of vim, nvim, vi, nano, emacs, less,
  more, man, top, htop, btop, ssh, mosh, psql, mysql, sqlite3, redis-cli, mongosh,
  lazygit, tig, tmux, fzf, k9s, bash, zsh, fish, sh, claude, codex (an agent that hasn't
  reported a status yet), or an interpreter (python, node, ipython, irb, ghci, lua, R,
  deno, bun, julia) started with no script. Names are compared lowercased, so macOS's
  `Python` counts. Clicking an object
  focuses its terminal (and dismisses a failure).
- **Sky.** Clicking the sun or moon cycles `Auto` → `Day` → `Evening` → `Night` →
  `Auto`; its tooltip reads `Sky: <mode> · click for <next>`. Auto follows the clock
  (evening 17:00–19:00, night 19:00–06:00, checked once a minute). The choice is kept in
  `localStorage` (`sky`); the pasture block's `props.sky` (`day`, `evening`, `night`)
  pins it instead.
- **Clicks.** An animal or its tag: focus its pane (`pane.focus`, or `terminal.peek` for
  one without a pane). Pressing on any of them doesn't drag the window.
- **Click actions.** Clicking an animal also plays a random move, never the same one
  twice in a row (a sitting one gets up for it). Horses: rear up (1.3 s),
  paw the air (rearing, front legs folding and striking, 3 × 0.46 s), buck (lifted 2.5
  art units, hind legs kicked out behind), paw the ground (with a `#c9a77a` dust puff),
  toss the head (up 18° / down 9°, three times), piaffe (diagonal pairs lifting in turn,
  body bobbing 0.8 art units, four strides). Cows don't rear or piaffe: they kick up
  their heels (two hops of 4 art units, legs tucked), paw the ground, shake the head
  (±10°) and moo (head up, mouth open, a cream `Moo!` bubble for 1.5 s). A second click
  during a move does nothing more than focus.
- **Spaces.** Clicking a space pill selects it (`space.select`). **+** and `⌘N` make a
  new space (`space.new`, named after its folder).
- **Agent start commands.** ⚙ opens the dialog. It reads `programs.json` and
  `knownAgents()`: an agent's default is Herdr's own command (what `knownAgents()` reports
  while `programs.json` doesn't override it, remembered in `localStorage` `defaults`), the
  field shows the current command. Commands are split like a shell line (`"…"`, `'…'`,
  `\ `) and shown quoted where needed. `Reset to default` puts the default back in the
  field. `Save` re-reads the file, sets each agent's `programs.<key>.run` (or removes it
  when it equals the default, keeping the file's other entries), writes it atomically
  only if it hasn't changed since, shows `Saved at <time>. New agents start with these
  commands.`, turns the button to `Saving…` then `✓ Saved` for 2 s, and posts a success
  toast `Agent settings saved` (an error toast if it fails),
  and bumps shared `niu-ma.agents` so the bar reloads its agent buttons. Save also runs
  `layout.hide` or `layout.show` on the `shell` column per the second switch (Herdr keeps
  that across restarts; the switch reads it back from `layout()`'s `hidden`). Running agents
  are unaffected.
- **Bar.** `+ Split` and `⌘T` add a panel to the current tab instead of a new tab: they
  split the widest panel (by its terminal's columns) to the right, so panels stay side by
  side across the centre. The agent buttons and `⌘⇧T` (the first installed agent) do the
  same with that agent: by default they split a plain shell panel (`herdr-app do
  pane.split`, which prints its terminal) and type the command into it with `hc send`, so
  the agent gets the shell's `~/.zshrc` and the shell stays when it exits. With the
  switch off, or no `herdr-app` on `PATH`, they pass `argv` to `pane.split` instead. Tab pills select their tab. `⌘W` closes only the focused
  panel (Herdr closes the tab with its last panel, and asks before closing a space).
- **Shell.** The bottom terminal is a kept core terminal named `niu-ma-shell` with no
  space labels (so it's in no space). `cd …` types `cd '<folder>'` into it and focuses it,
  `Clear` types `clear`, `Restart` ends it. Whenever it's gone (exited, restarted, a fresh
  install), the shell bar starts a new one within 4 s and puts the terminal block back.

## Built from

**Layout** `layouts/niu-ma.json`:

```
root (column, theme moss, titlebar none, traffic_lights [14,14], terminal_padding [10,6],
      terminal_opacity 1, divider 1 border, preview layouts/niu-ma.svg)
├─ pasture   block 340px (180–600), window_drag   mod niu-ma-pasture
└─ body      row, divider 1 border
   └─ work     column, divider 1 border
      ├─ bar     block 36px                mod niu-ma-bar
      ├─ main    block, background canvas, padding 6
      │          tab active, pane { header { mod pane, height 28, top, reveal always },
      │          background background, border 1 border, focus 1 accent, radius 8, gap 6,
      │          lone true }
      └─ shell   column 210px (80–700)
         ├─ shell-bar   block 30px   mod niu-ma-bar  props { role: "shell" }
         └─ shell-term  block  { terminal: <address> }   (added by niu-ma-bar at run time)
```

`keys.json`, merged into the person's:

```json
{ "layout:niu-ma": { "cmd-t": "niu-ma-bar.split", "cmd-shift-t": "niu-ma-bar.split-agent",
                     "cmd-w": "pane.close", "cmd-n": "space.new" } }
```

**`mods/niu-ma-pasture/`** (`mod.json`: `{ "place": "none" }`; props: none, or
`{ demo: true }` for made-up agents and terminals in every state (with a bison, a
unicorn and a bull among them), used for the previews,
and/or `{ sky: "day" | "evening" | "night" }` to pin the sky):

- `main.js`: the scene (sky, mountains, hills, meadow and creek as native `paint_path`
  polygons with linear gradients), placement, animals, tags, critters, terminal objects,
  bubbles, fence and counts. All motion is native (`loop`, `frames`, `transition`); the
  only timers are a 1 s tick while a bubble's clock or a flash is showing, one
  `timer.after` per step of a click action, 2.5 s screen
  reads for working agents and a 60 s clock check for the sky.
- `sprites/`: 609 SVGs, generated by `tools/sprites.py` (Python 3, no packages):
  `<breed>-stand|graze-body|graze-head|sit-<r|l>`, `<breed>-tail-<a|b>-<r|l>` (21 breeds),
  `<breed>-act-<frame>-<r|l>` (horses: `rear-a|rear-b|buck|paw-a|paw-b|toss-up|toss-down|
  trot-a|trot-b`; cows: `hop|paw-a|paw-b|shake-a|shake-b|moo`, on a 44 × 38 grid with the
  usual 36 × 28 one at (4, 10), tail included),
  `critter-<rabbit|bunny|squirrel|hedgehog>-<sit|hop>-<r|l>`, `obj-firepit-base`,
  `obj-firepit-flame-<a|b|blue>`, `obj-pot-base`, `obj-pot-fire-<a|b|blue>`,
  `obj-crystal-<dim|lit|blue|green|red>`, two-shape clouds (`cloud<1–4><a|b>`), tufts,
  flowers, a tree, a barn, and `fence.svg` (left from an earlier version; the front fence
  is drawn natively).
  Breed options in `tools/sprites.py` switch on extra parts in `hd.py`: `crest` and `ring`
  (bull), `horns: "long" | "crescent" | "short"` (ox, buffalo, bull and bison), `hump`
  and `cape` (bison), `horn` and `rainbow` (unicorn).
  `tools/hd.py` draws animals from ellipses, polygons and tapering strokes rasterised at
  3 px per art unit, then shades and outlines them; `critters.py` and `objects.py` use the
  same shapes. `actions.py` draws the click poses from the same parts (torso, legs with
  new joint points, head, tail), turning each about a joint (hip for rearing, shoulder
  for bucking, neck for head tosses) by inverse-mapped nearest-pixel rotation, since GPUI
  motion can't rotate.
- `shell/niu-ma.zsh`: zsh shell integration. In a Herdr terminal (`$HC_TERMINAL_ID` set)
  its `preexec` / `precmd` hooks run `hc label "$HC_TERMINAL_ID" …` in the background,
  recording `niu-ma.state` (running/done), `niu-ma.cmd`, `niu-ma.start`, `niu-ma.exit`
  and `niu-ma.end` (ms) on the terminal. The pasture reads them from `terminals()`.
- `herdr` functions: `agents`, `terminals`, `spaces`, `panes`, `run`, `hc`, `settings`,
  `props`. Commands: `pane.focus`, `terminal.peek`.
- Shared/stored: `localStorage` `spots` (each animal's and object's spot) and `sky`
  (the clicked sky mode).

**`mods/niu-ma-bar/`** (`mod.json`: `{ "place": "none" }`; props `{}` for the bar over the
panels, `{ role: "shell" }` for the shell's bar, `{ role: "agents" }` for the ⚙ dialog,
which the bar opens with `openOverlay({ mod: "niu-ma-bar", props: { role: "agents" }, kind:
"dialog", width: 600, height: 680 })`, `{ role: "upgrade" }` for the update window the
**Update** button opens, 560 × 520):

- `herdr` functions: `spaces`, `panes`, `focused`, `terminals`, `run`, `theme`, `props`,
  `layout`, `knownAgents`, `nextCommand`, `hc`, `exec`, `home`, `appHome`, `openOverlay`,
  `closeOverlay`, `readTextFile`, `writeTextFile`, `shared`, `setShared`. `InputState` and
  `Input` from `gpui-base` for the command fields.
- Commands: `space.select`, `space.new`, `pane.split` (right, with `argv` for an agent),
  `layout.hide` / `layout.show` (`shell`),
  `tab.select`, `tab.new` (an empty tab), `pane.focus`, `terminal.kill`, `layout.set` (to
  put the shell block back).
- Key commands (`nextCommand`): `split`, `split-agent`.
- Programs: `herdr-app do pane.split|tab.new` and `hc send <t> <command>` (agents in a shell);
  for updates `fetch` (falling back to `curl`) of `VERSION` and `CHANGELOG.md` on `main`,
  and Upgrade's two `sh -c` scripts: `curl` the `main` tarball from codeload.github.com into
  a temp folder, then back up, copy, `herdr-app check`; `open` / `xdg-open` for Sponsor.
- Shared/stored: shared `niu-ma.agents` (bumped on Save), shared `niu-ma.agent-shell`
  (`false` when the switch is off; absent means on), shared `niu-ma.update`
  (`{current, latest, checked, error}`, the last check, every 6 h), shared
  `niu-ma.update-check` (`false` turns the check off), `localStorage` `defaults`
  (each agent's default command).
- Icons from Herdr's `workspace-chrome`: `git-branch.svg`, `plus.svg`, `settings.svg`,
  `terminal.svg`.

**Herdr's mods it uses**: `pane` (the panel headers). There's no sidebar, so Herdr's
`spaces` and `agents` lists aren't used; the bar's pills and the pasture replace them.

## Watch out

- **Programs it runs.** `niu-ma-pasture` runs `hc read <terminal> --lines 400` on agents'
  terminals (to read the question and sub-agents); it reads screen text, never sends.
  `niu-ma-bar` runs `hc run --json --keep --bg --no-parent --name niu-ma-shell --label
  niu-ma.role=shell --cwd ~` to start the shell, and `hc send --force <shell> …` for
  `cd` and `Clear`. The zsh hook runs `hc label` around every command. Nothing calls
  `fetch` or reaches the network, and no files outside Herdr's folder are read or written.
- **The ⚙ dialog writes `~/.config/herdr-app/programs.json`** (Herdr's own program
  table), changing what Herdr's menus run too, not only this layout's buttons. It writes
  only `programs.claude.run` and `programs.codex.run`, and only if the file hasn't changed
  since it was read.
- **Herdr skips `~/.zshrc` for an `argv`.** `pane.split {argv}` runs the program from
  Herdr's own environment: variables set in `~/.zshrc` (cloud credentials for a Vertex or
  Bedrock Claude) are missing. A plain split runs your interactive shell, which reads it;
  so type the command in. Herdr's own menus still start agents directly.
- **Hit areas.** An animal's picture box has empty corners; put clicks on a body-sized
  box (art 3–33 across, 2–27 down), or the one in front blocks the one behind.
- **No sidebar.** Herdr's default `⌘B` toggles a `sidebar` node, which this layout
  doesn't have, so it shows an error there. Renaming, reordering and worktree actions for
  spaces are in the command palette (`⌘⇧P`).
- **The zsh hook needs one line in `~/.zshrc`:**
  `[[ -n $HC_TERMINAL_ID ]] && source ~/.config/herdr-app/mods/niu-ma-pasture/shell/niu-ma.zsh`.
  Without it, objects still show running (from the core's foreground process: its pid
  differs from the shell's), the command line and elapsed time, but a finished command
  shows `✓ finished` with no exit code and failures look like successes. Other shells
  (bash, fish) have no hook yet.
- **Sub-agents and questions come from screen text**, so they follow Claude Code's
  output format (`⏺ Agent(…)`, `background agents launched`, `Agent "…" <status>`,
  `Done (`). Don't trust the launch list alone: with four or more it names only the
  first two. Another agent's sub-agents only show if they're Herdr terminals. Narrow
  panes cut and wrap these lines; matching names exactly turns two sub-agents into four
  pets.
- **No rotation in motion** (`opacity`, `width`, `height`, `left`, `top` only): poses
  are separate sprites, swapped on timers; lifts use `top` with a 200 ms transition.
- **Zoom.** `on_size_change` reports zoomed pixels while the mod's own pixels are zoomed
  too: divide the size by `settings().zoom`, or the scene overflows at any zoom but 1.
- **Herdr removes a terminal block when its terminal ends**, so the shell bar has to add
  `shell-term` back (via `layout.set`), not just repoint it. Don't ship a layout with a
  terminal address in it: it means another terminal (or nothing) on another machine.
- **Write `mod.json` before `main.js`** when creating the mods: a folder Herdr sees without
  `mod.json` gets docked into whatever layout is showing.
- **Positions.** Placement is by fractions of the panel, but the creek, scale and fence
  depend on its height: test at 180px and 600px. Very wide windows spread animals thin.
- **Glyphs.** Some symbols (e.g. `⌨`) aren't in the UI font and draw as boxes; `▶ ▷ ✓ ✗ ✦
  ! ◐◓◑◒ 🐇` are fine.
- **Assumes** Herdr's `pane` mod and `workspace-chrome` icons
  (a default install), `hc` on the shell's PATH, macOS key names (`cmd-…`) in `keys.json`.

## Done when

- In November or December, a spot saved with `"b": "moose"` shows a dark brown moose with
  pale antlers hung with red, gold, green and blue lights that twinkle, a red scarf with a
  green stripe and a gold bell, a red nose and a short tail; in any other month the same
  spot shows a regular breed. New agents arrive as a moose about one time in five, only in
  those two months.

- ⚙ shows the installed version (`mods/niu-ma-bar/VERSION`) and the latest (`VERSION` on
  `main`, via raw.githubusercontent.com) with **Check now** and **Sponsor** (opens
  github.com/sponsors/limbov8). With an older `mods/niu-ma-bar/VERSION`, the bar shows an
  accent **Update** button next to ⚙ within 15 minutes of starting; it opens a window with
  the newer `CHANGELOG.md` sections and **Upgrade**, which leaves the previous files in
  `.niu-ma-backup/`, installs `main`, and the button goes away.

- `herdr-app check` passes for `mods/niu-ma-pasture` and `mods/niu-ma-bar`.
- `herdr-app do layout.switch '{"name":"niu-ma"}'` shows the pasture on top, the bar with
  a pill per space, framed panels with headers across the full width, and within a few
  seconds a live shell at the bottom. There's no sidebar.
- Clicking a space pill switches to it; **+** and `⌘N` make a new space.
- ⚙ shows Claude Code's and Codex's default commands; saving `declawd --yolo` for Claude
  Code puts `"claude": { "run": ["declawd", "--yolo"] }` in `programs.json`, and the bar's
  Claude Code button then starts `declawd --yolo`. It opens a shell panel and types the
  command, and a variable set only in `~/.zshrc` is set for the agent; with **Start
  agents in a shell** off and saved, it isn't.
- Turning **Show the shell at the bottom** off and saving hides the shell and its bar and
  the panels take the full height; turning it on brings back the same shell, still
  running.
- Every agent is a horse or cow with a name tag (question summary, `space · tab`) and a
  status badge under its feet; the bottom-centre pills count them. Hovering one shows no
  second card.
- Clicking a horse plays one of rear, paw the air, buck, paw, toss, piaffe; a cow (or bull,
  ox, buffalo, bison) one of hop, paw, shake, moo (with `Moo!`), never the same twice in a
  row, each back to its pose after 1–2 s.
- Starting several new agents brings in some of the bull, ox, buffalo and bison, and
  every animal has a shadow pointing away from the sun.
- Saving in ⚙ shows `✓ Saved` on the button and a toast, even when nothing changed.
- A Claude Code agent in a narrow pane that fans out 2 sub-agents shows 2 critters, not 4.
- A working agent grazes (or drinks at the creek), a blocked one gets the red `!` sign,
  a done one lies down, an idle one stands swishing its tail.
- Asking a Claude Code agent to "fan out 4 subagents that each run for 20 seconds" puts
  four critters beside it (`🐇 4` on its tag); they hop away after they finish. Asking
  again in the same turn shows four again.
- In the bottom shell with the hook loaded, `sleep 6` shows a running bubble after 2 s
  with a ticking time; `ls /nonexistent` leaves a red `✗ exit 1` until clicked; `true`
  flashes green `✓ exit 0`; `python3` shows a steady blue flame.
- `⌘T` adds a side-by-side panel to the current tab; `⌘W` closes just that panel.
- Clicking the sun four times goes day → evening (low orange sun, dusk sky) → night (moon,
  stars) → back to the clock, and the choice survives a restart.
- With `"props": { "demo": true }` on the pasture block, the scene matches `preview.png`;
  adding `"sky": "evening"` or `"night"` matches `previews/evening.png` / `night.png`.
- A unicorn (force one by giving a spot `"b": "unicorn"`) has a rainbow mane and tail, a
  golden horn and sparkles, and rears or bucks when clicked.
