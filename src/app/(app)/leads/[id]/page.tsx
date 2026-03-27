"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { LeadDetail } from "@/components/leads/lead-detail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Trash2 } from "lucide-react";
import { useLead } from "@/hooks/use-leads";
import { toast } from "sonner";
import type { Lead } from "@/hooks/use-leads";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { lead, loading, refetch } = useLead(id);
  const router = useRouter();

  const handleUpdate = async (data: Partial<Lead>) => {
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead updated");
      await refetch();
    } catch {
      toast.error("Failed to update lead");
    }
  };

  const handleEnrich = async () => {
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: id }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead enriched");
      await refetch();
    } catch {
      toast.error("Failed to enrich lead");
    }
  };

  const handleScore = async () => {
    try {
      const res = await fetch("/api/signals/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_ids: [id] }),
      });
      if (!res.ok) throw new Error();
      toast.success("Lead scored");
      await refetch();
    } catch {
      toast.error("Failed to score lead");
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Lead deleted");
      router.push("/leads");
    } catch {
      toast.error("Failed to delete lead");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="space-y-4">
        <PageHeader title="Lead Not Found" />
        <Button variant="outline" onClick={() => router.push("/leads")}>
          <ArrowLeft className="size-4 mr-1" /> Back to Leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={lead.company_name} description={lead.domain ?? undefined}>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push("/leads")}>
            <ArrowLeft className="size-3.5 mr-1" /> Back
          </Button>
          <Button variant="destructive" size="sm" className="gap-1" onClick={handleDelete}>
            <Trash2 className="size-3.5" /> Delete
          </Button>
        </div>
      </PageHeader>

      <LeadDetail lead={lead} onUpdate={handleUpdate} onEnrich={handleEnrich} onScore={handleScore} />
    </div>
  );
}
