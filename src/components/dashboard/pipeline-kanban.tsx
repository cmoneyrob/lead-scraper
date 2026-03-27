"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadScoreBar } from "@/components/leads/lead-score-bar";
import Link from "next/link";

interface KanbanLead {
  id: string;
  company_name: string;
  total_score: number;
  qualified: boolean;
  status: string;
  pipeline_stage?: string;
}

interface PipelineKanbanProps {
  leads: KanbanLead[];
}

const STAGES = [
  { key: "discovery", label: "Discovery", color: "text-cyan-400" },
  { key: "research", label: "Research", color: "text-indigo-400" },
  { key: "outreach", label: "Outreach", color: "text-amber-400" },
  { key: "negotiation", label: "Negotiation", color: "text-orange-400" },
  { key: "closed_won", label: "Closed Won", color: "text-emerald-400" },
  { key: "closed_lost", label: "Closed Lost", color: "text-red-400" },
];

export function PipelineKanban({ leads }: PipelineKanbanProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {STAGES.map(({ key, label, color }) => {
            const stageleads = leads.filter((l) => l.status === key || l.pipeline_stage === key);
            return (
              <div key={key} className="min-w-[180px] flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-medium ${color}`}>{label}</span>
                  <Badge variant="secondary" className="text-[10px]">{stageleads.length}</Badge>
                </div>
                <div className="space-y-2">
                  {stageleads.slice(0, 5).map((lead) => (
                    <Link key={lead.id} href={`/leads/${lead.id}`}>
                      <div className="rounded-md border p-2 hover:bg-accent transition-colors">
                        <p className="text-xs font-medium truncate">{lead.company_name}</p>
                        <LeadScoreBar score={lead.total_score} qualified={lead.qualified} size="sm" showLabel={false} />
                      </div>
                    </Link>
                  ))}
                  {stageleads.length === 0 && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">Empty</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
