const express = require("express");
const os = require("os");
const path = require("path");
const fs = require("fs").promises;
const esbuild = require("esbuild");
const svgrPlugin = require("esbuild-plugin-svgr");
const svgr = typeof svgrPlugin === "function" ? svgrPlugin : svgrPlugin.default;
const { postcssModules, sassPlugin } = require("esbuild-sass-plugin");

class Server {
  constructor({ port = 4000, host = "0.0.0.0", api = "" } = {}) {
    this.app = express();
    this.port = port;
    this.host = host;
    this.api = api;
    this.rootDir = path.join(__dirname, "..", "..");
    this.publicDir = path.join(this.rootDir, "public");
    this.componentsDir = path.join(this.publicDir, "components");
    this.mocksDir = path.join(this.publicDir, "__mocks__");
    this.appsDir = path.join(this.publicDir, "apps");
    this.esbuildClients = new Set();
  }

  escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => {
      switch (ch) {
        case "&":
          return "&amp;";
        case "<":
          return "&lt;";
        case ">":
          return "&gt;";
        case '"':
          return "&quot;";
        case "'":
          return "&#39;";
        default:
          return ch;
      }
    });
  }

  async scanDirectoryForHtml(dirPath, basePath = "") {
    const results = [];

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.join(basePath, entry.name).replace(/\\/g, "/");

        if (entry.isDirectory()) {
          const nested = await this.scanDirectoryForHtml(fullPath, relativePath);
          results.push(...nested);
          continue;
        }

        if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
          results.push({
            name: entry.name.replace(/\.html$/i, ""),
            relativePath,
          });
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not scan ${dirPath}:`, error.message);
    }

    return results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  buildSidebarItems(entries, urlPrefix) {
    if (!entries.length) {
      return `<li class="sidebar-empty">No pages found.</li>`;
    }

    return entries
      .map(({ name, relativePath }) => {
        const href = `${urlPrefix}/${relativePath}`.replace(/\/{2,}/g, "/");
        const label = relativePath.replace(/\.html$/i, "");
        return `<li class="sidebar-item"><a href="#" class="sidebar-link" data-preview-url="${this.escapeHtml(
          href,
        )}" data-preview-name="${this.escapeHtml(label)}">${this.escapeHtml(label)}</a></li>`;
      })
      .join("");
  }

  renderIndexHtml({ components, mocks }) {
    const componentItems = this.buildSidebarItems(components, "/components");
    const mockItems = this.buildSidebarItems(mocks, "/__mocks__");
    const year = new Date().getFullYear();

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AdobeXP Asset Picker</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
    <link rel="stylesheet" href="/framework/dev-shell.css" />
    <script defer src="/framework/dev-shell.js"></script>
  </head>
  <body data-theme="light">
    <div class="shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <a class="sidebar-brand-logo" href="/" aria-label="AdobeXP">
            <img
              id="framework-brand-logo"
              src="/images/AdobeXPLogo/AdobeXPLogoMinified-LIGHT.png"
              data-logo-light="/images/AdobeXPLogo/AdobeXPLogoMinified-LIGHT.png"
              data-logo-dark="/images/AdobeXPLogo/AdobeXPLogoMinified-DARK.png"
              alt="AdobeXP"
            />
          </a>
        </div>
        <div class="sidebar-nav">
          <details open>
            <summary>Components</summary>
            <ul class="sidebar-list">${componentItems}</ul>
          </details>
          <details open>
            <summary>Mock Pages</summary>
            <ul class="sidebar-list">${mockItems}</ul>
          </details>
          <details open>
            <summary>Apps</summary>
            <ul class="sidebar-list">
              <li class="sidebar-item">
                <a
                  href="#"
                  class="sidebar-link"
                  data-preview-url="/apps/asset-portal.html"
                  data-preview-name="Asset Portal"
                >Asset Portal</a>
              </li>
            </ul>
          </details>
        </div>
        <div class="sidebar-footer">&copy; ${year} | AdobeXP Asset Picker</div>
      </aside>
      <div class="sidebar-resizer" id="sidebar-resizer" aria-hidden="true"></div>
      <div class="shell-content">
        <header>
          <div class="header-left">
            <div class="preview-title" id="component-preview-title">Preview</div>
          </div>
          <div class="header-right">
            <a
              id="component-preview-open-new"
              class="preview-icon-btn"
              href="#"
              target="_blank"
              rel="noopener"
              title="Open in new tab"
              aria-label="Open in new tab"
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M14 3h7v7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 14L21 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M21 14v6a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </a>
            <div class="viewport-buttons" role="group" aria-label="Preview viewport">
              <button type="button" class="viewport-btn" data-viewport="mobile-portrait" title="Mobile (Portrait)" aria-label="Mobile (Portrait)">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="8" y="3" width="8" height="18" rx="2" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="viewport-btn" data-viewport="mobile-landscape" title="Mobile (Landscape)" aria-label="Mobile (Landscape)">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="2" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="viewport-btn" data-viewport="tablet-portrait" title="Tablet (Portrait)" aria-label="Tablet (Portrait)">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="6" y="2" width="12" height="20" rx="2" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="viewport-btn" data-viewport="tablet-landscape" title="Tablet (Landscape)" aria-label="Tablet (Landscape)">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" stroke-width="2"/></svg>
              </button>
              <button type="button" class="viewport-btn active" data-viewport="desktop" title="Desktop" aria-label="Desktop">
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="5" width="18" height="12" rx="2" stroke="currentColor" stroke-width="2"/><path d="M8 21h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
              </button>
            </div>
            <div class="header-controls">
              <label class="header-theme-label" for="framework-theme-select">Theme version</label>
              <select id="framework-theme-select" class="header-theme-select" aria-label="Theme version">
                <option value="light" selected>light</option>
                <option value="dark">dark</option>
              </select>
            </div>
          </div>
        </header>
        <main class="main-panel">
          <section class="preview-section">
            <div class="preview-frame-wrap">
              <div class="preview-viewport is-desktop" id="component-preview-viewport">
                <iframe id="component-preview-iframe" class="preview-iframe" title="Component preview"></iframe>
              </div>
              <div class="preview-placeholder" id="component-preview-placeholder">
                Pick any item from the left sidebar to load it here.
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  </body>
</html>`;
  }

  setupRoutes() {
    this.app.get("/esbuild", (req, res) => {
      res.set({
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      res.flushHeaders?.();
      res.write("\n");
      this.esbuildClients.add(res);
      req.on("close", () => this.esbuildClients.delete(res));
    });

    this.app.get(["/", "/index.html"], async (_req, res) => {
      try {
        const [components, mocks] = await Promise.all([
          this.scanDirectoryForHtml(this.componentsDir),
          this.scanDirectoryForHtml(this.mocksDir),
        ]);
        res.type("html").send(this.renderIndexHtml({ components, mocks }));
      } catch (error) {
        console.error("Error generating index page:", error);
        res.status(500).send("Failed to load index page.");
      }
    });

    this.app.use(express.static(this.publicDir));
  }

  notifyEsbuildClients() {
    for (const client of this.esbuildClients) {
      client.write("event: change\ndata: {}\n\n");
    }
  }

  getNetworkAddresses() {
    const addresses = [];
    for (const iface of Object.values(os.networkInterfaces())) {
      for (const config of iface || []) {
        const isIPv4 = config.family === "IPv4" || config.family === 4;
        if (isIPv4 && !config.internal) addresses.push(config.address);
      }
    }
    return addresses;
  }

  async buildFrameworkAssets() {
    const frameworkOutDir = path.join(this.publicDir, "framework");
    await fs.mkdir(frameworkOutDir, { recursive: true });

    const cssSource = path.join(__dirname, "scss", "dev-shell.scss");
    const cssTarget = path.join(frameworkOutDir, "dev-shell.css");
    await fs.copyFile(cssSource, cssTarget);

    await esbuild.build({
      entryPoints: [path.join(__dirname, "ts", "dev-shell.ts")],
      outfile: path.join(frameworkOutDir, "dev-shell.js"),
      bundle: true,
      format: "iife",
      platform: "browser",
      logLevel: "silent",
    });
  }

  async startEsbuildWatch() {
    console.log(`[watch] building design-system with API=${JSON.stringify(this.api || "")}`);
    const ctx = await esbuild.context({
      entryPoints: [path.join(this.rootDir, "src", "index.tsx")],
      outdir: path.join(this.publicDir, "static"),
      bundle: true,
      platform: "browser",
      metafile: true,
      format: "esm",
      // Keep a single entry file (same as production clientlib build). Code-splitting
      // left stale production bundles in public/static and blanked Mock Pages.
      splitting: false,
      loader: {
        ".tsx": "tsx",
        ".svg": "text",
        ".png": "binary",
        ".woff": "dataurl",
        ".woff2": "dataurl",
        ".eot": "dataurl",
        ".ttf": "dataurl",
      },
      define: {
        "process.env.NODE_ENV": "'development'",
        "process.env.API": JSON.stringify(this.api),
      },
      sourcemap: true,
      plugins: [
        sassPlugin({
          filter: /\.module\.scss$/,
          transform: postcssModules({}),
        }),
        sassPlugin({
          filter: /\.scss$/,
        }),
        svgr(),
        {
          name: "notify-reload",
          setup: (build) => {
            build.onEnd((result) => {
              if (result.errors?.length) return;
              this.notifyEsbuildClients();
            });
          },
        },
      ],
      logLevel: "info",
    });

    await ctx.watch();
    this.esbuildContext = ctx;
  }

  async start() {
    await this.buildFrameworkAssets();
    await this.startEsbuildWatch();
    this.setupRoutes();

    await new Promise((resolve) => {
      this.app.listen(this.port, this.host, resolve);
    });

    console.log(`Local:   http://127.0.0.1:${this.port}/`);
    if (this.host === "0.0.0.0") {
      for (const address of this.getNetworkAddresses()) {
        console.log(`Network: http://${address}:${this.port}/`);
      }
    }
    console.log("[watch] design-system framework ready");
  }
}

module.exports = Server;
