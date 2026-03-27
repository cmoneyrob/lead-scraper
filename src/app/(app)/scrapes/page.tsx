"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, XCircle, Clock, Loader2, Play, ArrowRight } from "lucide-react";
import { useScrapeJobs } from "@/hooks/use-scrape-jobs";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  pending: { label: "Pending", color: "bg-gray-500/20 text-gray-400", icon: Clock },
  running: { label: "Running", color: "bg-blue-500/20 text-blue-400", icon: Loader2 },
  searching: { label: "Searching", color: "bg-blue-500/20 text-blue-400", icon: Loader2 },
  scraping: { label: "Scraping", color: "bg-cyan-500/20 text-cyan-400", icon: Loader2 },
  scoring: { label: "Scoring", color: "bg-amber-500/20 text-amber-400", icon: Loader2 },
  completed: { label: "Completed", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  failed: { label: "Failed", color: "bg-red-500/20 text-red-400", icon: XCircle },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(start: string | null, end: string | null): string {
  if (!start) return "—";
  const s = new Date(start).getTime();
  const e = end ? new Date(end).getTime() : Date.now();
  const seconds = Math.round((e - s) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export default function ScrapesPage() {
  const { jobs, loading, fetchJobs } = useScrapeJobs();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scrape Runs"
        description={`${jobs.length} scrape run${jobs.length !== 1 ? "s" : ""}`}
      >
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchJobs()}>
            <Activity className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" render={<Link href="/signals" />}>
            <Play className="size-3.5" /> New Scrape
          </Button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="size-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No scrape runs yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Go to Signals, configure your signals, and hit Run Scrape to find leads.
            </p>
            <Button render={<Link href="/signals" />}>
              <ArrowRight className="size-3.5" /> Go to Signals
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const statusConf = STATUS_CONFIG[job.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = statusConf.icon;
            const isRunning = ["running", "searching", "scraping", "scoring"].includes(job.status);

            return (
              <Card key={job.id}>
                <CardContent className="py-4 px-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={statusConf.color}>
                          <StatusIcon className={`size-3 mr-1 ${isRunning ? "animate-spin" : ""}`} />
                          {statusConf.label}
                        </Badge>
                        {job.location && (
                          <Badge variant="outline" className="text-xs">
                            {job.location}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(job.created_at)}
                        </span>
                      </div>

                      {job.query_generated && (
                        <p className="text-xs text-muted-foreground truncate max-w-lg">
                          Query: {job.query_generated}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Found: <span className="text-foreground font-medium">{job.results_found}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Leads: <span className="text-foreground font-medium">{job.leads_created}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Scraped: <span className="text-foreground font-medium">{job.leads_scraped}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Qualified: <span className="text-emerald-400 font-medium">{job.leads_qualified}</span>
                        </span>
                        <span className="text-muted-foreground">
                          Duration: <span className="text-foreground font-medium tabular-nums">{formatDuration(job.started_at, job.completed_at)}</span>
                        </span>
                      </div>

                      {job.error_message && (
                        <p className="text-xs text-destructive">{job.error_message}</p>
                      )}

                      {/* Log steps */}
                      {job.log && job.log.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap">
                          {job.log.map((entry, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] font-mono">
                              {entry.step}: {entry.message}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    {job.leads_created > 0 && (
                      <Button variant="ghost" size="sm" render={<Link href="/leads" />}>
                        View Leads <ArrowRight className="size-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
