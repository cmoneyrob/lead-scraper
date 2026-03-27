"use client";

import { PageHeader } from "@/components/page-header";
import { SearchForm } from "@/components/search/search-form";
import { SearchResultsList } from "@/components/search/search-results-list";
import { SearchJobHistory } from "@/components/search/search-job-history";
import { useSearch } from "@/hooks/use-search";
import { toast } from "sonner";

export default function SearchPage() {
  const { results, currentJob, loading, error, search, importResults } = useSearch();

  const handleImport = async (indices: number[]) => {
    if (!currentJob) return;
    try {
      const data = await importResults(currentJob.id, indices);
      toast.success(`Imported ${data.leads?.length ?? indices.length} leads`);
    } catch {
      toast.error("Failed to import results");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Search"
        description="Find leads using Brave Search. Select results to import into your pipeline."
      />

      <SearchForm onSearch={search} loading={loading} />

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {results.length > 0 && (
        <SearchResultsList results={results} onImport={handleImport} />
      )}

      <SearchJobHistory />
    </div>
  );
}
