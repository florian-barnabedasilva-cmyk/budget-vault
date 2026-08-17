import React, { createContext, useContext, useEffect, useState } from "react";

interface ThemeColors {
  primary: string;
  accent: string;
}

interface ThemeContextType {
  theme: "light" | "dark";
  colors: ThemeColors;
  setTheme: (theme: "light" | "dark") => void;
  setColors: (colors: ThemeColors) => void;
  resetTheme: () => void;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: "#2563eb", // Blue default
  accent: "#ea580c",  // Orange default
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Provider pour le Moteur de Design Polymorphe
 * Phase 3: Modes Sombre/Clair & Thèmes CSS Dynamiques
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("app_theme") as "light" | "dark") || "light";
  });

  const [colors, setColorsState] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem("app_theme_colors");
    return saved ? JSON.parse(saved) : DEFAULT_COLORS;
  });

  // Appliquer le mode sombre/clair
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("app_theme", theme);
  }, [theme]);

  // Appliquer les couleurs personnalisées via variables CSS
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Injection dynamique des variables CSS
    root.style.setProperty("--primary", colors.primary);
    root.style.setProperty("--accent", colors.accent);
    
    // On met à jour aussi les variantes oklch si nécessaire, 
    // mais ici on surcharge directement les variables utilisées par Tailwind
    localStorage.setItem("app_theme_colors", JSON.stringify(colors));
  }, [colors]);

  const setTheme = (t: "light" | "dark") => setThemeState(t);
  const setColors = (c: ThemeColors) => setColorsState(c);
  const resetTheme = () => {
    setThemeState("light");
    setColorsState(DEFAULT_COLORS);
  };

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, setColors, resetTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useAppTheme must be used within ThemeProvider");
  return context;
};
