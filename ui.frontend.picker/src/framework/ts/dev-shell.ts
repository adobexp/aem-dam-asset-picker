const VIEWPORT_PRESETS = {
  "mobile-portrait": { w: 390, h: 844 },
  "mobile-landscape": { w: 844, h: 390 },
  "tablet-portrait": { w: 768, h: 1024 },
  "tablet-landscape": { w: 1024, h: 768 },
  desktop: null,
} as const;

type ViewportMode = keyof typeof VIEWPORT_PRESETS;

function setDisplay(el: HTMLElement | null, display: string) {
  if (!el) return;
  el.style.display = display;
}

function setActive(els: NodeListOf<Element>, activeEl: Element) {
  els.forEach((node) => node.classList.remove("active"));
  activeEl.classList.add("active");
}

function themedPreviewUrl(url: string, theme: string): string {
  const withVariant = /-(light|dark)\.html(?:$|\?)/i.test(url)
    ? url.replace(/-(light|dark)\.html/i, `-${theme}.html`)
    : url;
  const separator = withVariant.includes("?") ? "&" : "?";
  // Cache-bust so same-path previews (and localStorage-driven themes) always remount.
  return `${withVariant}${separator}_dsTheme=${encodeURIComponent(theme)}`;
}

/** Keep theme keys used by the picker ThemeProvider in sync with the shell. */
function syncPreviewThemeStorage(theme: string) {
  try {
    localStorage.setItem("theme", theme);
  } catch {
    // ignore
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let currentViewport: ViewportMode = "desktop";
  let currentPreviewUrl: string | null = null;
  let currentPreviewName: string | null = null;

  const previewTitle = document.getElementById("component-preview-title");
  const previewIframe = document.getElementById("component-preview-iframe") as HTMLIFrameElement | null;
  const previewPlaceholder = document.getElementById("component-preview-placeholder");
  const previewOpenNewTab = document.getElementById("component-preview-open-new") as HTMLAnchorElement | null;
  const previewFrameWrap = document.querySelector(".preview-frame-wrap") as HTMLElement | null;
  const previewViewport = document.getElementById("component-preview-viewport") as HTMLElement | null;
  const themeSelect = document.getElementById("framework-theme-select") as HTMLSelectElement | null;
  const brandLogo = document.getElementById("framework-brand-logo") as HTMLImageElement | null;

  const THEME_KEY = "damDsFrameworkTheme";
  const getTheme = () => (themeSelect?.value === "dark" ? "dark" : "light");

  const applyBrandLogo = (theme: string) => {
    if (!brandLogo) return;
    const next =
      theme === "dark"
        ? brandLogo.dataset.logoDark || brandLogo.src
        : brandLogo.dataset.logoLight || brandLogo.src;
    brandLogo.src = next;
    document.body.setAttribute("data-theme", theme);
  };

  if (themeSelect) {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "light" || saved === "dark") themeSelect.value = saved;
    } catch {
      // ignore
    }
    const theme = getTheme();
    applyBrandLogo(theme);
    syncPreviewThemeStorage(theme);
  }

  function setPreviewUrl(url: string, title: string) {
    if (previewTitle) previewTitle.textContent = title;
    syncPreviewThemeStorage(getTheme());
    if (previewIframe) {
      // Force a full remount so React ThemeProvider re-reads localStorage + config.
      previewIframe.src = "about:blank";
      window.requestAnimationFrame(() => {
        if (previewIframe) previewIframe.src = url;
      });
    }
    if (previewPlaceholder) previewPlaceholder.style.display = "none";
    if (previewOpenNewTab) {
      previewOpenNewTab.href = url;
      setDisplay(previewOpenNewTab, "inline-flex");
    }
    window.setTimeout(applyViewportSizing, 0);
  }

  function loadUrlPreview(url: string, name: string) {
    // Keep the canonical sidebar URL (without cache-buster) so theme swaps can re-apply.
    currentPreviewUrl = url.split("?")[0];
    currentPreviewName = name.replace(/-(light|dark)$/i, "") || name;
    const theme = getTheme();
    const previewName = /-(light|dark)$/i.test(name)
      ? `${name.replace(/-(light|dark)$/i, "")}-${theme}`
      : name;
    setPreviewUrl(themedPreviewUrl(currentPreviewUrl, theme), previewName);
  }

  themeSelect?.addEventListener("change", () => {
    const theme = getTheme();
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
    applyBrandLogo(theme);
    syncPreviewThemeStorage(theme);
    if (currentPreviewUrl && currentPreviewName) {
      loadUrlPreview(currentPreviewUrl, currentPreviewName);
    }
  });

  const sidebarLinks = document.querySelectorAll(".sidebar-link");
  sidebarLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const el = link as HTMLElement;
      const url = el.getAttribute("data-preview-url") || "#";
      const name = el.getAttribute("data-preview-name") || (el.textContent || "Preview").trim();
      loadUrlPreview(url, name);
      setActive(sidebarLinks, link);
    });
  });

  const viewportButtons = document.querySelectorAll(".viewport-btn");
  viewportButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      setViewport(((btn as HTMLElement).getAttribute("data-viewport") || "desktop") as ViewportMode);
    });
  });

  try {
    const saved = localStorage.getItem("damDsFrameworkPreviewViewport") as ViewportMode | null;
    if (saved && VIEWPORT_PRESETS[saved] !== undefined) currentViewport = saved;
  } catch {
    // ignore
  }
  setViewport(currentViewport);
  window.addEventListener("resize", applyViewportSizing);

  const sidebar = document.getElementById("sidebar");
  const resizer = document.getElementById("sidebar-resizer");
  if (sidebar && resizer) {
    const KEY = "damDsFrameworkSidebarWidthPx";
    try {
      const saved = Number(localStorage.getItem(KEY));
      if (Number.isFinite(saved) && saved > 0) sidebar.style.width = `${saved}px`;
    } catch {
      // ignore
    }

    let startX = 0;
    let startWidth = 0;
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    const onMove = (ev: PointerEvent) => {
      const maxWidth = Math.floor(window.innerWidth * 0.6);
      const next = clamp(startWidth + (ev.clientX - startX), 220, maxWidth);
      sidebar.style.width = `${next}px`;
      applyViewportSizing();
    };
    const onUp = () => {
      document.body.style.cursor = "";
      try {
        localStorage.setItem(KEY, String(Math.round(sidebar.getBoundingClientRect().width)));
      } catch {
        // ignore
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    resizer.addEventListener("pointerdown", (ev) => {
      ev.preventDefault();
      startX = ev.clientX;
      startWidth = sidebar.getBoundingClientRect().width;
      document.body.style.cursor = "col-resize";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    });
  }

  function applyViewportSizing() {
    if (!previewViewport) return;
    const preset = VIEWPORT_PRESETS[currentViewport];
    if (!preset || !previewFrameWrap) {
      previewViewport.classList.add("is-desktop");
      previewViewport.style.removeProperty("--vp-w");
      previewViewport.style.removeProperty("--vp-h");
      previewViewport.style.removeProperty("--vp-scale");
      return;
    }
    previewViewport.classList.remove("is-desktop");
    previewViewport.style.setProperty("--vp-w", `${preset.w}px`);
    previewViewport.style.setProperty("--vp-h", `${preset.h}px`);

    const pad = 32;
    const availW = Math.max(1, previewFrameWrap.clientWidth - pad);
    const availH = Math.max(1, previewFrameWrap.clientHeight - pad);
    const scale = Math.min(availW / preset.w, availH / preset.h, 1);
    previewViewport.style.setProperty("--vp-scale", String(scale));
  }

  function setViewport(mode: ViewportMode) {
    currentViewport = VIEWPORT_PRESETS[mode] === undefined ? "desktop" : mode;
    viewportButtons.forEach((button) => {
      button.classList.toggle("active", (button as HTMLElement).getAttribute("data-viewport") === currentViewport);
    });
    try {
      localStorage.setItem("damDsFrameworkPreviewViewport", currentViewport);
    } catch {
      // ignore
    }
    applyViewportSizing();
  }
});
