"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

const KNOWN_TECHNOLOGIES = [
  "React", "Next.js", "Vue", "Angular", "Svelte", "WordPress", "Shopify",
  "Wix", "Squarespace", "Bootstrap", "Tailwind", "jQuery", "Node.js",
  "Python", "Ruby on Rails", "PHP", "Laravel", "Django",
  "Google Analytics", "HubSpot", "Salesforce", "Intercom", "Stripe",
  "Cloudflare", "AWS", "Vercel", "Netlify",
];

interface TechnologyConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function TechnologyConfig({ config, onChange }: TechnologyConfigProps) {
  const [input, setInput] = useState("");
  const technologies = (config.technologies as string[]) ?? [];
  const matchMode = (config.match_mode as string) ?? "any";

  const addTech = (tech: string) => {
    if (tech && !technologies.includes(tech)) {
      onChange({ ...config, technologies: [...technologies, tech] });
    }
    setInput("");
  };

  const removeTech = (tech: string) => {
    onChange({ ...config, technologies: technologies.filter((t) => t !== tech) });
  };

  const suggestions = KNOWN_TECHNOLOGIES.filter(
    (t) => !technologies.includes(t) && t.toLowerCase().includes(input.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Technologies to detect</Label>
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search or type a technology..."
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(input.trim()); } }}
        />
        {input && suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1 p-2 rounded border bg-card">
            {suggestions.slice(0, 12).map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="cursor-pointer hover:bg-accent"
                onClick={() => addTech(tech)}
              >
                + {tech}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {technologies.map((tech) => (
            <Badge key={tech} variant="secondary" className="gap-1">
              {tech}
              <button onClick={() => removeTech(tech)}><X className="size-3" /></button>
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Match Mode</Label>
        <Select value={matchMode} onValueChange={(v) => onChange({ ...config, match_mode: v })}>
          <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any technology</SelectItem>
            <SelectItem value="all">All technologies</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
