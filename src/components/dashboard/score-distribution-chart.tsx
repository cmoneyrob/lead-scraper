"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface ScoreDistributionChartProps {
  leads: { total_score: number }[];
}

export function ScoreDistributionChart({ leads }: ScoreDistributionChartProps) {
  const buckets = [
    { range: "0-10", min: 0, max: 10, count: 0 },
    { range: "10-20", min: 10, max: 20, count: 0 },
    { range: "20-30", min: 20, max: 30, count: 0 },
    { range: "30-40", min: 30, max: 40, count: 0 },
    { range: "40-50", min: 40, max: 50, count: 0 },
    { range: "50-60", min: 50, max: 60, count: 0 },
    { range: "60-70", min: 60, max: 70, count: 0 },
    { range: "70-80", min: 70, max: 80, count: 0 },
    { range: "80-90", min: 80, max: 90, count: 0 },
    { range: "90+", min: 90, max: Infinity, count: 0 },
  ];

  leads.forEach((lead) => {
    const bucket = buckets.find((b) => lead.total_score >= b.min && lead.total_score < b.max);
    if (bucket) bucket.count++;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Score Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={buckets}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
