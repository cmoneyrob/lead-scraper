"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Tag, RefreshCw, X } from "lucide-react";
import { useState } from "react";

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string, payload?: Record<string, unknown>) => void;
  onClear: () => void;
}

export function BulkActionBar({ selectedCount, onAction, onClear }: BulkActionBarProps) {
  const [statusValue, setStatusValue] = useState<string>("");

  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <div className="h-4 w-px bg-border" />

      <Select value={statusValue} onValueChange={(v) => { if (v) { setStatusValue(v); onAction("update_status", { status: v }); } }}>
        <SelectTrigger className="w-[140px] h-8 text-xs">
          <SelectValue placeholder="Set Status" />
        </SelectTrigger>
        <SelectContent>
          {["new", "contacted", "qualified", "unqualified", "converted", "lost"].map((s) => (
            <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" className="h-8 gap-1 text-xs" onClick={() => onAction("rescore")}>
        <RefreshCw className="size-3" /> Re-score
      </Button>

      <Button variant="destructive" size="sm" className="h-8 gap-1 text-xs" onClick={() => onAction("delete")}>
        <Trash2 className="size-3" /> Delete
      </Button>

      <Button variant="ghost" size="sm" className="h-8 ml-auto" onClick={onClear}>
        <X className="size-3.5" />
      </Button>
    </div>
  );
}
