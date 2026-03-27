"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2 } from "lucide-react";
import { SignalTypeSelector } from "./signal-type-selector";
import { KeywordConfig } from "./config-forms/keyword-config";
import { RegexConfig } from "./config-forms/regex-config";
import { TechnologyConfig } from "./config-forms/technology-config";
import { SocialPresenceConfig } from "./config-forms/social-presence-config";
import { CompositeConfig } from "./config-forms/composite-config";
import { ExpressionConfig } from "./config-forms/expression-config";
import type { SignalDefinition } from "@/hooks/use-signals";

interface SignalEditorProps {
  signal?: SignalDefinition;
  availableSignals: SignalDefinition[];
  onSave: (data: Partial<SignalDefinition>) => Promise<void>;
}

export function SignalEditor({ signal, availableSignals, onSave }: SignalEditorProps) {
  const [name, setName] = useState(signal?.name ?? "");
  const [description, setDescription] = useState(signal?.description ?? "");
  const [signalType, setSignalType] = useState(signal?.signal_type ?? "keyword");
  const [config, setConfig] = useState<Record<string, unknown>>(signal?.config ?? {});
  const [weight, setWeight] = useState(signal?.weight ?? 1.0);
  const [maxScore, setMaxScore] = useState(signal?.max_score ?? 10.0);
  const [category, setCategory] = useState(signal?.category ?? "");
  const [isActive, setIsActive] = useState(signal?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        name,
        description: description || null,
        signal_type: signalType,
        config,
        weight,
        max_score: maxScore,
        category: category || null,
        is_active: isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  const renderConfigForm = () => {
    switch (signalType) {
      case "keyword":
        return <KeywordConfig config={config} onChange={setConfig} />;
      case "regex":
        return <RegexConfig config={config} onChange={setConfig} />;
      case "technology":
        return <TechnologyConfig config={config} onChange={setConfig} />;
      case "social_presence":
        return <SocialPresenceConfig config={config} onChange={setConfig} />;
      case "composite":
        return <CompositeConfig config={config} onChange={setConfig} availableSignals={availableSignals} />;
      case "custom_expression":
        return <ExpressionConfig config={config} onChange={setConfig} />;
      case "domain_age":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Operator</Label>
              <select
                className="w-full h-8 rounded border bg-background px-2 text-sm"
                value={(config.operator as string) ?? "greater_than"}
                onChange={(e) => setConfig({ ...config, operator: e.target.value })}
              >
                <option value="greater_than">Greater than</option>
                <option value="less_than">Less than</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Days</Label>
              <Input
                type="number"
                value={(config.value_days as number) ?? 365}
                onChange={(e) => setConfig({ ...config, value_days: Number(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        );
      case "page_metric":
        return (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-xs">Metric</Label>
              <select
                className="w-full h-8 rounded border bg-background px-2 text-sm"
                value={(config.metric as string) ?? "word_count"}
                onChange={(e) => setConfig({ ...config, metric: e.target.value })}
              >
                <option value="word_count">Word Count</option>
                <option value="link_count">Link Count</option>
                <option value="image_count">Image Count</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Operator</Label>
              <select
                className="w-full h-8 rounded border bg-background px-2 text-sm"
                value={(config.operator as string) ?? "greater_than"}
                onChange={(e) => setConfig({ ...config, operator: e.target.value })}
              >
                <option value="greater_than">Greater than</option>
                <option value="less_than">Less than</option>
                <option value="equals">Equals</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Value</Label>
              <Input
                type="number"
                value={(config.value as number) ?? 500}
                onChange={(e) => setConfig({ ...config, value: Number(e.target.value) })}
                className="h-8"
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., SaaS Keywords" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Relevance" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What does this signal measure?" />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={setIsActive} />
              <Label className="text-xs">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Signal Type</CardTitle>
        </CardHeader>
        <CardContent>
          <SignalTypeSelector value={signalType} onChange={(t) => { setSignalType(t); setConfig({}); }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent>{renderConfigForm()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Weight</Label>
              <span className="text-xs font-mono">{weight.toFixed(1)}x</span>
            </div>
            <Slider value={[weight]} min={0} max={5} step={0.1} onValueChange={(val) => setWeight(Array.isArray(val) ? val[0] : val)} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label className="text-xs">Max Score</Label>
              <span className="text-xs font-mono">{maxScore.toFixed(0)}</span>
            </div>
            <Slider value={[maxScore]} min={1} max={100} step={1} onValueChange={(val) => setMaxScore(Array.isArray(val) ? val[0] : val)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="gap-2">
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {signal ? "Update Signal" : "Create Signal"}
        </Button>
      </div>
    </div>
  );
}
