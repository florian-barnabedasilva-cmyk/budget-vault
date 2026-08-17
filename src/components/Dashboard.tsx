import React, { useState } from "react";
import { useBudget, Transaction } from "@/hooks/use-budget";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpCircle, ArrowDownCircle, Wallet, Calendar, Trash2, Edit2, MoreHorizontal, Tags, PiggyBank, CheckCircle2, ChevronDown, TrendingUp, TrendingDown, Landmark } from "lucide-react";
import { TransactionModal } from "./TransactionModal";
import { CategoryModal } from "./CategoryModal";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";

export function Dashboard() {
  const { totalIncome, totalExpenses, totalSavings, deleteTransaction, categories, transactions } = useBudget();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [modalDefaults, setModalDefaults] = useState<{ type?: Transaction['type'], label?: string, category?: string }>({});
  const [currency, setCurrency] = useState("FCFA (XOF)");

  const handleEdit = (t: Transaction) => {
    setEditingTransaction(t);
    setModalDefaults({});
    setIsModalOpen(true);
  };

  const handleAdd = (type?: Transaction['type'], label?: string, category?: string) => {
    setEditingTransaction(null);
    setModalDefaults({ type, label, category });
    setIsModalOpen(true);
  };

  const getCategoryColor = (name: string) => {
    return categories.find(c => c.name === name)?.color || "#94a3b8";
  };

  // Calcul du taux d'épargne
  const savingsRate = totalIncome > 0 ? (totalSavings / totalIncome) * 100 : 0;

  // Groupement des transactions pour la vue mensuelle
  const incomeTransactions = transactions.filter(t => t.type === 'income');
  const savingsTransactions = transactions.filter(t => t.type === 'savings');
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  
  const fixedExpenses = expenseTransactions.filter(t => {
    const cat = categories.find(c => c.name === t.category);
    return cat?.isFixedCharge;
  });
  
  const variableExpenses = expenseTransactions.filter(t => {
    const cat = categories.find(c => c.name === t.category);
    return !cat?.isFixedCharge;
  });

  const formatCurrency = (amount: number) => {
    const symbol = currency.includes("FCFA") ? "FCFA" : (currency.includes("EUR") ? "€" : "$");
    return amount.toLocaleString('fr-FR') + " " + symbol;
  };

  // Calcul des données pour le graphique annuel
  const months = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
  const chartData = months.map((month, index) => {
    const monthTransactions = transactions.filter(t => {
      const date = new Date(t.date);
      return date.getMonth() === index;
    });

    const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const savings = monthTransactions.filter(t => t.type === 'savings').reduce((sum, t) => sum + t.amount, 0);

    return { month, income, expenses, savings };
  });

  const chartConfig = {
    income: {
      label: "Revenus",
      color: "#10b981",
    },
    expenses: {
      label: "Dépenses",
      color: "#f43f5e",
    },
    savings: {
      label: "Épargne",
      color: "#3b82f6",
    },
  } satisfies ChartConfig;

  const TransactionItem = ({ t }: { t: Transaction }) => (
    <div className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors group border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${
          t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 
          t.type === 'savings' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
        }`}>
          {t.type === 'income' ? <ArrowUpCircle className="h-4 w-4" /> : 
           t.type === 'savings' ? <PiggyBank className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
        </div>
        <div>
          <div className="font-medium text-sm">{t.label}</div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCategoryColor(t.category) }} />
              {t.category}
            </span>
            <span>•</span>
            <span>{new Date(t.date).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className={`font-bold text-sm ${
          t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 
          t.type === 'savings' ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'
        }`}>
          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(t)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Modifier
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => deleteTransaction(t.id)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 space-y-6">
      <TransactionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editingTransaction={editingTransaction}
        defaultType={modalDefaults.type}
        defaultLabel={modalDefaults.label}
        defaultCategory={modalDefaults.category}
      />
      
      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Dashboard Sub-Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Budget Mensuel & Annuel</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Planificateur personnel - 2026
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-medium">
              Actif
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-xs font-medium border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Sauvegardé
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-[140px] h-9 bg-card">
              <SelectValue placeholder="Devise" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="FCFA (XOF)">FCFA (XOF)</SelectItem>
              <SelectItem value="EUR (€)">EUR (€)</SelectItem>
              <SelectItem value="USD ($)">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="mensuel" className="w-full space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <TabsList className="grid grid-cols-4 w-full sm:w-auto p-1 bg-muted/50">
            <TabsTrigger value="mensuel">Mensuel</TabsTrigger>
            <TabsTrigger value="annuel">Annuel</TabsTrigger>
            <TabsTrigger value="epargne">Épargne</TabsTrigger>
            <TabsTrigger value="credits">Crédits</TabsTrigger>
          </TabsList>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsCategoryModalOpen(true)} className="gap-2 h-9 border-dashed">
              <Tags className="h-4 w-4" />
              <span>Catégories</span>
            </Button>
            <Button size="sm" onClick={() => handleAdd()} className="gap-2 h-9 shadow-lg shadow-primary/20">
              <Plus className="h-4 w-4" />
              <span>Nouveau</span>
            </Button>
          </div>
        </div>

        <TabsContent value="mensuel" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden border-border/50">
              <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-5 w-5" />
                  Revenus & Épargne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">REVENUS</h3>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalIncome)}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl overflow-hidden">
                    {incomeTransactions.length > 0 ? (
                      incomeTransactions.map(t => <TransactionItem key={t.id} t={t} />)
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">Aucun revenu enregistré</p>
                    )}
                  </div>
                </div>
                
                <Separator className="opacity-50" />

                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ÉPARGNE</h3>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{formatCurrency(totalSavings)}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl overflow-hidden">
                    {savingsTransactions.length > 0 ? (
                      savingsTransactions.map(t => <TransactionItem key={t.id} t={t} />)
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">Aucune épargne enregistrée</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden border-border/50">
              <CardHeader className="bg-rose-500/5 border-b border-rose-500/10 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-rose-700 dark:text-rose-400">
                  <TrendingDown className="h-5 w-5" />
                  Dépenses
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">FIXES (Logement, Factures...)</h3>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{formatCurrency(fixedExpenses.reduce((sum, t) => sum + t.amount, 0))}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl overflow-hidden">
                    {fixedExpenses.length > 0 ? (
                      fixedExpenses.map(t => <TransactionItem key={t.id} t={t} />)
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">Aucune dépense fixe</p>
                    )}
                  </div>
                </div>

                <Separator className="opacity-50" />

                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">VARIABLES (Vie courante...)</h3>
                    <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatCurrency(variableExpenses.reduce((sum, t) => sum + t.amount, 0))}</span>
                  </div>
                  <div className="bg-muted/30 rounded-xl overflow-hidden">
                    {variableExpenses.length > 0 ? (
                      variableExpenses.map(t => <TransactionItem key={t.id} t={t} />)
                    ) : (
                      <p className="text-xs text-muted-foreground italic p-4 text-center">Aucune dépense variable</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="annuel" className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-medium opacity-80 uppercase text-white">Revenus Annuels</CardTitle>
                  <TrendingUp className="h-4 w-4 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                <p className="text-[10px] opacity-70 mt-1 italic text-white/80">Total de l'année</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-medium opacity-80 uppercase text-white">Dépenses Annuelles</CardTitle>
                  <TrendingDown className="h-4 w-4 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                <p className="text-[10px] opacity-70 mt-1 italic text-white/80">Total de l'année</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-medium opacity-80 uppercase text-white">Économies Annuelles</CardTitle>
                  <PiggyBank className="h-4 w-4 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalSavings)}</div>
                <p className="text-[10px] opacity-70 mt-1 italic text-white/80">Total de l'année</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-gradient-to-br from-amber-500 to-amber-600 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xs font-medium opacity-80 uppercase text-white">Taux Épargne Annuel</CardTitle>
                  <Landmark className="h-4 w-4 opacity-80" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{savingsRate.toFixed(1)}%</div>
                <p className="text-[10px] opacity-70 mt-1 italic text-white/80">Moyenne de l'année</p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-card/50 backdrop-blur-sm shadow-sm border-border/50 overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Évolution Annuelle - 2026
                </CardTitle>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Revenus</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Dépenses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>Épargne</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[350px] w-full">
                <ChartContainer config={chartConfig} className="h-full w-full">
                  <AreaChart data={chartData} margin={{ left: -20, right: 10 }}>
                    <defs>
                      <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="fillSavings" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-savings)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-savings)" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tickMargin={10}
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="income"
                      stroke="var(--color-income)"
                      fill="url(#fillIncome)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expenses"
                      stroke="var(--color-expenses)"
                      fill="url(#fillExpenses)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="savings"
                      stroke="var(--color-savings)"
                      fill="url(#fillSavings)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="epargne" className="animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden border-border/50">
              <CardHeader className="bg-blue-500/5 border-b border-blue-500/10 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-blue-700 dark:text-blue-400">
                  <PiggyBank className="h-5 w-5" />
                  Mes Objectifs d'Épargne
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-muted/30 rounded-xl overflow-hidden mb-6">
                  {savingsTransactions.length > 0 ? (
                    savingsTransactions.map(t => <TransactionItem key={t.id} t={t} />)
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-xs text-muted-foreground italic">Aucune épargne enregistrée</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" className="gap-2" onClick={() => handleAdd('savings', 'Objectif: ', 'Épargne')}>
                    <Plus className="h-4 w-4" />
                    Configurer un objectif
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="credits" className="animate-in fade-in zoom-in-95 duration-300">
          <div className="grid grid-cols-1 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden border-border/50">
              <CardHeader className="bg-amber-500/5 border-b border-amber-500/10 py-4">
                <CardTitle className="text-lg flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <Landmark className="h-5 w-5" />
                  Mes Crédits & Emprunts
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-muted/30 rounded-xl overflow-hidden mb-6">
                  {expenseTransactions.filter(t => t.category === 'Crédits').length > 0 ? (
                    expenseTransactions.filter(t => t.category === 'Crédits').map(t => <TransactionItem key={t.id} t={t} />)
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                      <p className="text-xs text-muted-foreground italic">Aucun crédit enregistré</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Les crédits ajoutés ici apparaîtront aussi dans vos dépenses fixes.</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-center">
                  <Button variant="outline" className="gap-2" onClick={() => handleAdd('expense', 'Crédit: ', 'Crédits')}>
                    <Plus className="h-4 w-4" />
                    Ajouter un crédit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
