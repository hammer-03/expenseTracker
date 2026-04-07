"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Download, CalendarDays, TrendingUp, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AuthGuard } from "@/components/auth-guard";
import { ExpenseSidebar, type NavView } from "@/components/expense-sidebar";
import { ExpenseList, type Expense } from "@/components/expense-list";
import { ExpenseCharts } from "@/components/expense-charts";
import { ExpenseStats } from "@/components/expense-stats";
import { AddExpenseModal } from "@/components/add-expense-modal";
import { MobileHeader } from "@/components/mobile-header";
import { BudgetView } from "@/components/budget-view";
import { SettingsView } from "@/components/settings-view";
import { useAuth } from "@/lib/auth-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  fetchExpenses,
  createExpense as createExpenseApi,
  deleteExpense as deleteExpenseApi,
} from "@/lib/api/expenses";
import { fetchBudgetBundle } from "@/lib/api/budgets";
import type { BudgetBundle } from "@/lib/types/budget";
import {
  filterExpensesInMonth,
  sumAmount,
} from "@/lib/analytics/fromExpenses";
import { fetchGroups, fetchGroupSettlement, type Group, type Settlement, deleteGroup } from "@/lib/api/groups";
import { GroupSettlement } from "@/components/group-settlement";

const viewTitles: Record<NavView, { title: string; description: string }> = {
  overview: {
    title: "Overview",
    description: "Track and manage your expenses at a glance",
  },
  expenses: {
    title: "Expenses",
    description: "View and manage all your transactions",
  },
  analytics: {
    title: "Analytics",
    description: "Deep dive into your spending patterns",
  },
  budget: {
    title: "Budget",
    description: "Total monthly cap and optional category limits",
  },
  settings: {
    title: "Settings",
    description: "Customize your preferences",
  },
};

