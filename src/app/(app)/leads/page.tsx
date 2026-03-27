"use client";

import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { LeadTable } from "@/components/leads/lead-table";
import { LeadFilters } from "@/components/leads/lead-filters";
import { BulkActionBar } from "@/components/leads/bulk-action-bar";
import { LeadExportDialog } from "@/components/leads/lead-export-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, RefreshCw } from "lucide-react";
import { useLeads } from "@/hooks/use-leads";
import { toast } from "sonner";

export default function LeadsPage() {
  const { leads, total, loading, filters, updateFilters, fetchLeads, deleteLead, bulkAction } = useLeads();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleDelete = async (id: string) => {
    try {
      await deleteLead(id);
      toast.success("Lead deleted");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  const handleEnrich = async (id: string) => {
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead enriched");
      await fetchLeads();
    } catch {
      toast.error("Failed to enrich lead");
    }
  };

  const handleScore = async (id: string) => {
    try {
      const res = await fetch("/api/signals/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: [id] }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead scored");
      await fetchLeads();
    } catch {
      toast.error("Failed to score lead");
    }
  };

  const handleBulkAction = async (action: string, payload?: Record<string, unknown>) => {
    try {
      await bulkAction(selectedIds, action, payload);
      setSelectedIds([]);
      toast.success(`Bulk action completed`);
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const totalPages = Math.ceil(total / (filters.per_page ?? 25));

  return (
    <div className="space-y-4">
      <PageHeader title="Leads" description={`${total} leads in your pipeline`}>
        <div className="flex gap-2">
          <LeadExportDialog />
          <Button variant="outline" size="sm" className="gap-1" onClick={fetchLeads}>
            <RefreshCw className="size-3.5" /> Refresh
          </Button>
          <Button size="sm" className="gap-1" render={<a href="/search" />}>
            <Plus className="size-3.5" /> Find Leads
          </Button>
        </div>
      </PageHeader>

      <LeadFilters filters={filters} onChange={updateFilters} />

      <BulkActionBar
        selectedCount={selectedIds.length}
        onAction={handleBulkAction}
        onClear={() => setSelectedIds([])}
      />

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : (
        <LeadTable
          leads={leads}
          selectedIds={selectedIds}
          onSelect={setSelectedIds}
          onDelete={handleDelete}
          onEnrich={handleEnrich}
          onScore={handleScore}
        />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            Page {filters.page ?? 1} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page ?? 1) <= 1}
              onClick={() => updateFilters({ page: (filters.page ?? 1) - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(filters.page ?? 1) >= totalPages}
              onClick={() => updateFilters({ page: (filters.page ?? 1) + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
