"use client"

import {
  DollarSign,
  CreditCard,
  Target,
  Wallet,
  Sparkles,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Expense } from "@/components/expense-list"
import {
  filterExpensesInMonth,
  sumAmount,
} from "@/lib/analytics/fromExpenses"
import { useAuth } from "@/lib/auth-context"

interface StatCardProps {
  title: string
  value: string
  icon: typeof DollarSign
  description?: string
  accentColor?: string
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
  accentColor = "accent",
}: StatCardProps) {
  return (
    <Card className="border-border bg-card group hover:bg-muted/30 transition-colors duration-200">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "size-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105",
              accentColor === "accent" && "bg-accent/15 text-accent",
              accentColor === "chart-1" && "bg-chart-1/15 text-chart-1",
              accentColor === "chart-2" && "bg-chart-2/15 text-chart-2",
              accentColor === "chart-4" && "bg-chart-4/15 text-chart-4"
            )}
          >
            <Icon className="size-5" />
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-bold text-card-foreground mt-1 tracking-tight">
            {value}
          </p>
          {description && (
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
              <Sparkles className="size-3" />
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function formatMoney(n: number) {
  return `$${n.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`
}

interface ExpenseStatsProps {
  expenses: Expense[]
  /** Sum of category budget limits (monthly cap). */
  monthlyBudgetTotal: number
}

export function ExpenseStats({
  expenses,
  monthlyBudgetTotal,
}: ExpenseStatsProps) {
  const { user: currentUser } = useAuth()
  const totalAll = sumAmount(expenses)
  const now = new Date()
  const thisMonth = filterExpensesInMonth(expenses, now)
  const totalThisMonth = sumAmount(thisMonth)

  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 15)
  const lastMonth = filterExpensesInMonth(expenses, prev)
  const totalLastMonth = sumAmount(lastMonth)

  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate()
  const dayOfMonth = now.getDate()
  const dailyAvg =
    dayOfMonth > 0 ? totalThisMonth / dayOfMonth : 0

  const budgetLeft = Math.max(0, monthlyBudgetTotal - totalThisMonth)

  // Calculate Splitwise-specific stats
  let youAreOwed = 0
  let youOwe = 0

  expenses.forEach(expense => {
    if (!expense.splitBetween || expense.splitBetween.length <= 1) return
    
    const myShare = expense.splitBetween.find(s => s.user === currentUser?.id)?.share || 0
    if (expense.paidBy?.id === currentUser?.id) {
        // You paid, others owe you the rest
        youAreOwed += (expense.amount - myShare)
    } else {
        // Someone else paid, you owe them your share
        youOwe += myShare
    }
  })

  const netBalance = youAreOwed - youOwe

  const stats: StatCardProps[] = [
    {
      title: "Net Balance",
      value: formatMoney(netBalance),
      icon: DollarSign,
      description: netBalance >= 0 ? "You are owed overall" : "You owe overall",
      accentColor: netBalance >= 0 ? "accent" : "chart-1",
    },
    {
      title: "You are owed",
      value: formatMoney(youAreOwed),
      icon: Sparkles,
      description: "Amount to receive",
      accentColor: "chart-2",
    },
    {
      title: "You owe",
      value: formatMoney(youOwe),
      icon: CreditCard,
      description: "Amount to pay back",
      accentColor: "chart-1",
    },
    {
      title: "Total Spent (Share)",
      value: formatMoney(totalAll),
      icon: Wallet,
      description: "Your cumulative share",
      accentColor: "chart-4",
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.title} {...stat} />
      ))}
    </div>
  )
}
