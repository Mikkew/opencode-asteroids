# AGENTS.md

Compact guidance for OpenCode sessions working in this repo.

## Toolchain

- **There is no package.json, no bundler, no tests, no linter, no typecheck, no CI.** Do not run `npm install`, `npm test`, `npm run lint`, or similar — there is nothing to run against.
- To preview: open `index.html` in a browser, or `npx serve .` and visit `http://localhost:3000`. There is no dev server with HMR.
- Verification is manual: load the page and play. Keyboard input requires focus on the page (not the devtools).

## Architecture

- The entire game is **one file**: `game.js`, loaded by `index.html`. No modules, no imports.
- Canvas is fixed **800×600**, hardcoded as `W`/`H` constants in `game.js` and matched by the `<canvas>` attrs in `index.html`. Change both together.
- Entry point is `initGame()` + `requestAnimationFrame(loop)` at the bottom of `game.js`.
- Entities are plain classes (`Ship`, `Asteroid`, `Bullet`, `Particle`) with `update(dt)` / `draw()`. Movement is dt-based in seconds; space is toroidal via `wrap()`.
- Game state is a single string variable `state`: `'playing' | 'dead' | 'gameover'`. The loop branches on it in `update()`.
- Input: `keys[code]` for held state, `justPressed`/`pressed(code)` for edge-detected single-frame triggers (shooting, restart). Use `pressed()` for one-shot actions, never `keys[]`.

## Conventions

- **Comments, HUD strings, and README are in Spanish.** Preserve that language when editing UI text or comments.
- File uses `'use strict';`, `const`/`let` (no `var`), and section banners like `// ── Name ──...`. Match this style.
- Asteroid sizes are indexed 1=small, 2=medium, 3=large via the `RADII`/`SPEEDS`/`POINTS` lookup arrays (index 0 unused). `split()` decrements size by 1.
- No external assets; the favicon is an inline SVG.

## Gotchas

- Don't add a build step, framework, or module system unless explicitly asked — the "no dependencies" property is a feature called out in the README.
- Editing gameplay constants (speeds, radii, cooldowns, dt clamp in `loop`) directly changes feel; tune in small increments and test in-browser.
- Ship/asteroid collision uses `a.radius * 0.82` tolerance, not raw radius — keep this in mind when adjusting hit detection.
