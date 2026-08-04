# Local development shell (not packaged into AEM clientlibs)

This folder powers the Modular-UI-Kit–style homepage served by `npm start` on port 4000.

- `index.js` / `server.js`: Express server that scans `public/components`, `public/__mocks__`,
  and serves the homepage + static assets while watching the React clientlibs via esbuild.
- `ts/` + `scss/`: browser shell assets compiled into `public/framework/` for local use only.

`clientlib.config.js` and `esbuild-build-lib.mjs` only package `src/index.tsx` → `public/static/**`.
Nothing under `src/framework/**` or `public/framework/**` is exported by `mvn clean install`.
