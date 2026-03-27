"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Save, Loader2 } from "lucide-react";
import type { SignalDefinition, ScoringProfile } from "@/hooks/use-signals";

interface ScoringProfileEditorProps {
  profile?: ScoringProfile;
  signals: SignalDefinition[];
  onSave: (data: Partial<ScoringProfile>) => Promise<void>;
}

export function ScoringProfileEditor({ profile, signals, onSave }: ScoringProfileEditorProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [description, setDescription] = useState(profile?.description ?? "");
  const [threshold, setThreshold] = useState(profile?.qualification_threshold ?? 50);
  const [selectedSignalIds, setSelectedSignalIds] = useState<string[]>(profile?.signal_ids ?? []);
  const [isDefault, setIsDefault] = useState(profile?.is_default ?? false);
  const [saving, setSaving] = useState(false);

  const toggleSignal = (id: string) => {
    setSelectedSignalIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        qualification_threshold: threshold,
        signal_ids: selectedSignalIds,
        is_default: isDefault,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Default Scoring" />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            <Label className="text-xs">Default profile</Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Qualification Threshold</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs">Score threshold</Label>
            <span className="text-sm font-mono">{threshold.toFixed(0)}</span>
          </div>
          <Slider value={[threshold]} min={0} max={200} step={1} onValueChange={(val) => setThreshold(Array.isArray(val) ? val[0] : val)} />
          <p className="text-xs text-muted-foreground">Leads scoring above this threshold are marked as qualified.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Included Signals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {signals.map((signal) => (
            <label key={signal.id} className="flex items-center gap-3 rounded-md border p-2 cursor-pointer hover:bg-accent">
              <Checkbox checked={selectedSignalIds.includes(signal.id)} onCheckedChange={() => toggleSignal(signal.id)} />
              <div className="flex-1">
                <p className="text-sm font-medium">{signal.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{signal.signal_type} &middot; weight {signal.weight}x &middot; max {signal.max_score}</p>
              </div>
            </label>
          ))}
          {signals.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No signals created yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {profile ? "Update Profile" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}
