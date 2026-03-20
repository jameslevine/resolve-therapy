import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: () => boolean;
}

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && getSystemDark());
  document.documentElement.classList.toggle("dark", dark);
}

const stored = (localStorage.getItem("theme") as Theme) || "system";
applyTheme(stored);

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: stored,
  setTheme: (theme: Theme) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
    set({ theme });
  },
  isDark: () => {
    const { theme } = get();
    return theme === "dark" || (theme === "system" && getSystemDark());
  },
}));

// Listen for system theme changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  const { theme } = useThemeStore.getState();
  if (theme === "system") applyTheme("system");
});
