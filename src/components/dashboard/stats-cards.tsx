"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, TrendingUp, Zap } from "lucide-react";

interface StatsCardsProps {
  totalLeads: number;
  qualifiedLeads: number;
  avgScore: number;
  totalSignals: number;
}

const cards = [
  { key: "total", label: "Total Leads", icon: Users, color: "text-blue-400" },
  { key: "qualified", label: "Qualified", icon: CheckCircle, color: "text-emerald-400" },
  { key: "avgScore", label: "Avg Score", icon: TrendingUp, color: "text-amber-400" },
  { key: "signals", label: "Active Signals", icon: Zap, color: "text-purple-400" },
] as const;

export function StatsCards({ totalLeads, qualifiedLeads, avgScore, totalSignals }: StatsCardsProps) {
  const values = {
    total: totalLeads,
    qualified: qualifiedLeads,
    avgScore: avgScore,
    signals: totalSignals,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardContent className="flex items-center gap-4 py-4">
            <div className={`rounded-lg bg-muted p-2.5 ${color}`}>
              <Icon className="size-5" />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">
                {key === "avgScore" ? values[key].toFixed(1) : values[key]}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
