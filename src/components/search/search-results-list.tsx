"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchResultCard } from "./search-result-card";
import { Import, Loader2, CheckSquare, Square } from "lucide-react";
import type { SearchResult } from "@/hooks/use-search";

interface SearchResultsListProps {
  results: SearchResult[];
  onImport: (indices: number[]) => Promise<void>;
}

export function SearchResultsList({ results, onImport }: SearchResultsListProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  if (results.length === 0) return null;

  const toggleAll = () => {
    if (selected.size === results.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(results.map((_, i) => i)));
    }
  };

  const toggle = (idx: number) => {
    const next = new Set(selected);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelected(next);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(Array.from(selected));
      setSelected(new Set());
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1" onClick={toggleAll}>
            {selected.size === results.length ? <CheckSquare className="size-3.5" /> : <Square className="size-3.5" />}
            {selected.size === results.length ? "Deselect All" : "Select All"}
          </Button>
          <span className="text-sm text-muted-foreground">
            {results.length} results &middot; {selected.size} selected
          </span>
        </div>
        <Button size="sm" className="gap-1" disabled={selected.size === 0 || importing} onClick={handleImport}>
          {importing ? <Loader2 className="size-3.5 animate-spin" /> : <Import className="size-3.5" />}
          Import {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>

      <div className="space-y-2">
        {results.map((result, idx) => (
          <SearchResultCard
            key={idx}
            title={result.title}
            url={result.url}
            description={result.description}
            domain={result.domain}
            age={result.age}
            selected={selected.has(idx)}
            onToggle={() => toggle(idx)}
          />
        ))}
      </div>
    </div>
  );
}
