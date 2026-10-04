# Contributing

Issues and pull requests are welcome at
[danielnichiata96/obsidian-citeme](https://github.com/danielnichiata96/obsidian-citeme).

## Setup

```bash
npm install
npm run dev   # watch mode; copy main.js, manifest.json and styles.css into <vault>/.obsidian/plugins/citeme/
```

## Before opening a pull request

Run the same checks as CI:

```bash
npm run lint
npm run format:check
npx tsc -noEmit
npm test
npm run build
```

Code follows the [Obsidian plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines),
which the Obsidian Community directory scans on every release. In particular,
use `window.setTimeout()` and `window.clearTimeout()` so timers work in popout
windows, and use sentence case for UI text.

## API contract

The plugin calls the public CiteMe API. `tests/contracts/` pins the response
fields, usage headers and style list the plugin depends on. When the CiteMe
web app changes them, refresh the snapshot with `npm run sync:saas-contract`
(it reads a sibling `../citeme` checkout) and update the plugin in the same
pull request.

## Releasing

1. Run `npm run bump:version <x.y.z>`; it updates `package.json`,
   `manifest.json` and `versions.json`.
2. Add a `## [x.y.z] - YYYY-MM-DD` section to `CHANGELOG.md`.
3. Commit, then push a tag named exactly `x.y.z`.

The `Release` workflow builds the plugin, attests `main.js`, `manifest.json`
and `styles.css`, and publishes the GitHub release with the changelog section
as its notes. Do not create the release by hand; the workflow would then fail
on the existing tag.
