import React, { createContext, useContext, useEffect, useState, useMemo } from "react";

export type RecurrenceInterval = "none" | "weekly" | "monthly" | "quarterly" | "yearly";
export type TransactionType = "income" | "expense" | "savings";

export interface Category {
  id: string;
  name: string;
  color: string;
  isFixedCharge?: boolean;
}

export interface SavingsRule {
  id: string;
  name: string;
  percentage: number;
  sourceCategoryId: string; // usually "Salaire"
  targetCategoryId: string; // usually "Épargne"
  isActive: boolean;
}

export interface Transaction {
  id: string;
  label: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string;
  isRecurring: boolean;
  recurrenceInterval: RecurrenceInterval;
}

interface BudgetContextType {
  initialBalance: number;
  setInitialBalance: (balance: number) => void;
  transactions: Transaction[];
  addTransaction: (t: Omit<Transaction, "id">) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  categories: Category[];
  addCategory: (name: string, color: string, isFixedCharge?: boolean) => void;
  deleteCategory: (id: string) => void;
  updateCategory: (id: string, name: string, color: string, isFixedCharge?: boolean) => void;
  savingsRules: SavingsRule[];
  addSavingsRule: (rule: Omit<SavingsRule, "id">) => void;
  updateSavingsRule: (id: string, rule: Partial<SavingsRule>) => void;
  deleteSavingsRule: (id: string) => void;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  isInitialized: boolean;
}

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Salaire", color: "#10b981", isFixedCharge: false },
  { id: "2", name: "Alimentation", color: "#f59e0b", isFixedCharge: false },
  { id: "3", name: "Loyer", color: "#3b82f6", isFixedCharge: true },
  { id: "4", name: "Transport", color: "#6366f1", isFixedCharge: true },
  { id: "5", name: "Loisirs", color: "#ec4899", isFixedCharge: false },
  { id: "6", name: "Santé", color: "#ef4444", isFixedCharge: false },
  { id: "7", name: "Épargne", color: "#0ea5e9", isFixedCharge: false },
  { id: "9", name: "Crédits", color: "#f97316", isFixedCharge: true },
  { id: "8", name: "Autres", color: "#94a3b8", isFixedCharge: false },
];

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialBalance, setInitialBalanceState] = useState<number>(() => {
    const saved = localStorage.getItem("budget_initial_balance");
    return saved ? parseFloat(saved) : 0;
  });

  const [isInitialized, setIsInitialized] = useState<boolean>(() => {
    return localStorage.getItem("budget_initialized") === "true";
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("budget_transactions");
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem("budget_categories");
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [savingsRules, setSavingsRules] = useState<SavingsRule[]>(() => {
    const saved = localStorage.getItem("budget_savings_rules");
    return saved ? JSON.parse(saved) : [];
  });

  // Sauvegarde
  useEffect(() => {
    localStorage.setItem("budget_initial_balance", initialBalance.toString());
    localStorage.setItem("budget_initialized", isInitialized.toString());
    localStorage.setItem("budget_transactions", JSON.stringify(transactions));
    localStorage.setItem("budget_categories", JSON.stringify(categories));
    localStorage.setItem("budget_savings_rules", JSON.stringify(savingsRules));
  }, [initialBalance, isInitialized, transactions, categories, savingsRules]);

  const setInitialBalance = (balance: number) => {
    setInitialBalanceState(balance);
    setIsInitialized(true);
  };

  const addTransaction = (t: Omit<Transaction, "id">) => {
    const newTransactionId = crypto.randomUUID();
    const newTransaction = { ...t, id: newTransactionId };
    
    setTransactions(prev => {
      const updated = [...prev, newTransaction];
      
      // Appliquer les règles d'épargne automatique si c'est un revenu
      if (t.type === "income") {
        const sourceCat = categories.find(c => c.name === t.category);
        if (sourceCat) {
          const activeRules = savingsRules.filter(r => r.isActive && r.sourceCategoryId === sourceCat.id);
          
          activeRules.forEach(rule => {
            const targetCat = categories.find(c => c.id === rule.targetCategoryId);
            if (targetCat) {
              const savingsAmount = (t.amount * rule.percentage) / 100;
              const savingsTx: Transaction = {
                id: crypto.randomUUID(),
                label: `Auto-Épargne: ${rule.name}`,
                amount: savingsAmount,
                type: "savings",
                category: targetCat.name,
                date: t.date,
                isRecurring: false,
                recurrenceInterval: "none"
              };
              updated.push(savingsTx);
            }
          });
        }
      }
      
      return updated;
    });
  };

  const updateTransaction = (id: string, t: Partial<Transaction>) => {
    setTransactions(prev => prev.map(item => item.id === id ? { ...item, ...t } : item));
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(item => item.id !== id));
  };

  const addCategory = (name: string, color: string, isFixedCharge = false) => {
    const newCat = { id: crypto.randomUUID(), name, color, isFixedCharge };
    setCategories(prev => [...prev, newCat]);
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  const updateCategory = (id: string, name: string, color: string, isFixedCharge = false) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name, color, isFixedCharge } : c));
  };

  const addSavingsRule = (rule: Omit<SavingsRule, "id">) => {
    setSavingsRules(prev => [...prev, { ...rule, id: crypto.randomUUID() }]);
  };

  const updateSavingsRule = (id: string, rule: Partial<SavingsRule>) => {
    setSavingsRules(prev => prev.map(r => r.id === id ? { ...r, ...rule } : r));
  };

  const deleteSavingsRule = (id: string) => {
    setSavingsRules(prev => prev.filter(r => r.id !== id));
  };

  // Calculs
  const totals = useMemo(() => {
    return transactions.reduce((acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      if (t.type === "expense") acc.expenses += t.amount;
      if (t.type === "savings") acc.savings += t.amount;
      return acc;
    }, { income: 0, expenses: 0, savings: 0 });
  }, [transactions]);

  // Le solde actuel prend en compte les revenus, les dépenses ET l'épargne (considérée comme une sortie du compte courant vers un compte épargne)
  const currentBalance = initialBalance + totals.income - totals.expenses - totals.savings;

  return (
    <BudgetContext.Provider value={{ 
      initialBalance, 
      setInitialBalance, 
      transactions, 
      addTransaction, 
      updateTransaction, 
      deleteTransaction,
      categories,
      addCategory,
      deleteCategory,
      updateCategory,
      savingsRules,
      addSavingsRule,
      updateSavingsRule,
      deleteSavingsRule,
      currentBalance,
      totalIncome: totals.income,
      totalExpenses: totals.expenses,
      totalSavings: totals.savings,
      isInitialized
    }}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error("useBudget must be used within BudgetProvider");
  return context;
};
