"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle } from "lucide-react";

interface RegexConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function RegexConfig({ config, onChange }: RegexConfigProps) {
  const pattern = (config.pattern as string) ?? "";
  const flags = (config.flags as string) ?? "i";
  const field = (config.field as string) ?? "content";
  const [valid, setValid] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!pattern) { setValid(true); return; }
    try {
      new RegExp(pattern, flags);
      setValid(true);
      setErrorMsg("");
    } catch (e) {
      setValid(false);
      setErrorMsg(e instanceof Error ? e.message : "Invalid regex");
    }
  }, [pattern, flags]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Pattern</Label>
        <div className="relative">
          <Input
            value={pattern}
            onChange={(e) => onChange({ ...config, pattern: e.target.value })}
            placeholder="e.g., Series [A-C]\s+funding"
            className={!valid ? "border-destructive" : ""}
            style={{ fontFamily: "monospace" }}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            {pattern && (valid ? <CheckCircle className="size-4 text-emerald-400" /> : <AlertCircle className="size-4 text-destructive" />)}
          </div>
        </div>
        {!valid && <p className="text-xs text-destructive">{errorMsg}</p>}
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
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Flags</Label>
          <div className="flex gap-3">
            {[
              { flag: "i", label: "Case insensitive" },
              { flag: "g", label: "Global" },
              { flag: "m", label: "Multiline" },
            ].map(({ flag, label }) => (
              <div key={flag} className="flex items-center gap-1">
                <Switch
                  checked={flags.includes(flag)}
                  onCheckedChange={(checked) => {
                    const next = checked ? flags + flag : flags.replace(flag, "");
                    onChange({ ...config, flags: next });
                  }}
                />
                <Badge variant="outline" className="text-[10px] font-mono">{flag}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
