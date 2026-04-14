# Garden of Fortune

Garden of Fortune is a static browser prototype for a luxurious botanical reel cabinet: dark emerald woods, warm brass trim, lantern glow, and a gentle fortune-machine mood instead of tacky casino energy.

## Run locally

Use any simple static server from the project folder.

Examples:

```powershell
python -m http.server 8080
```

Or with Node if you prefer:

```powershell
npx serve .
```

Then open `http://localhost:8080` or the port reported by your server.

## Deploy to GitHub Pages

Because this prototype uses plain `index.html`, `styles.css`, and `main.js`, it can be hosted directly as a static site.

1. Push the repository to GitHub.
2. In the repository settings, open `Pages`.
3. Set the source to deploy from your main branch root, or `/docs` if you later choose to move the files there.
4. Save, then wait for the Pages build to publish.

## Architecture

- `index.html`: cabinet layout, decorative structure, status readouts, and reel mounting points.
- `styles.css`: palette variables, cabinet materials, atmosphere, responsiveness, and all motion styling.
- `main.js`: symbol data, reel construction, weighted outcome logic, spin animation, radiance meter, and win feedback.

## Tuning guide

### Tweak visuals

- Adjust palette, trim, glow, and sizing in the CSS custom properties near the top of `styles.css`.
- Cabinet depth, panel treatments, and reel framing are also centralized in `styles.css`.
- The overall mood text and UI language live in `index.html` and the result strings in `main.js`.

### Tweak reel odds and symbol weights

- Edit the `SYMBOLS` array in `main.js`.
- Each symbol has a `weight` and `payout3`.
- Higher `weight` means the symbol is more likely to appear on the center payline.

### Add real assets later

- Replace the SVG render functions in `main.js` with external image or SVG asset references.
- A clean next step would be an `assets/` folder with `symbols/`, `audio/`, and optional texture overlays.
- The current symbol-card layout is already designed to hold richer art without changing the cabinet structure.

### Add real audio later

- `main.js` already includes a sound toggle and a small state hook.
- Add Web Audio or lightweight asset playback around `handleSpin`, `animateReelStop`, and `applySpinResult`.

## Best next upgrades

1. Add handcrafted symbol SVG files and subtle reel-texture overlays.
2. Add generated or recorded wood, brass, and glass sound cues.
3. Expand win logic into multiple paylines or cabinet "blessing" patterns.
4. Add a proper title transition and start-screen sequence.
5. Add saveable cabinet progression such as a persistent Radiance or Bloom state.
