"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, Globe, Mail, Phone, Link2, Zap, RefreshCw, Save } from "lucide-react";
import { LeadScoreBar } from "./lead-score-bar";
import { TagBadge } from "./tag-badge";
import type { Lead } from "@/hooks/use-leads";
import { ScoreBreakdown } from "@/components/signals/score-breakdown";

const STATUSES = ["new", "contacted", "qualified", "unqualified", "converted", "lost"] as const;
const STAGES = ["discovery", "research", "outreach", "negotiation", "closed_won", "closed_lost"] as const;

interface LeadDetailProps {
  lead: Lead;
  onUpdate: (data: Partial<Lead>) => Promise<void>;
  onEnrich: () => void;
  onScore: () => void;
}

export function LeadDetail({ lead, onUpdate, onEnrich, onScore }: LeadDetailProps) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    try {
      await onUpdate({ notes });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main info */}
        <div className="flex-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{lead.company_name}</CardTitle>
                {lead.domain && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Globe className="size-3.5" /> {lead.domain}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="gap-1" onClick={onEnrich}>
                  <RefreshCw className="size-3.5" /> Enrich
                </Button>
                <Button variant="outline" size="sm" className="gap-1" onClick={onScore}>
                  <Zap className="size-3.5" /> Score
                </Button>
                {lead.url && (
                  <Button variant="outline" size="sm" render={<a href={lead.url} target="_blank" rel="noopener noreferrer" />}>
                      <ExternalLink className="size-3.5" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {lead.description && <p className="text-sm text-muted-foreground">{lead.description}</p>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={lead.status} onValueChange={(v) => onUpdate({ status: v as Lead["status"] })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Pipeline Stage</label>
                  <Select value={lead.pipeline_stage} onValueChange={(v) => onUpdate({ pipeline_stage: v as Lead["pipeline_stage"] })}>
                    <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_", " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Score</label>
                <LeadScoreBar score={lead.total_score} qualified={lead.qualified} size="lg" />
              </div>

              <div className="flex flex-wrap gap-1">
                {lead.tags?.map((tag) => <TagBadge key={tag.id} name={tag.name} color={tag.color} />)}
              </div>
            </CardContent>
          </Card>

          {/* Contact info */}
          {(lead.contact_name || lead.contact_email || lead.contact_phone || lead.contact_linkedin) && (
            <Card>
              <CardHeader><CardTitle className="text-base">Contact</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {lead.contact_name && <p className="text-sm font-medium">{lead.contact_name}</p>}
                {lead.contact_email && (
                  <a href={`mailto:${lead.contact_email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Mail className="size-3.5" /> {lead.contact_email}
                  </a>
                )}
                {lead.contact_phone && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="size-3.5" /> {lead.contact_phone}
                  </p>
                )}
                {lead.contact_linkedin && (
                  <a href={lead.contact_linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                    <Link2 className="size-3.5" /> LinkedIn Profile
                  </a>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side panel */}
        <div className="w-full lg:w-[400px] space-y-6">
          <Tabs defaultValue="signals">
            <TabsList className="w-full">
              <TabsTrigger value="signals" className="flex-1">Signals</TabsTrigger>
              <TabsTrigger value="enrichment" className="flex-1">Enrichment</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Notes</TabsTrigger>
            </TabsList>

            <TabsContent value="signals" className="mt-4">
              {lead.signal_results && lead.signal_results.length > 0 ? (
                <ScoreBreakdown results={lead.signal_results} />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No signal results yet. Click &quot;Score&quot; to evaluate.
                </p>
              )}
            </TabsContent>

            <TabsContent value="enrichment" className="mt-4">
              {lead.enrichment_data ? (
                <Card>
                  <CardContent className="pt-4 space-y-3">
                    {Array.isArray((lead.enrichment_data as Record<string, unknown>).technologies) && (
                      <div>
                        <label className="text-xs text-muted-foreground">Technologies</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {((lead.enrichment_data as Record<string, unknown>).technologies as string[]).map((tech) => (
                            <Badge key={tech} variant="secondary" className="text-xs">{tech}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {Array.isArray((lead.enrichment_data as Record<string, unknown>).socialLinks) && (
                      <div>
                        <label className="text-xs text-muted-foreground">Social Links</label>
                        <div className="space-y-1 mt-1">
                          {((lead.enrichment_data as Record<string, unknown>).socialLinks as { platform: string; url: string }[]).map((link) => (
                            <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="block text-xs text-muted-foreground hover:text-foreground capitalize">
                              {link.platform}: {link.url}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted-foreground">Word Count</label>
                      <p className="text-sm">{((lead.enrichment_data as Record<string, unknown>).wordCount as number) ?? "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Not enriched yet. Click &quot;Enrich&quot; to fetch page data.
                </p>
              )}
            </TabsContent>

            <TabsContent value="notes" className="mt-4 space-y-3">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={8}
                placeholder="Add notes about this lead..."
              />
              <Button size="sm" className="gap-1" onClick={saveNotes} disabled={saving}>
                <Save className="size-3.5" /> {saving ? "Saving..." : "Save Notes"}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
