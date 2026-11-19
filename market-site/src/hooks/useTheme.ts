import { useCallback, useSyncExternalStore } from "react";

const THEME_KEY = "ajs-theme";

export type Theme = "light" | "dark";

// The pre-paint script in index.html sets <html data-theme> from localStorage,
// so the attribute is the source of truth. One shared store keeps every header
// in sync, and the server snapshot ("light") keeps prerendered HTML hydratable.
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

function setTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    setTheme(getSnapshot() === "dark" ? "light" : "dark");
  }, []);

  return { theme, toggle };
}
