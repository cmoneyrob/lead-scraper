"use client";

import { useState } from "react";
import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, ExternalLink, Zap, Globe } from "lucide-react";
import { LeadScoreBar } from "./lead-score-bar";
import { TagBadge } from "./tag-badge";
import type { Lead } from "@/hooks/use-leads";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  contacted: "bg-yellow-500/20 text-yellow-400",
  qualified: "bg-emerald-500/20 text-emerald-400",
  unqualified: "bg-gray-500/20 text-gray-400",
  converted: "bg-purple-500/20 text-purple-400",
  lost: "bg-red-500/20 text-red-400",
};

const STAGE_COLORS: Record<string, string> = {
  discovery: "bg-cyan-500/20 text-cyan-400",
  research: "bg-indigo-500/20 text-indigo-400",
  outreach: "bg-amber-500/20 text-amber-400",
  negotiation: "bg-orange-500/20 text-orange-400",
  closed_won: "bg-emerald-500/20 text-emerald-400",
  closed_lost: "bg-red-500/20 text-red-400",
};

interface LeadTableProps {
  leads: Lead[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onDelete: (id: string) => void;
  onEnrich: (id: string) => void;
  onScore: (id: string) => void;
}

export function LeadTable({ leads, selectedIds, onSelect, onDelete, onEnrich, onScore }: LeadTableProps) {
  const allSelected = leads.length > 0 && leads.every((l) => selectedIds.includes(l.id));

  const toggleAll = () => {
    if (allSelected) {
      onSelect([]);
    } else {
      onSelect(leads.map((l) => l.id));
    }
  };

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelect(selectedIds.filter((i) => i !== id));
    } else {
      onSelect([...selectedIds, id]);
    }
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <TableHead>Company</TableHead>
            <TableHead className="hidden md:table-cell">Domain</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Stage</TableHead>
            <TableHead>Score</TableHead>
            <TableHead className="hidden xl:table-cell">Tags</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No leads found. Run a search to discover leads.
              </TableCell>
            </TableRow>
          )}
          {leads.map((lead) => (
            <TableRow key={lead.id} className={selectedIds.includes(lead.id) ? "bg-accent/50" : ""}>
              <TableCell>
                <Checkbox checked={selectedIds.includes(lead.id)} onCheckedChange={() => toggleOne(lead.id)} />
              </TableCell>
              <TableCell>
                <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                  {lead.company_name}
                </Link>
                {lead.title && (
                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">{lead.title}</p>
                )}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {lead.domain && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Globe className="size-3" />
                    {lead.domain}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={STATUS_COLORS[lead.status] ?? ""}>
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Badge variant="outline" className={STAGE_COLORS[lead.pipeline_stage] ?? ""}>
                  {lead.pipeline_stage.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="w-[140px]">
                <LeadScoreBar score={lead.total_score} qualified={lead.qualified} size="sm" />
              </TableCell>
              <TableCell className="hidden xl:table-cell">
                <div className="flex gap-1 flex-wrap">
                  {lead.tags?.slice(0, 3).map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {(lead.tags?.length ?? 0) > 3 && (
                    <span className="text-xs text-muted-foreground">+{(lead.tags?.length ?? 0) - 3}</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="size-8 p-0" />}>
                      <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem render={<Link href={`/leads/${lead.id}`} />}>
                      View Details
                    </DropdownMenuItem>
                    {lead.url && (
                      <DropdownMenuItem render={<a href={lead.url} target="_blank" rel="noopener noreferrer" className="gap-1" />}>
                          <ExternalLink className="size-3.5" /> Visit Site
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => onEnrich(lead.id)}>
                      <Globe className="size-3.5 mr-1" /> Enrich
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onScore(lead.id)}>
                      <Zap className="size-3.5 mr-1" /> Score
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => onDelete(lead.id)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
