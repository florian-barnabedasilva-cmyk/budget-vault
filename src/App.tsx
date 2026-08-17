import React, { useState, useEffect } from "react";
import { LockScreen } from "@/components/LockScreen";
import { ProfileModal } from "@/components/ProfileModal";
import { ThemeSettings } from "@/components/ThemeSettings";
import { Toaster } from "@/components/ui/sonner";
import { motion } from "framer-motion";
import { Wallet, LogOut, User as UserIcon, Palette, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppTheme } from "@/hooks/use-app-theme";
import { SetupBalance } from "@/components/SetupBalance";
import { Dashboard } from "@/components/Dashboard";
import { useBudget } from "@/hooks/use-budget";

/**
 * Types pour le Profil Utilisateur
 */
interface UserProfile {
  name: string;
  avatar: string;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Utilisateur",
  avatar: "",
};

/**
 * Composant Principal - Gère l'état global et le verrouillage
 */
export default function App() {
  const [isLocked, setIsLocked] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("user_profile");
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
  });

  const { theme, setTheme } = useAppTheme();
  const { isInitialized } = useBudget();

  // Sauvegarder le profil quand il change
  useEffect(() => {
    localStorage.setItem("user_profile", JSON.stringify(profile));
  }, [profile]);

  // Gérer le verrouillage automatique au retour sur l'app (App Resume)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && localStorage.getItem("app_pin")) {
        setIsLocked(true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <Toaster position="top-center" expand={false} richColors />
      
      {isLocked ? (
        <LockScreen onUnlock={() => setIsLocked(false)} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col min-h-screen"
        >
          {/* Header Principal */}
          <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-30">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="hover:scale-105 transition-transform"
                  title="Mon Profil"
                >
                  <Avatar className="h-10 w-10 border-2 border-primary/20">
                    <AvatarImage src={profile.avatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/5 text-primary">
                      <UserIcon className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                </button>
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                  <Wallet className="h-6 w-6" />
                  <span className="hidden sm:inline">BudgetPro</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground mr-2 hidden md:inline">
                  Bonjour, {profile.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  title={theme === "light" ? "Mode Sombre" : "Mode Clair"}
                >
                  {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsThemeOpen(true)}
                  title="Studio Graphique"
                >
                  <Palette className="h-5 w-5" />
                </Button>
                <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsLocked(true)}
                title="Verrouiller"
              >
                <LogOut className="h-5 w-5" />
              </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 container mx-auto px-4 py-8">
            {isInitialized ? <Dashboard /> : <SetupBalance />}
          </main>

          {/* Modal de Profil */}
          <ProfileModal 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            onUpdate={(name, avatar) => setProfile({ name, avatar })}
            currentName={profile.name}
            currentAvatar={profile.avatar}
          />

          {/* Modal de Thème */}
          <ThemeSettings 
            isOpen={isThemeOpen}
            onClose={() => setIsThemeOpen(false)}
          />
        </motion.div>
      )}
    </div>
  );
}
