# Garden of Fortune

Garden of Fortune is a premium botanical slot-style browser game for GitHub Pages. It is themed as a cozy nocturne conservatory cabinet: emerald lacquer, brass trim, lantern glow, ivy, clover, rose, crown, keys, dew gems, and soft magical fortune.

This is a fictional browser game only. It uses in-game credits for the current session. There is no real money in, no money out, no donations, and no gambling or cash-out framing.

## Play Loop

- Wake the cabinet from the attract-style landing screen.
- Spend fictional session credits on each turn.
- Watch three reel columns spin and land on the highlighted Lantern Line.
- Win fictional credits from pairs, trios, rare glimmers, and special botanical patterns.
- Review symbol payouts and pattern rewards in the paytable modal.
- Adjust motion speed, toggle soft Web Audio cues, and reset the session when desired.

## Run Locally

Use any simple static server from the project folder.

```powershell
python -m http.server 8080
```

Or with Node:

```powershell
npx serve .
```

Then open `http://localhost:8080`, or the port reported by your server.

## Deploy To GitHub Pages

This project is a static site and can be hosted directly by GitHub Pages.

1. Push the repository to GitHub.
2. In repository settings, open `Pages`.
3. Set the source to `GitHub Actions`.
4. The workflow at `.github/workflows/deploy-pages.yml` deploys the site on pushes to `main`.

The root `.nojekyll` file is included so GitHub Pages serves the static files without Jekyll processing.

## Architecture

- `index.html`: semantic game shell, attract screen, reel mount points, controls, readouts, and paytable modal.
- `styles.css`: botanical scene, cabinet frame, reel window, responsive layout, modal styling, and motion polish.
- `main.js`: small bootstrap that starts the app.
- `src/ui/shell.js`: UI orchestration, session state, spin flow, readouts, modal behavior, and DOM rendering.
- `src/engine/reels.js`: reel strips, weighted symbol selection, stop planning, visible windows, and positioning math.
- `src/engine/animation.js`: reel stop timing, landing bounce, sparks, and speed presets.
- `src/engine/audio.js`: optional Web Audio tones for spin, reel stop, and win feedback.
- `src/config/symbols.js`: symbol table, weights, tiers, payout values, glow colors, and asset paths.
- `src/config/paytable.js`: fictional credit rules, special patterns, and center-line evaluation.
- `src/config/theme.js`: theme copy, notices, and animation speed config.
- `assets/symbols/`: handcrafted SVG medallion symbols.
- `assets/textures/`: reel and material texture overlays.

## Theming And Reskinning

Most reskin work should happen in config and assets before touching engine logic.

### Symbols

Edit `src/config/symbols.js` to add or tune symbols:

- `id`: stable symbol key used by payouts.
- `name`: player-facing label.
- `tier`: category such as `garden`, `rare`, or `crown`.
- `weight`: relative chance to appear on the center line.
- `payout3` and `payout2`: fictional credit rewards.
- `glow`: CSS color used for symbol landing effects.
- `assetPath`: SVG or image path.
- `note`: short paytable/design note.

Add matching images under `assets/symbols/`. The current cards are designed around square medallion art.

### Payouts

Edit `src/config/paytable.js` for:

- starting fictional credits
- cost per turn
- center-line evaluation rules
- special pattern definitions
- pair, trio, and glimmer behavior

The game currently uses one highlighted center line to keep the experience readable and non-casino-like.

### Motion And Sound

Edit `src/config/theme.js` for speed presets, or `src/engine/animation.js` for reel timing behavior. Optional sound is generated in `src/engine/audio.js` with lightweight Web Audio tones, so there are no required audio assets.

### Visual Theme

Use the CSS custom properties at the top of `styles.css` for palette changes. Cabinet materials, reel framing, symbol cards, modal styling, and responsive behavior all live in that file.

## Design Notes

Garden of Fortune intentionally avoids real-money language and mechanics. The tone is ornamental and ceremonial: a premium botanical toy cabinet with fictional credits, clear feedback, and a polished reel interaction.

