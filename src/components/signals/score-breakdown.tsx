import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import type { SignalResult } from "@/hooks/use-leads";

interface ScoreBreakdownProps {
  results: SignalResult[];
}

export function ScoreBreakdown({ results }: ScoreBreakdownProps) {
  const totalScore = results.reduce((sum, r) => sum + r.weighted_score, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total Score</span>
        <span className="font-mono font-bold text-lg">{totalScore.toFixed(1)}</span>
      </div>

      <div className="space-y-2">
        {results.map((result) => (
          <Card key={result.id} className={result.matched ? "border-emerald-500/30" : "border-border"}>
            <CardContent className="flex items-center gap-3 py-2.5 px-3">
              {result.matched ? (
                <CheckCircle className="size-4 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="size-4 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {result.signal_definition?.name ?? "Signal"}
                </p>
                {result.signal_definition?.category && (
                  <Badge variant="secondary" className="text-[10px] mt-0.5">{result.signal_definition.category}</Badge>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono tabular-nums">
                  {result.weighted_score.toFixed(1)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  raw: {result.raw_score.toFixed(1)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
