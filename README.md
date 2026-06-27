# ToolBoxx

A Sketch plugin offering productivity tools for working with symbols and layers. Public release.

> ⚠️ This is an auto-generated public release repo. Its `src/` is produced from the
> private `toolboxx` repo via a curated release allowlist — do **not** edit `src/` here
> by hand; changes belong in the private repo. This README describes the current
> **implementation state** (read from code on 2026-06-27), not a target design: a
> feature absent here is "not yet released to the public build", not "not wanted".

## What it is

ToolBoxx is a [Sketch](https://www.sketch.com/) plugin built with
[skpm](https://github.com/skpm/skpm). The public build currently ships **one** command;
the private source repo (`toolboxx`) contains the full toolset, and only the commands on
its release allowlist are exported into this public repo.

## Tools

| Tool | Menu | What it does |
|---|---|---|
| Rename Layer After Content | ToolBoxx → Rename Layer After Content | Renames selected layers after the symbol they contain. |

### Rename Layer After Content

Resolves a new name for each selected layer from its symbol content:

- **SymbolInstance** → name of its SymbolMaster
- **SymbolMaster** → the master's own name
- **Group / Frame / Artboard** → name of its first direct child that is a SymbolInstance
  or SymbolMaster (instances resolve to the master name)
- **Anything else** → skipped

Layers already matching their resolved name are left untouched. After running, a status
message reports how many layers were renamed and how many were skipped for containing no
symbol. The command identifier is `toolboxx.renameLayerAfterContent`.

## Stack

- Sketch plugin via **skpm** (`@skpm/builder` ^0.9.5)
- Sketch JS API (`require('sketch')`), with a native-object fallback
  (`sketchObject.symbolMaster()`) for resolving symbol masters
- Requires Sketch **>= 49.0** (`engines.sketch`)

## Structure

```
src/
  manifest.json      # plugin manifest: name, commands, menu
  renameLayer.js     # the Rename Layer After Content command
assets/
  icon.png           # plugin icon
package.json         # skpm config + build scripts
```

The built artifact (`toolboxx.sketchplugin`) is git-ignored and produced by skpm.

## Installation

- [Download](../../releases/latest/download/toolboxx.sketchplugin.zip) the latest release
- Un-zip and double-click the `.sketchplugin`

## Development

```bash
npm install        # runs build + skpm-link via postinstall
npm run build      # one-off build (skpm-build)
npm run watch      # rebuild on change (skpm-build --watch)
npm run start      # watch + run in Sketch (skpm-build --watch --run)
```

Built with [skpm](https://github.com/skpm/skpm).

## Status

- Public build ships a single command: **Rename Layer After Content**.
- `manifest.json` lists no keyboard shortcut for the command (run it from the
  ToolBoxx menu); a shortcut is not yet configured.
- Additional tools that exist in the private `toolboxx` repo are not yet on the public
  release allowlist.

---
_Public release. Generated from the private `toolboxx` repo via its release allowlist — do not edit `src/` here by hand._
