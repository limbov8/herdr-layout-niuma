# Changelog

Newest first. Each release is a `## <version> — <date>` heading; the ⚙ dialog and the
update window show the sections newer than the installed version. When releasing, bump
both `VERSION` and `mods/niu-ma-bar/VERSION` (the installed copy reads the latter).

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
