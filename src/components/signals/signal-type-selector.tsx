"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Type, Regex, Cpu, Share2, Calendar, BarChart3, Layers, Code } from "lucide-react";

const SIGNAL_TYPES = [
  { type: "keyword", label: "Keyword", description: "Match keywords in page content", icon: Type },
  { type: "regex", label: "Regex Pattern", description: "Match regex patterns in content", icon: Regex },
  { type: "technology", label: "Technology", description: "Detect tech stack usage", icon: Cpu },
  { type: "social_presence", label: "Social Presence", description: "Check for social media links", icon: Share2 },
  { type: "domain_age", label: "Domain Age", description: "Filter by domain registration age", icon: Calendar },
  { type: "page_metric", label: "Page Metric", description: "Evaluate page statistics", icon: BarChart3 },
  { type: "composite", label: "Composite", description: "Combine multiple signals", icon: Layers },
  { type: "custom_expression", label: "Expression", description: "Write custom scoring logic", icon: Code },
] as const;

interface SignalTypeSelectorProps {
  value: string;
  onChange: (type: string) => void;
}

export function SignalTypeSelector({ value, onChange }: SignalTypeSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {SIGNAL_TYPES.map(({ type, label, description, icon: Icon }) => (
        <Card
          key={type}
          className={cn(
            "cursor-pointer transition-colors hover:border-primary/50",
            value === type && "border-primary bg-primary/5"
          )}
          onClick={() => onChange(type)}
        >
          <CardContent className="flex flex-col items-center text-center gap-2 py-4 px-3">
            <Icon className={cn("size-6", value === type ? "text-primary" : "text-muted-foreground")} />
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-[10px] text-muted-foreground">{description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
