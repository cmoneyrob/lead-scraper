"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { SignalEditor } from "@/components/signals/signal-editor";
import { SignalTestPanel } from "@/components/signals/signal-test-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useSignals, type SignalDefinition } from "@/hooks/use-signals";
import type { Lead } from "@/hooks/use-leads";
import { toast } from "sonner";

export default function SignalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === "new";
  const router = useRouter();
  const { signals, createSignal, updateSignal } = useSignals();
  const [signal, setSignal] = useState<SignalDefinition | undefined>();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const found = signals.find((s) => s.id === id);
      if (found) {
        setSignal(found);
        setLoading(false);
      }
    }
  }, [id, isNew, signals]);

  useEffect(() => {
    fetch("/api/leads?per_page=50")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => {});
  }, []);

  const handleSave = async (data: Partial<SignalDefinition>) => {
    try {
      if (isNew) {
        const created = await createSignal(data);
        toast.success("Signal created");
        router.push(`/signals/${created.id}`);
      } else {
        await updateSignal(id, data);
        toast.success("Signal updated");
      }
    } catch {
      toast.error("Failed to save signal");
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

  return (
    <div className="space-y-6">
      <PageHeader title={isNew ? "New Signal" : `Edit: ${signal?.name ?? "Signal"}`}>
        <Button variant="outline" size="sm" onClick={() => router.push("/signals")}>
          <ArrowLeft className="size-3.5 mr-1" /> Back
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
        <SignalEditor
          signal={signal}
          availableSignals={signals.filter((s) => s.id !== id)}
          onSave={handleSave}
        />
        {!isNew && signal && (
          <div className="space-y-6">
            <SignalTestPanel signalId={signal.id} leads={leads} />
          </div>
        )}
      </div>
    </div>
  );
}
