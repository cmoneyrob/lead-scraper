"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { SearchJob } from "@/hooks/use-search";

const STATUS_ICONS = {
  pending: Clock,
  running: Loader2,
  completed: CheckCircle,
  failed: XCircle,
};

const STATUS_COLORS = {
  pending: "text-yellow-400",
  running: "text-blue-400",
  completed: "text-emerald-400",
  failed: "text-red-400",
};

export function SearchJobHistory() {
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/search/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  if (loading) return <div className="text-sm text-muted-foreground">Loading history...</div>;
  if (jobs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="size-4" /> Recent Searches
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {jobs.slice(0, 10).map((job) => {
          const Icon = STATUS_ICONS[job.status];
          return (
            <div key={job.id} className="flex items-center gap-3 text-sm">
              <Icon className={`size-4 ${STATUS_COLORS[job.status]} ${job.status === "running" ? "animate-spin" : ""}`} />
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium">{job.query}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(job.created_at).toLocaleDateString()} &middot; {job.results_count} results &middot; {job.leads_created} imported
                </p>
              </div>
              <Badge variant="outline" className="text-xs">{job.status}</Badge>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
