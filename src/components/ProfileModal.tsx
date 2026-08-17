import React, { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, User, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (name: string, avatar: string) => void;
  currentName: string;
  currentAvatar: string;
}

/**
 * Composant ProfileModal - Gère l'identité numérique et le recadrage d'image
 * Phase 2: Gestion du Profil & Composant de Recadrage (Clipper)
 */
export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, 
  onClose, 
  onUpdate, 
  currentName, 
  currentAvatar 
}) => {
  const [name, setName] = useState(currentName);
  const [avatar, setAvatar] = useState(currentAvatar);
  const [isCropping, setIsCropping] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Gérer la sélection de l'image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image est trop lourde (max 2MB)");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const src = event.target?.result as string;
        setPreviewSrc(src);
        setIsCropping(true);
        
        // Charger l'image pour le canvas
        const img = new Image();
        img.onload = () => {
          imgRef.current = img;
          processImage(img);
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Moteur de recadrage intelligent (Clipper)
   * Extrait la zone centrale pour un carré parfait de 150x150px
   */
  const processImage = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 150;
    canvas.width = size;
    canvas.height = size;

    // Calculer les dimensions pour le recadrage central (Center Crop)
    const minDim = Math.min(img.width, img.height);
    const sx = (img.width - minDim) / 2;
    const sy = (img.height - minDim) / 2;

    // Dessiner sur le canvas
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

    // Sauvegarder le résultat en base64
    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setAvatar(croppedDataUrl);
    setIsCropping(false);
    toast.success("Photo de profil mise à jour et recadrée !");
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Le nom ne peut pas être vide");
      return;
    }
    onUpdate(name, avatar);
    onClose();
    toast.success("Profil mis à jour");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Mon Profil
          </DialogTitle>
          <DialogDescription>
            Personnalisez votre identité numérique pour votre planificateur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                <AvatarImage src={avatar} alt={name} className="object-cover" />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"
                title="Changer la photo"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Nom d'utilisateur</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Votre nom ou pseudo"
              className="focus-visible:ring-primary"
            />
          </div>
        </div>

        {/* Canvas caché pour le traitement d'image */}
        <canvas ref={canvasRef} className="hidden" />

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex gap-2">
            <X className="h-4 w-4" />
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex gap-2">
            <Check className="h-4 w-4" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
