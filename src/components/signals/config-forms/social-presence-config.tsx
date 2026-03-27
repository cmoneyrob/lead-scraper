"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const PLATFORMS = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "twitter", label: "Twitter / X" },
  { id: "github", label: "GitHub" },
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
];

interface SocialPresenceConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function SocialPresenceConfig({ config, onChange }: SocialPresenceConfigProps) {
  const platforms = (config.platforms as string[]) ?? [];
  const matchMode = (config.match_mode as string) ?? "any";

  const togglePlatform = (platform: string) => {
    const next = platforms.includes(platform)
      ? platforms.filter((p) => p !== platform)
      : [...platforms, platform];
    onChange({ ...config, platforms: next });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Platforms</Label>
        <div className="grid grid-cols-2 gap-2">
          {PLATFORMS.map(({ id, label }) => (
            <label key={id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-accent">
              <Checkbox checked={platforms.includes(id)} onCheckedChange={() => togglePlatform(id)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Match Mode</Label>
        <Select value={matchMode} onValueChange={(v) => onChange({ ...config, match_mode: v })}>
          <SelectTrigger className="w-[200px] h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any platform</SelectItem>
            <SelectItem value="all">All platforms</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
