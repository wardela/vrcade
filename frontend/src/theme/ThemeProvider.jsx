import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "app-theme";
const APP_THEMES = ["light", "dark"];

function normalizeTheme(value) {
  return APP_THEMES.includes(value) ? value : "light";
}

export function getStoredTheme() {
  if (typeof window === "undefined") {
    return "light";
  }

  try {
    return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
  } catch {
    return "light";
  }
}

export function applyTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  const nextTheme = normalizeTheme(theme);
  const root = document.documentElement;

  root.dataset.theme = nextTheme;
  root.classList.toggle("dark", nextTheme === "dark");
  root.style.colorScheme = nextTheme;
}

export function clearStoragePreservingTheme(storage) {
  if (!storage) {
    return;
  }

  let theme = "light";

  try {
    theme = normalizeTheme(storage.getItem(THEME_STORAGE_KEY));
    storage.clear();
    storage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore storage failures and continue without throwing.
  }
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children, initialTheme = "light" }) {
  const [theme, setThemeState] = useState(() => normalizeTheme(initialTheme));

  useEffect(() => {
    applyTheme(theme);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage failures and keep the in-memory theme state.
    }
  }, [theme]);

  const setTheme = (nextTheme) => {
    setThemeState((currentTheme) =>
      normalizeTheme(
        typeof nextTheme === "function" ? nextTheme(currentTheme) : nextTheme,
      ),
    );
  };

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      setTheme,
      toggleTheme: () =>
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
      themes: APP_THEMES,
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useAppTheme must be used inside ThemeProvider.");
  }

  return context;
}

export { APP_THEMES, THEME_STORAGE_KEY };
