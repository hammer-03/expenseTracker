"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react"

interface MemberBalance {
  id: string
  name: string
  balance: number
}

interface GroupSettlementProps {
  members: MemberBalance[]
}

export function GroupSettlement({ members }: GroupSettlementProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => (
        <Card key={member.id} className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              {member.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-2xl font-bold ${member.balance >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                  {member.balance >= 0 ? "+" : ""}${Math.abs(member.balance).toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {member.balance >= 0 ? (
                    <>
                      <ArrowUpRight className="size-3 text-emerald-500" />
                      <span className="text-xs text-muted-foreground italic">Should receive</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownLeft className="size-3 text-rose-500" />
                      <span className="text-xs text-muted-foreground italic">Owes money</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`p-3 rounded-xl ${member.balance >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                {member.balance >= 0 ? (
                  <TrendingUp className={`size-6 ${member.balance >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                ) : (
                  <TrendingDown className={`size-6 ${member.balance >= 0 ? "text-emerald-500" : "text-rose-500"}`} />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
