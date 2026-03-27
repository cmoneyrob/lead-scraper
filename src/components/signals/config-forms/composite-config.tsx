"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import type { SignalDefinition } from "@/hooks/use-signals";

interface CompositeConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
  availableSignals: SignalDefinition[];
}

export function CompositeConfig({ config, onChange, availableSignals }: CompositeConfigProps) {
  const signalIds = (config.signal_ids as string[]) ?? [];
  const operator = (config.operator as string) ?? "all_of";
  const weights = (config.weights as number[]) ?? signalIds.map(() => 1);

  const toggleSignal = (id: string) => {
    if (signalIds.includes(id)) {
      const idx = signalIds.indexOf(id);
      const nextIds = signalIds.filter((s) => s !== id);
      const nextWeights = weights.filter((_, i) => i !== idx);
      onChange({ ...config, signal_ids: nextIds, weights: nextWeights });
    } else {
      onChange({ ...config, signal_ids: [...signalIds, id], weights: [...weights, 1] });
    }
  };

  const updateWeight = (idx: number, value: number) => {
    const next = [...weights];
    next[idx] = value;
    onChange({ ...config, weights: next });
  };

  const nonCompositeSignals = availableSignals.filter((s) => s.signal_type !== "composite");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs">Operator</Label>
        <Select value={operator} onValueChange={(v) => onChange({ ...config, operator: v })}>
          <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all_of">All signals must match</SelectItem>
            <SelectItem value="any_of">Any signal must match</SelectItem>
            <SelectItem value="weighted_average">Weighted average</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Child Signals</Label>
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {nonCompositeSignals.map((signal) => {
            const isSelected = signalIds.includes(signal.id);
            const idx = signalIds.indexOf(signal.id);
            return (
              <div key={signal.id} className="flex items-center gap-3 rounded-md border p-2">
                <Checkbox checked={isSelected} onCheckedChange={() => toggleSignal(signal.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{signal.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{signal.signal_type}</p>
                </div>
                {isSelected && operator === "weighted_average" && (
                  <div className="flex items-center gap-2 w-[120px]">
                    <Slider
                      value={[weights[idx] ?? 1]}
                      min={0}
                      max={5}
                      step={0.1}
                      onValueChange={(val) => updateWeight(idx, Array.isArray(val) ? val[0] : val)}
                    />
                    <span className="text-xs font-mono w-8">{(weights[idx] ?? 1).toFixed(1)}</span>
                  </div>
                )}
              </div>
            );
          })}
          {nonCompositeSignals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No signals available. Create individual signals first.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