export default function ExpenseTracker() {
  const { user, loading: authLoading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetBundle, setBudgetBundle] = useState<BudgetBundle | null>(null);
  const [budgetsLoading, setBudgetsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeView, setActiveView] = useState<NavView>("overview");
  const [timeRange, setTimeRange] = useState("this-month");
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);

  const loadExpenses = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      // If a group is active, fetch only group expenses
      const data = activeGroupId 
        ? await (await import("@/lib/api/client")).apiFetch(`/expenses/group/${activeGroupId}`).then(res => res.json()).then(j => j.data)
        : await fetchExpenses();
      setExpenses(data);
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "Could not load expenses from the server.";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeGroupId]);

  const loadSettlement = useCallback(async () => {
    if (!activeGroupId) {
      setSettlement(null);
      return;
    }
    try {
      const data = await fetchGroupSettlement(activeGroupId);
      setSettlement(data);
    } catch (e) {
      console.error("Failed to load settlement", e);
    }
  }, [activeGroupId]);

  const loadGroups = useCallback(async () => {
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (e) {
      console.error("Failed to load groups", e);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadGroups();
    }
  }, [loadGroups, authLoading, user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadSettlement();
    }
  }, [loadSettlement, authLoading, user]);

  useEffect(() => {
    if (!authLoading && user) {
      loadExpenses();
    }
  }, [loadExpenses, authLoading, user]);

  const loadBudgets = useCallback(async () => {
    try {
      const data = await fetchBudgetBundle();
      setBudgetBundle(data);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not load budgets"
      );
    } finally {
      setBudgetsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadBudgets();
    }
  }, [loadBudgets, authLoading, user]);

  const monthlyBudgetTotal = budgetBundle?.monthlyTotal?.totalLimit ?? 0;

  const monthSpent = useMemo(
    () => sumAmount(filterExpensesInMonth(expenses, new Date())),
    [expenses]
  );

  const handleAddExpense = async (expense: Omit<Expense, "id">) => {
    try {
      const created = await createExpenseApi(expense);
      setExpenses((prev: Expense[]) => [created, ...prev]);
      await loadBudgets();
      toast.success("Expense added");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to add expense"
      );
      throw e;
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteExpenseApi(id);
      setExpenses((prev: Expense[]) => prev.filter((e: Expense) => e.id !== id));
      await loadBudgets();
      toast.success("Expense deleted");
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to delete expense"
      );
    }
  };

  const handleDeleteGroup = async () => {
    if (!activeGroupId) return;
    const group = groups.find(g => g.id === activeGroupId);
    if (!group) return;

    if (!confirm(`Are you sure you want to delete the group "${group.name}"? This will also delete all expenses in this group.`)) {
      return;
    }

    try {
      await deleteGroup(activeGroupId);
      toast.success("Group deleted");
      setActiveGroupId(null);
      loadGroups();
      loadExpenses();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete group");
    }
  };

  const currentView = viewTitles[activeView as NavView];

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-background">
      <ExpenseSidebar
        activeView={activeView}
        onViewChange={setActiveView}
        groups={groups}
        activeGroupId={activeGroupId}
        onGroupChange={setActiveGroupId}
        expenseCount={expenses.length}
        monthlyBudgetTotal={monthlyBudgetTotal}
        monthSpent={monthSpent}
        onGroupCreated={loadGroups}
      />

      <div className="flex-1 flex flex-col">
        <MobileHeader
          activeView={activeView}
          onViewChange={setActiveView}
          groups={groups}
          activeGroupId={activeGroupId}
          onGroupChange={setActiveGroupId}
          expenseCount={expenses.length}
          monthlyBudgetTotal={monthlyBudgetTotal}
          monthSpent={monthSpent}
        />

        <main className="flex-1 p-4 md:p-8">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">
                    {currentView.title}
                  </h1>
                  <Badge variant="secondary" className="text-xs">
                    <TrendingUp className="size-3 mr-1" />
                    Live
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentView.description}
                </p>
                {loadError && (
                  <p className="text-sm text-destructive mt-2">
                    {loadError}{" "}
                    <button
                      type="button"
                      className="underline font-medium"
                      onClick={() => loadExpenses()}
                    >
                      Retry
                    </button>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[150px] bg-input border-border">
                    <CalendarDays className="size-4 mr-2 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="this-week">This Week</SelectItem>
                    <SelectItem value="this-month">This Month</SelectItem>
                    <SelectItem value="last-month">Last Month</SelectItem>
                    <SelectItem value="this-year">This Year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Download className="size-4" />
                </Button>
                <Button
                  onClick={() => setModalOpen(true)}
                  className="gap-2 shrink-0"
                >
                  <Plus className="size-4" />
                  <span className="hidden sm:inline">Add Expense</span>
                </Button>
              </div>
            </div>

            {/* Overview View */}
            {activeView === "overview" && (
              <>
                {activeGroupId && settlement && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Group Balances
                      </p>
                      {groups.find(g => g.id === activeGroupId)?.createdBy === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 gap-2"
                          onClick={handleDeleteGroup}
                        >
                          <Trash2 className="size-3.5" />
                          Delete Group
                        </Button>
                      )}
                    </div>
                    <GroupSettlement members={settlement.members} />
                  </div>
                )}
                <ExpenseStats
                  expenses={expenses}
                  monthlyBudgetTotal={monthlyBudgetTotal}
                />
                <ExpenseCharts
                  expenses={expenses}
                  monthlyBudgetTotal={monthlyBudgetTotal}
                />
                {loading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    Loading expenses…
                  </div>
                ) : (
                  <ExpenseList
                    expenses={expenses}
                    onDelete={handleDeleteExpense}
                  />
                )}
              </>
            )}

            {/* Expenses View */}
            {activeView === "expenses" && (
              loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
                  <Loader2 className="size-5 animate-spin" />
                  Loading expenses…
                </div>
              ) : (
                <ExpenseList
                  expenses={expenses}
                  onDelete={handleDeleteExpense}
                />
              )
            )}

            {/* Analytics View */}
            {activeView === "analytics" && (
              <ExpenseCharts
                expenses={expenses}
                monthlyBudgetTotal={monthlyBudgetTotal}
              />
            )}

            {/* Budget View */}
            {activeView === "budget" && (
              <BudgetView
                monthlyBudget={budgetBundle?.monthlyTotal ?? null}
                categoryBudgets={budgetBundle?.categories ?? []}
                monthSpent={monthSpent}
                loading={budgetsLoading}
                onBudgetsChange={loadBudgets}
              />
            )}

            {/* Settings View */}
            {activeView === "settings" && <SettingsView />}
          </div>
        </main>
      </div>

      <AddExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        activeGroupId={activeGroupId}
        onAdd={handleAddExpense}
        onSuccess={() => {
          loadExpenses();
          loadSettlement();
        }}
      />
    </div>
    </AuthGuard>
  );
}
