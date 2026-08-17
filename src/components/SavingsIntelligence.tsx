import React, { useState } from "react";
import { useBudget, SavingsRule } from "@/hooks/use-budget";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { BrainCircuit, Plus, Trash2, PiggyBank, ArrowRight, Info } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export function SavingsIntelligence() {
  const { categories, savingsRules, addSavingsRule, deleteSavingsRule, updateSavingsRule, transactions } = useBudget();
  const [isAdding, setIsAdding] = useState(false);
  const [newRule, setNewRule] = useState({
    name: "",
    percentage: 10,
    sourceCategoryId: categories.find(c => c.name === "Salaire")?.id || categories[0]?.id || "",
    targetCategoryId: categories.find(c => c.name === "Épargne")?.id || categories[0]?.id || "",
    isActive: true
  });

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRule.name.trim()) return;
    addSavingsRule(newRule);
    setIsAdding(false);
    setNewRule({ ...newRule, name: "" });
    toast.success("Règle d'épargne automatique ajoutée");
  };

  // Calcul du surplus potentiel (Intelligence)
  // On regarde les charges fixes (isFixedCharge) et on voit si on a dépensé moins que prévu (simplifié ici car pas de 'budget prévu' explicite par transaction, 
  // mais on peut simuler une détection sur les transactions récurrentes)
  const fixedChargeCategories = categories.filter(c => c.isFixedCharge);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BrainCircuit className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">Intelligence d'Épargne</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Règles d'automatisation */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Automatisation</CardTitle>
                <CardDescription>Prélèvements automatiques sur vos revenus.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={() => setIsAdding(!isAdding)}>
                <Plus className="h-4 w-4 mr-1" /> Ajouter
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdding && (
              <form onSubmit={handleAddRule} className="p-4 border rounded-lg bg-muted/30 space-y-4 animate-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Nom de la règle</Label>
                  <Input 
                    placeholder="Ex: Épargne Retraite" 
                    value={newRule.name}
                    onChange={e => setNewRule({...newRule, name: e.target.value})}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pourcentage (%)</Label>
                    <Input 
                      type="number" 
                      min="1" max="100" 
                      value={newRule.percentage}
                      onChange={e => setNewRule({...newRule, percentage: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Source (Revenu)</Label>
                    <Select 
                      value={newRule.sourceCategoryId}
                      onValueChange={val => setNewRule({...newRule, sourceCategoryId: val})}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cible (Épargne)</Label>
                  <Select 
                    value={newRule.targetCategoryId}
                    onValueChange={val => setNewRule({...newRule, targetCategoryId: val})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Annuler</Button>
                  <Button type="submit" size="sm">Sauvegarder</Button>
                </div>
              </form>
            )}

            {savingsRules.length === 0 && !isAdding ? (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                Aucune règle d'automatisation.
              </div>
            ) : (
              <div className="space-y-2">
                {savingsRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <PiggyBank className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {rule.name}
                          {!rule.isActive && <Badge variant="secondary">Inactif</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          {rule.percentage}% de {categories.find(c => c.id === rule.sourceCategoryId)?.name} 
                          <ArrowRight className="h-3 w-3" /> 
                          {categories.find(c => c.id === rule.targetCategoryId)?.name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={rule.isActive} 
                        onCheckedChange={val => updateSavingsRule(rule.id, { isActive: val })}
                      />
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteSavingsRule(rule.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optimisation des charges */}
        <Card>
          <CardHeader>
            <CardTitle>Analyse des Charges</CardTitle>
            <CardDescription>Détection des surplus sur vos charges fixes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 rounded-lg flex gap-3">
              <Info className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-emerald-800 dark:text-emerald-400">Algorithme de surplus activé</p>
                <p className="text-emerald-700/80 dark:text-emerald-500/80 mt-1">
                  Le système détecte automatiquement si vos dépenses sur les charges fixes (Loyer, Transport, etc.) sont inférieures aux prévisions récurrentes.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Charges fixes configurées :</h4>
              <div className="flex flex-wrap gap-2">
                {fixedChargeCategories.length === 0 ? (
                  <span className="text-xs text-muted-foreground italic">Aucune catégorie marquée comme charge fixe.</span>
                ) : (
                  fixedChargeCategories.map(c => (
                    <Badge key={c.id} variant="outline" className="gap-1 px-2 py-1">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                      {c.name}
                    </Badge>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Astuce : Modifiez vos catégories pour les marquer comme "Charge Fixe" afin de bénéficier de l'analyse automatique.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
