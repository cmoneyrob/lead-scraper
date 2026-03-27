"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { ScoreDistributionChart } from "@/components/dashboard/score-distribution-chart";
import { PipelineKanban } from "@/components/dashboard/pipeline-kanban";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardData {
  totalLeads: number;
  qualifiedLeads: number;
  avgScore: number;
  totalSignals: number;
  leads: { id: string; company_name: string; total_score: number; qualified: boolean; status: string; pipeline_stage: string; created_at: string }[];
  recentSearches: { id: string; query: string; created_at: string; results_count: number; leads_created: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [leadsRes, signalsRes, searchRes] = await Promise.all([
          fetch("/api/leads?per_page=200"),
          fetch("/api/signals"),
          fetch("/api/search/jobs"),
        ]);

        const leadsData = leadsRes.ok ? await leadsRes.json() : { leads: [], total: 0 };
        const signalsData = signalsRes.ok ? await signalsRes.json() : { signals: [] };
        const searchData = searchRes.ok ? await searchRes.json() : { jobs: [] };

        const leads = leadsData.leads ?? [];
        const signals = signalsData.signals ?? signalsData ?? [];
        const searches = searchData.jobs ?? searchData ?? [];

        const qualifiedCount = leads.filter((l: { qualified: boolean }) => l.qualified).length;
        const avgScore = leads.length > 0
          ? leads.reduce((sum: number, l: { total_score: number }) => sum + l.total_score, 0) / leads.length
          : 0;

        setData({
          totalLeads: leadsData.total ?? leads.length,
          qualifiedLeads: qualifiedCount,
          avgScore,
          totalSignals: Array.isArray(signals) ? signals.filter((s: { is_active: boolean }) => s.is_active).length : 0,
          leads,
          recentSearches: searches,
        });
      } catch {
        setData({ totalLeads: 0, qualifiedLeads: 0, avgScore: 0, totalSignals: 0, leads: [], recentSearches: [] });
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" description="Overview of your lead pipeline" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-lg" />
          <Skeleton className="h-[300px] rounded-lg" />
        </div>
      </div>
    );
  }

  const activities = (data?.recentSearches ?? []).map((s) => ({
    id: s.id,
    type: "search" as const,
    description: `Searched "${s.query}" — ${s.results_count} results, ${s.leads_created} imported`,
    timestamp: s.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your lead pipeline" />

      <StatsCards
        totalLeads={data?.totalLeads ?? 0}
        qualifiedLeads={data?.qualifiedLeads ?? 0}
        avgScore={data?.avgScore ?? 0}
        totalSignals={data?.totalSignals ?? 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ScoreDistributionChart leads={data?.leads ?? []} />
        <RecentActivity activities={activities} />
      </div>

      <PipelineKanban leads={data?.leads ?? []} />
    </div>
  );
}
