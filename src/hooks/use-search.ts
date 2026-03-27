"use client";

import { useCallback, useState } from "react";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  domain: string;
  age?: string;
  favicon?: string;
}

export interface SearchJob {
  id: string;
  query: string;
  search_params: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
  results_count: number;
  leads_created: number;
  error_message: string | null;
  results_data: { results: SearchResult[] } | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentJob, setCurrentJob] = useState<SearchJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (params: {
    query: string;
    country?: string;
    freshness?: string;
    count?: number;
    scoring_profile_id?: string;
  }) => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Search failed");
      }
      const data = await res.json();
      setCurrentJob(data.job);
      setResults(data.results ?? []);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importResults = useCallback(async (jobId: string, resultIndices: number[]) => {
    const res = await fetch(`/api/search/jobs/${jobId}/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ result_indices: resultIndices }),
    });
    if (!res.ok) throw new Error("Failed to import results");
    return res.json();
  }, []);

  return { results, currentJob, loading, error, search, importResults };
}
