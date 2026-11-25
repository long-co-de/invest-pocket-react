# Invest Pocket – Dashboard (React)

Exact React conversion of `Invest_Pocket_Dashboard_1.html`.

## Run on your machine

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

## Other commands

```bash
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

## Notes
- All original CSS is preserved verbatim in `src/index.css`.
- All original behaviour is preserved in `src/App.jsx` with React state/hooks: sidebar expand/collapse (button + `[` key), dark/light theme toggle, nav selection, chart ranges (1D/1W/1M/1Y) with the same seeded generator, chart hover tooltip, Buy/Sell + Market/Limit order maths (€1 fee, Max, validation), order-placed success view, price-alert toggle, watchlist save, analyst note toggle, and toasts.
- No backend. No extra dependencies beyond React + Vite.
