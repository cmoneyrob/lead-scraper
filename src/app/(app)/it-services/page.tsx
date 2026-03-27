"use client";

import { useState, useCallback } from "react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchResultsList } from "@/components/search/search-results-list";
import {
  ITServicesSearchForm,
  type ITServicesSearchParams,
} from "@/components/it-services/it-services-search-form";
import { Zap, Loader2, Monitor } from "lucide-react";
import { toast } from "sonner";
import type { SearchResult, SearchJob } from "@/hooks/use-search";

export default function ITServicesPage() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [currentJob, setCurrentJob] = useState<SearchJob | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedQuery, setGeneratedQuery] = useState<string | null>(null);
  const [lastParams, setLastParams] = useState<ITServicesSearchParams | null>(null);
  const [generatingSignals, setGeneratingSignals] = useState(false);

  const handleSearch = useCallback(async (params: ITServicesSearchParams) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setGeneratedQuery(null);
    setLastParams(params);

    try {
      const res = await fetch("/api/it-services/search", {
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
      setGeneratedQuery(data.query ?? null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = async (indices: number[]) => {
    if (!currentJob) return;
    try {
      const res = await fetch(`/api/search/jobs/${currentJob.id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result_indices: indices }),
      });
      if (!res.ok) throw new Error("Failed to import results");
      const data = await res.json();
      toast.success(`Imported ${data.leads?.length ?? indices.length} leads`);
    } catch {
      toast.error("Failed to import results");
    }
  };

  const handleGenerateSignals = async () => {
    if (!lastParams) return;
    setGeneratingSignals(true);
    try {
      const res = await fetch("/api/it-services/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCategories: lastParams.serviceCategories,
          industryVerticals: lastParams.industryVerticals,
          painPoints: lastParams.painPoints,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error ?? "Failed to generate signals");
      }

      const data = await res.json();
      toast.success(
        `Created ${data.count} scoring signal${data.count === 1 ? "" : "s"} for IT services`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to generate signals";
      toast.error(msg);
    } finally {
      setGeneratingSignals(false);
    }
  };

  const hasSignalableParams =
    lastParams &&
    ((lastParams.serviceCategories?.length ?? 0) > 0 ||
      (lastParams.industryVerticals?.length ?? 0) > 0 ||
      (lastParams.painPoints?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="IT Services Prospector"
        description="Find businesses with potential IT service needs. Customize location, industry, and service type to target your ideal prospects."
      >
        {hasSignalableParams && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={generatingSignals}
            onClick={handleGenerateSignals}
          >
            {generatingSignals ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Zap className="size-3.5" />
            )}
            Generate Scoring Signals
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          <ITServicesSearchForm onSearch={handleSearch} loading={loading} />
        </CardContent>
      </Card>

      {generatedQuery && (
        <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-1">Generated search query:</p>
          <p className="text-sm font-mono break-all">{generatedQuery}</p>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Monitor className="size-3" />
              {results.length} potential IT prospects
            </Badge>
          </div>
          <SearchResultsList results={results} onImport={handleImport} />
        </div>
      )}

      {!loading && results.length === 0 && !error && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Monitor className="size-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">Find IT Service Prospects</p>
            <p className="text-sm text-muted-foreground max-w-md mt-1">
              Configure your search above to find businesses that may need IT services.
              Select a location, choose relevant IT service categories, and optionally
              narrow by industry or pain points.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
