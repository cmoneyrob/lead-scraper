"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import type { LeadFilters as Filters } from "@/hooks/use-leads";

const STATUSES = ["new", "contacted", "qualified", "unqualified", "converted", "lost"] as const;
const STAGES = ["discovery", "research", "outreach", "negotiation", "closed_won", "closed_lost"] as const;

interface LeadFiltersProps {
  filters: Filters;
  onChange: (filters: Partial<Filters>) => void;
}

export function LeadFilters({ filters, onChange }: LeadFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search leads..."
          value={filters.search ?? ""}
          onChange={(e) => onChange({ search: e.target.value })}
          className="pl-9 h-9"
        />
      </div>

      <Select value={filters.status ?? "all"} onValueChange={(v) => { if (v) onChange({ status: v === "all" ? undefined : v }); }}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.pipeline_stage ?? "all"} onValueChange={(v) => { if (v) onChange({ pipeline_stage: v === "all" ? undefined : v }); }}>
        <SelectTrigger className="w-[150px] h-9">
          <SelectValue placeholder="Stage" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Stages</SelectItem>
          {STAGES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.qualified === undefined ? "all" : filters.qualified ? "yes" : "no"}
        onValueChange={(v) => { if (v) onChange({ qualified: v === "all" ? undefined : v === "yes" }); }}
      >
        <SelectTrigger className="w-[130px] h-9">
          <SelectValue placeholder="Qualified" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Leads</SelectItem>
          <SelectItem value="yes">Qualified</SelectItem>
          <SelectItem value="no">Not Qualified</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.sort_by ?? "created_at"} onValueChange={(v) => { if (v) onChange({ sort_by: v }); }}>
        <SelectTrigger className="w-[140px] h-9">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="created_at">Date Created</SelectItem>
          <SelectItem value="total_score">Score</SelectItem>
          <SelectItem value="company_name">Company</SelectItem>
          <SelectItem value="updated_at">Last Updated</SelectItem>
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        className="h-9"
        onClick={() => onChange({ sort_order: filters.sort_order === "asc" ? "desc" : "asc" })}
      >
        {filters.sort_order === "asc" ? "↑ Asc" : "↓ Desc"}
      </Button>

      {(filters.status || filters.pipeline_stage || filters.qualified !== undefined || filters.search) && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-muted-foreground"
          onClick={() => onChange({ status: undefined, pipeline_stage: undefined, qualified: undefined, search: "", min_score: undefined, max_score: undefined })}
        >
          <X className="size-3.5" /> Clear
        </Button>
      )}
    </div>
  );
}
