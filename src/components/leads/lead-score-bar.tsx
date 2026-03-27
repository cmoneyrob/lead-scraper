import { cn } from "@/lib/utils";

interface LeadScoreBarProps {
  score: number;
  maxScore?: number;
  qualified?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number, maxScore: number): string {
  const pct = (score / maxScore) * 100;
  if (pct >= 75) return "bg-emerald-500";
  if (pct >= 50) return "bg-amber-500";
  if (pct >= 25) return "bg-orange-500";
  return "bg-red-500";
}

export function LeadScoreBar({ score, maxScore = 100, qualified, showLabel = true, size = "md" }: LeadScoreBarProps) {
  const pct = Math.min(100, (score / maxScore) * 100);
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 rounded-full bg-muted overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-500", getScoreColor(score, maxScore))}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className={cn("text-xs font-mono tabular-nums", qualified ? "text-emerald-400" : "text-muted-foreground")}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}
