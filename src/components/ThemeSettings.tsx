import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Palette, Sun, Moon, RotateCcw, Check } from "lucide-react";
import { toast } from "sonner";

interface ThemeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_THEMES = [
  { name: "Standard", primary: "#2563eb", accent: "#ea580c" },
  { name: "Papier Chaud", primary: "#92400e", accent: "#d97706" },
  { name: "Bleu Océan", primary: "#0369a1", accent: "#0ea5e9" },
  { name: "Forêt Émeraude", primary: "#065f46", accent: "#10b981" },
  { name: "Royal Purple", primary: "#6d28d9", accent: "#a855f7" },
];

/**
 * Composant ThemeSettings - Studio Graphique Personnalisé
 * Phase 3: Moteur de Design Polymorphe
 */
export const ThemeSettings: React.FC<ThemeSettingsProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme, colors, setColors, resetTheme } = useAppTheme();

  const handleColorChange = (key: "primary" | "accent", value: string) => {
    setColors({ ...colors, [key]: value });
  };

  const applyPreset = (preset: typeof PRESET_THEMES[0]) => {
    setColors({ primary: preset.primary, accent: preset.accent });
    toast.success(`Thème ${preset.name} appliqué`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Studio Graphique
          </DialogTitle>
          <DialogDescription>
            Personnalisez l'ambiance visuelle de votre planificateur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Mode Sombre / Clair */}
          <div className="space-y-3">
            <Label>Mode d'affichage</Label>
            <div className="flex gap-2">
              <Button 
                variant={theme === "light" ? "default" : "outline"} 
                className="flex-1 gap-2"
                onClick={() => setTheme("light")}
              >
                <Sun className="h-4 w-4" />
                Clair
              </Button>
              <Button 
                variant={theme === "dark" ? "default" : "outline"} 
                className="flex-1 gap-2"
                onClick={() => setTheme("dark")}
              >
                <Moon className="h-4 w-4" />
                Sombre
              </Button>
            </div>
          </div>

          {/* Sélecteurs de Couleurs */}
          <div className="space-y-4">
            <Label>Couleurs personnalisées</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Primaire</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={colors.primary}
                    onChange={(e) => handleColorChange("primary", e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-transparent"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">Accent</span>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={colors.accent}
                    onChange={(e) => handleColorChange("accent", e.target.value)}
                    className="h-10 w-full cursor-pointer rounded-md border border-input bg-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Palettes Prédéfinies */}
          <div className="space-y-3">
            <Label>Palettes suggérées</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-border shadow-sm transition-all hover:scale-110"
                  title={preset.name}
                  style={{ backgroundColor: preset.primary }}
                >
                  <div 
                    className="absolute bottom-0 right-0 h-4 w-4 rounded-full border border-white"
                    style={{ backgroundColor: preset.accent }}
                  />
                  {colors.primary === preset.primary && colors.accent === preset.accent && (
                    <Check className="h-4 w-4 text-white drop-shadow-md" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between sm:justify-between items-center w-full">
          <Button variant="ghost" size="sm" onClick={resetTheme} className="text-muted-foreground hover:text-destructive">
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <Button onClick={onClose}>
            Terminer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
