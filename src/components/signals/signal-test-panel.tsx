"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Zap, Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Lead } from "@/hooks/use-leads";

interface SignalTestPanelProps {
  signalId: string;
  leads: Lead[];
}

interface TestResult {
  matched: boolean;
  rawScore: number;
  matchDetails: Record<string, unknown>;
}

export function SignalTestPanel({ signalId, leads }: SignalTestPanelProps) {
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [result, setResult] = useState<TestResult | null>(null);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    if (!selectedLeadId) return;
    setTesting(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/signals/${signalId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lead_id: selectedLeadId }),
      });
      if (!res.ok) throw new Error("Test failed");
      setResult(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="size-4" /> Test Signal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedLeadId} onValueChange={(v) => { if (v) setSelectedLeadId(v); }}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a lead to test against..." />
            </SelectTrigger>
            <SelectContent>
              {leads.map((lead) => (
                <SelectItem key={lead.id} value={lead.id}>{lead.company_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={runTest} disabled={!selectedLeadId || testing} className="gap-1">
            {testing ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
            Test
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {result && (
          <div className="rounded-md border p-3 space-y-2">
            <div className="flex items-center gap-2">
              {result.matched ? (
                <CheckCircle className="size-5 text-emerald-400" />
              ) : (
                <XCircle className="size-5 text-muted-foreground" />
              )}
              <span className="font-medium">{result.matched ? "Matched" : "No Match"}</span>
              <Badge variant="secondary" className="ml-auto font-mono">
                Score: {result.rawScore.toFixed(1)}
              </Badge>
            </div>
            {Object.keys(result.matchDetails).length > 0 && (
              <pre className="text-xs bg-muted/50 rounded p-2 overflow-auto max-h-[200px]">
                {JSON.stringify(result.matchDetails, null, 2)}
              </pre>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
