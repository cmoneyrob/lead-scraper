"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useState } from "react";

interface KeywordConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function KeywordConfig({ config, onChange }: KeywordConfigProps) {
  const [input, setInput] = useState("");
  const keywords = (config.keywords as string[]) ?? [];
  const field = (config.field as string) ?? "content";
  const caseSensitive = (config.case_sensitive as boolean) ?? false;
  const matchMode = (config.match_mode as string) ?? "any";

  const addKeyword = () => {
    if (input.trim() && !keywords.includes(input.trim())) {
      onChange({ ...config, keywords: [...keywords, input.trim()] });
      setInput("");
    }
  };

  const removeKeyword = (kw: string) => {
    onChange({ ...config, keywords: keywords.filter((k) => k !== kw) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Keywords</Label>
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Add keyword..."
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKeyword(); } }}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((kw) => (
            <Badge key={kw} variant="secondary" className="gap-1">
              {kw}
              <button onClick={() => removeKeyword(kw)}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-xs">Search Field</Label>
          <Select value={field} onValueChange={(v) => onChange({ ...config, field: v })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="content">Page Content</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="description">Description</SelectItem>
              <SelectItem value="metaDescription">Meta Description</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Match Mode</Label>
          <Select value={matchMode} onValueChange={(v) => onChange({ ...config, match_mode: v })}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any keyword</SelectItem>
              <SelectItem value="all">All keywords</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={caseSensitive} onCheckedChange={(v) => onChange({ ...config, case_sensitive: v })} />
        <Label className="text-xs">Case sensitive</Label>
      </div>
    </div>
  );
}
