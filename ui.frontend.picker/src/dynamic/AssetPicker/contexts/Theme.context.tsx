import { createContext, FC, PropsWithChildren, useContext, useEffect, useRef, useState } from "react";

import { Theme, themes } from "../models/theme";

import { useConfiguration } from "./Configuration.context";

const ThemeContext = createContext<{ theme: Theme | null; setTheme: (theme: Theme) => void }>({
  theme: null,
  setTheme: () => {},
});

const THEME_STORAGE_KEY = "theme";
const THEME_AUTHORED_KEY = "theme.authored";

const isValidTheme = (theme: string | null): theme is Theme => {
  return themes.includes(theme as Theme);
};

/** Reads `?theme=light|dark` from the selector URL; host launch param takes priority. */
const readUrlTheme = (): Theme | null => {
  try {
    const value = new URLSearchParams(window.location.search).get("theme")?.trim().toLowerCase() ?? null;
    return isValidTheme(value) ? value : null;
  } catch {
    return null;
  }
};

export const ThemeProvider: FC<PropsWithChildren<{ theme?: Theme }>> = ({ children }) => {
  const { theme: staticTheme } = useConfiguration();
  const authoredTheme: Theme = isValidTheme(staticTheme ?? null) ? (staticTheme as Theme) : "light";
  const urlTheme = readUrlTheme();
  const userOverrideRef = useRef(false);

  const [theme, setThemeState] = useState<Theme>(() => {
    // Host iframe / modal / popup URL always governs this launch.
    if (urlTheme) {
      localStorage.setItem(THEME_AUTHORED_KEY, authoredTheme);
      localStorage.setItem(THEME_STORAGE_KEY, urlTheme);
      return urlTheme;
    }

    const authoredSnapshot = localStorage.getItem(THEME_AUTHORED_KEY);
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    // When the authored default changes (CA config / page property), drop the stale
    // user preference so the new default wins.
    if (authoredSnapshot !== authoredTheme) {
      localStorage.setItem(THEME_AUTHORED_KEY, authoredTheme);
      localStorage.setItem(THEME_STORAGE_KEY, authoredTheme);
      return authoredTheme;
    }

    if (isValidTheme(savedTheme)) {
      return savedTheme;
    }
    return authoredTheme;
  });

  const setTheme = (next: Theme) => {
    userOverrideRef.current = true;
    setThemeState(next);
  };

  // Keep in sync when the host URL or authored default changes after first paint.
  useEffect(() => {
    const fromUrl = readUrlTheme();
    if (fromUrl) {
      userOverrideRef.current = false;
      setThemeState(fromUrl);
      return;
    }

    const authoredSnapshot = localStorage.getItem(THEME_AUTHORED_KEY);
    if (authoredSnapshot !== authoredTheme) {
      localStorage.setItem(THEME_AUTHORED_KEY, authoredTheme);
      if (!userOverrideRef.current) {
        setThemeState(authoredTheme);
      }
    }
  }, [authoredTheme]);

  useEffect(() => {
    document.body.setAttribute("data-asset-browser-theme", theme);
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    const root = document.documentElement;
    root.classList.remove("theme-light", "theme-dark");
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  // Listen for cross-window theme sync from a parent shell, if any. The picker SPA is
  // self-contained and does not ship a messageBus; a plain CustomEvent is enough.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ theme?: string }>).detail;
      if (detail?.theme && isValidTheme(detail.theme)) {
        setTheme(detail.theme);
      }
    };
    window.addEventListener("assetPicker.setTheme", handler);
    return () => window.removeEventListener("assetPicker.setTheme", handler);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  return useContext(ThemeContext);
};
