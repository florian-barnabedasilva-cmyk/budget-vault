import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useBudget, Transaction, TransactionType, RecurrenceInterval } from "@/hooks/use-budget";
import { toast } from "sonner";
import { AlertTriangle, Camera, FileText, Loader2, Sparkles, Upload } from "lucide-react";
import { analyzeReceipt } from "@/services/receipt-analyzer";
import type { AITransactionResult } from "@/types/ai";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultLabel?: string;
  defaultCategory?: string;
}

export function TransactionModal({ isOpen, onClose, editingTransaction, defaultType, defaultLabel, defaultCategory }: TransactionModalProps) {
  const { addTransaction, updateTransaction, categories } = useBudget();
  
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [aiResult, setAiResult] = useState<AITransactionResult | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    label: "",
    amount: "",
    type: "expense" as TransactionType,
    category: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurrenceInterval: "monthly" as RecurrenceInterval
  });

  useEffect(() => {
    if (!isOpen) {
      setAiResult(null);
      setIsAnalyzingReceipt(false);
    }
    if (editingTransaction) {
      setFormData({
        label: editingTransaction.label,
        amount: editingTransaction.amount.toString(),
        type: editingTransaction.type,
        category: editingTransaction.category,
        date: editingTransaction.date,
        isRecurring: editingTransaction.isRecurring,
        recurrenceInterval: editingTransaction.recurrenceInterval
      });
    } else {
      setFormData({
        label: defaultLabel || "",
        amount: "",
        type: defaultType || "expense",
        category: defaultCategory || (categories.length > 0 ? categories[0].name : ""),
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        recurrenceInterval: "monthly"
      });
    }
  }, [editingTransaction, isOpen, categories, defaultType, defaultLabel, defaultCategory]);

  const handleReceiptFile = async (file?: File) => {
    if (!file || editingTransaction) return;

    setIsAnalyzingReceipt(true);
    setAiResult(null);
    try {
      const result = await analyzeReceipt(file, categories);
      setAiResult(result);
      setFormData(prev => ({
        ...prev,
        type: result.type,
        amount: result.amount > 0 ? String(result.amount) : "",
        label: result.label,
        category: categories.some(c => c.name === result.category) ? result.category : prev.category,
        date: result.date
      }));
      toast.success("Justificatif analysé", { description: "Les champs de la transaction ont été préremplis. Vérifiez-les avant d'enregistrer." });
    } catch (error) {
      toast.error("Analyse impossible", { description: error instanceof Error ? error.message : "Une erreur inattendue est survenue." });
    } finally {
      setIsAnalyzingReceipt(false);
      if (importInputRef.current) importInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }

    const payload = {
      ...formData,
      amount: amountNum,
      recurrenceInterval: formData.isRecurring ? formData.recurrenceInterval : "none" as RecurrenceInterval
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
      toast.success("Transaction mise à jour");
    } else {
      addTransaction(payload);
      toast.success("Transaction ajoutée");
    }
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingTransaction ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
        </DialogHeader>

        {!editingTransaction && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Scanner avec l’IA</p>
                <p className="text-xs text-muted-foreground">Analyse un ticket, une facture, une capture ou un PDF et remplit les 5 champs.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzingReceipt} onClick={() => importInputRef.current?.click()} className="gap-2 bg-background">
                <Upload className="h-4 w-4" /> Importer
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={isAnalyzingReceipt} onClick={() => cameraInputRef.current?.click()} className="gap-2 bg-background">
                <Camera className="h-4 w-4" /> Photo
              </Button>
            </div>
            <input ref={importInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" className="hidden" onChange={e => handleReceiptFile(e.target.files?.[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => handleReceiptFile(e.target.files?.[0])} />
            {isAnalyzingReceipt && (
              <div className="flex items-center gap-2 text-xs text-primary" aria-live="polite">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Analyse du document…
              </div>
            )}
            {aiResult && !isAnalyzingReceipt && (
              <div className="rounded-lg border bg-background/80 p-2.5 text-xs space-y-1">
                <div className="flex items-center gap-2 font-medium"><FileText className="h-3.5 w-3.5 text-primary" /> Résultat IA appliqué au formulaire</div>
                {aiResult.needsReview && (
                  <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 pt-1">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>Une ou plusieurs informations sont incertaines. Vérifiez les champs avant d’enregistrer.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: TransactionType) => setFormData(prev => ({ ...prev, type: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Revenu</SelectItem>
                  <SelectItem value="expense">Dépense</SelectItem>
                  <SelectItem value="savings">Épargne</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Montant</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="label">Libellé</Label>
            <Input
              id="label"
              placeholder="Ex: Salaire Mars, Loyer, Courses..."
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select 
                value={formData.category} 
                onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-2 border rounded-md">
            <div className="space-y-0.5">
              <Label className="text-base">Récurrent</Label>
              <p className="text-sm text-muted-foreground">Répéter cette transaction</p>
            </div>
            <Switch
              checked={formData.isRecurring}
              onCheckedChange={(val) => setFormData(prev => ({ ...prev, isRecurring: val }))}
            />
          </div>

          {formData.isRecurring && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <Label htmlFor="recurrence">Périodicité</Label>
              <Select 
                value={formData.recurrenceInterval} 
                onValueChange={(val: RecurrenceInterval) => setFormData(prev => ({ ...prev, recurrenceInterval: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Périodicité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Hebdomadaire</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Annuler</Button>
            <Button type="submit">{editingTransaction ? "Enregistrer" : "Ajouter"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
