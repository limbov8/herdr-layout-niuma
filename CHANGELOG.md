# Changelog

Newest first. Each release is a `## <version> — <date>` heading; the ⚙ dialog and the
update window show the sections newer than the installed version. When releasing, bump
both `VERSION` and `mods/niu-ma-bar/VERSION` (the installed copy reads the latter).

## 1.5.0 — 2026-11-17

- **Space shortcuts.** ⌘1–⌘9 switch to space 1–9 and ⇧⌘[ / ⇧⌘] go to the previous / next
  space (in the NiuMa layout; Herdr's tab shortcuts on those keys still work elsewhere).
- **Shortcuts in ⚙.** A Shortcuts card lists every NiuMa key (spaces, new space, new panel,
  new agent panel, close panel) with a field to change it, Default, or empty to turn it off.
  Saved to keys.json's `layout:niu-ma` section; Upgrade no longer re-adds a key for an
  action you've rebound.
- **Reconnect machines.** When a machine says it needs a login (after it was down or
  restarted), NiuMa opens `hc machine login <name>` in a Log in tab on this computer and
  switches to it, so you only type the password or code; the tab closes once you're in and
  you're taken back. Closed without logging in, it asks again after 2, 4, 8, 16, then every
  30 minutes. A switch in ⚙ turns it off.

## 1.4.0 — 2026-11-16

- **Tokens and cost.** Each Claude Code and Codex agent's name tag gets a line like
  `1.2M tok · $3.4 / $8.0`: tokens this session (not counting cache reads), then the
  estimated API cost today / for the whole session, at Anthropic's list prices. On a
  subscription it's what the work would have cost on the API. Codex shows tokens only.
  Read once a minute from the agents' own session files; **Show tokens and cost** in ⚙
  turns it off.
- **Pick the machine for a new space.** The bar's **+** opens a small menu: This computer,
  every machine Herdr knows (offline ones dimmed), and Add machine…. ⌘N still makes one on
  the current space's machine.

## 1.3.1 — 2026-11-15

- The bottom shell's fire pit (or pot, or crystal) now leaves the pasture when the bottom
  shell is hidden in ⚙, and comes back when it's shown.

## 1.3.0 — 2026-11-15

- **Turn animals round.** ⌃ Ctrl-click (or ⌘-click) an animal to make it face the other way.
- **Move things.** Hold ⇧ Shift + ⌃ Ctrl (or ⇧⌘) and drag an animal, a fire pit, a cooking pot
  or a crystal to put it somewhere else: sideways across the meadow, or up and down to send
  it farther or bring it nearer (it shrinks and grows as it goes). Nothing lands in the
  creek. Both are kept across restarts, and a plain click still does what it did.
- The update check always runs every 6 hours; its switch is gone from ⚙.
- **Feedback.** A Feedback button in ⚙ (and a link in the update window) opens a new GitHub
  issue. In ⚙, Sponsor, Buy me a coffee and Feedback sit on their own row under the version.

## 1.2.2 — 2026-11-15

- Animals at the back of the meadow are a third smaller, so depth reads more clearly; the
  front ones keep their size (the nearest are now 2.4× the farthest).

## 1.2.1 — 2026-11-15

- Animals near the front are smaller: 1.6× the size of the farthest ones instead of 2×.

## 1.2.0 — 2026-11-15

- **Christmas moose.** In November and December about one new agent in five arrives as a
  moose with palmate antlers hung with twinkling lights, a red scarf with a gold bell and a
  red nose. It acts like a horse when clicked. Outside those months a moose shows as one
  of the regular breeds.
- The version and Sponsor card moved to the bottom of the ⚙ dialog, with a Buy Me a Coffee
  button next to Sponsor.

## 1.1.0 — 2026-11-14

- **Update check.** The bar checks GitHub for a newer NiuMa every 6 hours and shows an
  update icon next to ⚙ when there is one. It opens a window with what changed and an
  **Upgrade** button.
- **Version in ⚙.** The settings dialog shows the installed and latest version, a
  **Check now** button, the changelog of a newer version and **Upgrade**.
- **Upgrade in place.** Upgrade downloads the latest `main`, keeps your previous files in
  `~/.config/herdr-app/.niu-ma-backup/`, copies the layout and both mods over, adds any new
  `layout:niu-ma` keys without replacing yours and runs `herdr-app check`.
- **Sponsor.** A Sponsor button in ⚙ opens GitHub Sponsors.
- A switch in ⚙ turns the update check off.

## 1.0.0 — 2026-11-13

- The pasture: twenty-one breeds of horses and cows (and a rare unicorn) for agents,
  critters for sub-agents, campfires, pots and crystals for terminals, sun shadows, click
  actions and a day, evening and night sky.
- The bar: spaces as pills, Split and agent buttons, ⚙ for agent start commands, starting
  agents in a shell and hiding the bottom shell.
- A long-lived shell along the bottom.
