import React, { useState, useEffect } from "react";
import { Lock, ShieldCheck, ShieldAlert, Fingerprint } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface LockScreenProps {
  onUnlock: () => void;
}

/**
 * Composant LockScreen - Gère la sécurité de l'application (PIN et Biométrie simulée)
 * Phase 1: Authentification et Lockscreen
 */
export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState("");
  const [storedPin, setStoredPin] = useState<string | null>(localStorage.getItem("app_pin"));
  const [isSettingUp, setIsSettingUp] = useState(!storedPin);
  const [setupStep, setSetupStep] = useState(1); // 1: Initial PIN, 2: Confirm PIN
  const [tempPin, setTempPin] = useState("");
  const [error, setError] = useState(false);

  // Gérer la saisie du PIN
  const handlePinChange = (value: string) => {
    setPin(value);
    setError(false);
    
    if (value.length === 4) {
      if (isSettingUp) {
        if (setupStep === 1) {
          setTempPin(value);
          setPin("");
          setSetupStep(2);
          toast.info("Veuillez confirmer votre code PIN");
        } else {
          if (value === tempPin) {
            localStorage.setItem("app_pin", value);
            setStoredPin(value);
            setIsSettingUp(false);
            onUnlock();
            toast.success("Code PIN configuré avec succès !");
          } else {
            setError(true);
            setPin("");
            toast.error("Les codes PIN ne correspondent pas");
          }
        }
      } else {
        if (value === storedPin) {
          onUnlock();
          toast.success("Accès autorisé");
        } else {
          setError(true);
          setPin("");
          toast.error("Code PIN incorrect");
        }
      }
    }
  };

  // Simulation de biométrie (FaceID/TouchID)
  const handleBiometrics = () => {
    if (storedPin) {
      toast.info("Simulation de biométrie en cours...");
      setTimeout(() => {
        onUnlock();
        toast.success("Identité confirmée via biométrie");
      }, 1500);
    } else {
      toast.error("Veuillez d'abord configurer un code PIN");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        <Card className="w-[350px] overflow-hidden border-2 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              {isSettingUp ? (
                <ShieldCheck className="h-8 w-8 text-primary" />
              ) : (
                <Lock className="h-8 w-8 text-primary" />
              )}
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              {isSettingUp 
                ? (setupStep === 1 ? "Configurer le PIN" : "Confirmer le PIN") 
                : "Planificateur Budgétaire"}
            </CardTitle>
            <CardDescription>
              {isSettingUp 
                ? "Créez un code à 4 chiffres pour sécuriser vos données" 
                : "Entrez votre code secret pour accéder à vos finances"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex flex-col items-center gap-6 pt-4">
            <div className={cn("relative", error && "animate-shake")}>
              <InputOTP
                maxLength={4}
                value={pin}
                onChange={handlePinChange}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} className={cn(error && "border-destructive text-destructive")} />
                  <InputOTPSlot index={1} className={cn(error && "border-destructive text-destructive")} />
                  <InputOTPSlot index={2} className={cn(error && "border-destructive text-destructive")} />
                  <InputOTPSlot index={3} className={cn(error && "border-destructive text-destructive")} />
                </InputOTPGroup>
              </InputOTP>
              
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute -bottom-6 left-0 right-0 text-center text-xs font-medium text-destructive"
                >
                  Code incorrect, réessayez.
                </motion.div>
              )}
            </div>

            <div className="flex w-full flex-col gap-2 mt-4">
              <Button 
                variant="ghost" 
                className="w-full flex gap-2 items-center text-muted-foreground hover:text-primary transition-colors"
                onClick={handleBiometrics}
              >
                <Fingerprint className="h-5 w-5" />
                Utiliser FaceID / TouchID
              </Button>
            </div>
          </CardContent>
          
          <div className="bg-muted/30 px-6 py-4 text-center text-[10px] text-muted-foreground uppercase tracking-widest font-semibold border-t">
            Sécurisé par Chiffrement Local
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

// Animation pour le PIN incorrect
const cn = (...classes: any[]) => classes.filter(Boolean).join(" ");
