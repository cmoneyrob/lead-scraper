"use client";

import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Zap, Layers } from "lucide-react";
import { useSignals } from "@/hooks/use-signals";
import { toast } from "sonner";

const TYPE_COLORS: Record<string, string> = {
  keyword: "bg-blue-500/20 text-blue-400",
  regex: "bg-purple-500/20 text-purple-400",
  technology: "bg-cyan-500/20 text-cyan-400",
  social_presence: "bg-pink-500/20 text-pink-400",
  domain_age: "bg-amber-500/20 text-amber-400",
  page_metric: "bg-emerald-500/20 text-emerald-400",
  composite: "bg-indigo-500/20 text-indigo-400",
  custom_expression: "bg-orange-500/20 text-orange-400",
};

export default function SignalsPage() {
  const { signals, loading, updateSignal, deleteSignal } = useSignals();

  const handleToggle = async (id: string, active: boolean) => {
    try {
      await updateSignal(id, { is_active: active });
    } catch {
      toast.error("Failed to update signal");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSignal(id);
      toast.success("Signal deleted");
    } catch {
      toast.error("Failed to delete signal");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Signals" description="Define custom scoring signals to evaluate your leads">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href="/signals/profiles" />}>
              <Layers className="size-3.5" /> Profiles
          </Button>
          <Button size="sm" render={<Link href="/signals/new" />}>
              <Plus className="size-3.5" /> New Signal
          </Button>
        </div>
      </PageHeader>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="size-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No signals yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first signal to start scoring leads.</p>
            <Button render={<Link href="/signals/new" />}>
                <Plus className="size-3.5" /> Create Signal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <Card key={signal.id}>
              <CardContent className="flex items-center gap-4 py-3 px-4">
                <Switch
                  checked={signal.is_active}
                  onCheckedChange={(v) => handleToggle(signal.id, v)}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{signal.name}</p>
                    <Badge variant="secondary" className={TYPE_COLORS[signal.signal_type] ?? ""}>
                      {signal.signal_type.replace("_", " ")}
                    </Badge>
                    {signal.category && (
                      <Badge variant="outline" className="text-xs">{signal.category}</Badge>
                    )}
                  </div>
                  {signal.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{signal.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Weight: {signal.weight}x &middot; Max Score: {signal.max_score}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="size-8 p-0" render={<Link href={`/signals/${signal.id}`} />}>
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="size-8 p-0 text-destructive" onClick={() => handleDelete(signal.id)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
