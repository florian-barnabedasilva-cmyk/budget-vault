import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBudget, Category } from "@/hooks/use-budget";
import { Plus, Trash2, Edit2, Check, X, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  const { categories, addCategory, deleteCategory, updateCategory } = useBudget();
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#3b82f6");
  const [newIsFixed, setNewIsFixed] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIsFixed, setEditIsFixed] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatColor, newIsFixed);
    setNewCatName("");
    setNewIsFixed(false);
    toast.success("Catégorie ajoutée");
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIsFixed(cat.isFixedCharge || false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: string) => {
    if (!editName.trim()) return;
    updateCategory(id, editName.trim(), editColor, editIsFixed);
    setEditingId(null);
    toast.success("Catégorie mise à jour");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gérer les Catégories</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleAdd} className="space-y-4 py-4">
          <div className="flex gap-2">
            <div className="flex-1 space-y-1">
              <Input 
                placeholder="Nouvelle catégorie" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
            </div>
            <Input 
              type="color" 
              className="w-12 h-10 p-1 rounded-md" 
              value={newCatColor}
              onChange={(e) => setNewCatColor(e.target.value)}
            />
            <Button type="submit" size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <Label className="text-sm">Charge Fixe</Label>
            </div>
            <Switch checked={newIsFixed} onCheckedChange={setNewIsFixed} />
          </div>
        </form>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          <TooltipProvider>
            {categories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-2 p-3 border rounded-md group hover:border-primary/50 transition-colors">
                {editingId === cat.id ? (
                  <div className="space-y-3">
                    <div className="flex gap-2 items-center">
                      <Input 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 flex-1"
                      />
                      <Input 
                        type="color" 
                        className="w-8 h-8 p-1 rounded-md" 
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Charge Fixe</Label>
                        <Switch checked={editIsFixed} onCheckedChange={setEditIsFixed} />
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => saveEdit(cat.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={cancelEdit}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{cat.name}</span>
                        {cat.isFixedCharge && (
                          <span className="text-[10px] text-primary flex items-center gap-1">
                            <ShieldAlert className="h-2 w-2" /> Charge Fixe
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => startEdit(cat)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TooltipProvider>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
