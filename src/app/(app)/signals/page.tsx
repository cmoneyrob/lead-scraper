"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Zap, Layers, Play, Loader2, MapPin } from "lucide-react";
import { useSignals, useScoringProfiles } from "@/hooks/use-signals";
import { useScrapeJobs } from "@/hooks/use-scrape-jobs";
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
  const { profiles } = useScoringProfiles();
  const { runScrape } = useScrapeJobs();

  const [scrapeRunning, setScrapeRunning] = useState(false);
  const [location, setLocation] = useState("");
  const [resultCount, setResultCount] = useState(20);

  const activeSignals = signals.filter((s) => s.is_active);
  const defaultProfile = profiles.find((p) => p.is_default);

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

  const handleRunScrape = async () => {
    if (activeSignals.length === 0) {
      toast.error("Enable at least one signal before running a scrape");
      return;
    }

    setScrapeRunning(true);
    try {
      const result = await runScrape({
        signal_ids: activeSignals.map((s) => s.id),
        scoring_profile_id: defaultProfile?.id,
        location: location.trim() || undefined,
        count: resultCount,
      });

      const summary = result.summary;
      toast.success(
        `Scrape complete: ${summary.leads_created} leads found, ${summary.leads_qualified} qualified`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scrape failed");
    } finally {
      setScrapeRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Signals" description="Define signals to find and score leads automatically">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" render={<Link href="/signals/profiles" />}>
            <Layers className="size-3.5" /> Profiles
          </Button>
          <Button size="sm" render={<Link href="/signals/new" />}>
            <Plus className="size-3.5" /> New Signal
          </Button>
        </div>
      </PageHeader>

      {/* Run Scrape Panel */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Play className="size-4 text-primary" />
                <h3 className="font-medium text-sm">Run Scrape</h3>
                <Badge variant="secondary" className="text-xs">
                  {activeSignals.length} active signal{activeSignals.length !== 1 ? "s" : ""}
                </Badge>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 flex-1">
                  <Label htmlFor="scrape-location" className="text-xs text-muted-foreground whitespace-nowrap">
                    <MapPin className="size-3 inline mr-1" />
                    Location
                  </Label>
                  <Input
                    id="scrape-location"
                    placeholder="e.g. Dallas TX, New York, etc."
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-8 text-sm max-w-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="scrape-count" className="text-xs text-muted-foreground whitespace-nowrap">
                    Results
                  </Label>
                  <Input
                    id="scrape-count"
                    type="number"
                    min={5}
                    max={50}
                    value={resultCount}
                    onChange={(e) => setResultCount(parseInt(e.target.value, 10) || 20)}
                    className="h-8 text-sm w-20"
                  />
                </div>
              </div>
            </div>
            <Button
              onClick={handleRunScrape}
              disabled={scrapeRunning || activeSignals.length === 0}
              className="shrink-0"
            >
              {scrapeRunning ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" /> Running...
                </>
              ) : (
                <>
                  <Play className="size-3.5" /> Run Scrape
                </>
              )}
            </Button>
          </div>
          {activeSignals.length === 0 && !loading && (
            <p className="text-xs text-destructive mt-2">
              Enable at least one signal below to run a scrape.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Signal List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : signals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="size-10 text-muted-foreground mb-3" />
            <p className="text-lg font-medium">No signals yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create your first signal to start finding leads automatically.</p>
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
