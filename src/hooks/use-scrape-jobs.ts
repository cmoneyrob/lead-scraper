"use client";

import { useCallback, useEffect, useState } from "react";

export interface ScrapeJob {
  id: string;
  status: string;
  query_generated: string | null;
  location: string | null;
  signal_ids: string[];
  scoring_profile_id: string | null;
  search_params: Record<string, unknown>;
  results_found: number;
  leads_created: number;
  leads_scraped: number;
  leads_qualified: number;
  error_message: string | null;
  log: Array<{ step: string; time: string; message: string }>;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useScrapeJobs() {
  const [jobs, setJobs] = useState<ScrapeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/scrape/jobs");
      if (!res.ok) throw new Error("Failed to fetch scrape jobs");
      const data = await res.json();
      setJobs(data.jobs ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const runScrape = useCallback(
    async (params: {
      signal_ids: string[];
      scoring_profile_id?: string;
      location?: string;
      count?: number;
    }) => {
      const res = await fetch("/api/scrape/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Scrape failed");
      }
      const result = await res.json();
      await fetchJobs();
      return result;
    },
    [fetchJobs]
  );

  return { jobs, loading, total, fetchJobs, runScrape };
}
