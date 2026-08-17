import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBudget } from "@/hooks/use-budget";
import { PiggyBank } from "lucide-react";

export function SetupBalance() {
  const { isInitialized, setInitialBalance } = useBudget();
  const [balance, setBalance] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(balance);
    if (!isNaN(val)) {
      setInitialBalance(val);
    }
  };

  return (
    <Dialog open={!isInitialized}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <PiggyBank className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl font-bold">Bienvenue sur BudgetPro</DialogTitle>
          <DialogDescription className="text-center">
            Pour commencer, veuillez indiquer votre solde actuel disponible sur votre compte principal.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="balance">Solde Initial (€)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              placeholder="Ex: 1250.50"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="text-lg py-6"
              autoFocus
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="w-full text-lg py-6">
              Commencer la planification
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
