"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ExpressionConfigProps {
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}

export function ExpressionConfig({ config, onChange }: ExpressionConfigProps) {
  const expression = (config.expression as string) ?? "";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Expression</Label>
        <Textarea
          value={expression}
          onChange={(e) => onChange({ ...config, expression: e.target.value })}
          rows={6}
          placeholder={`e.g., (keyword_hits * 10) + (has_linkedin ? 20 : 0)`}
          className="font-mono text-sm"
        />
      </div>

      <div className="rounded-md border p-3 space-y-2">
        <p className="text-xs font-medium">Available Variables</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <code>lead.domain</code>
          <code>lead.company_name</code>
          <code>lead.total_score</code>
          <code>enrichment.wordCount</code>
          <code>enrichment.linkCount</code>
          <code>enrichment.imageCount</code>
          <code>enrichment.technologies</code>
          <code>signals.&lt;name&gt;.score</code>
          <code>signals.&lt;name&gt;.matched</code>
        </div>
        <p className="text-xs font-medium mt-2">Built-in Functions</p>
        <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
          <code>len(str)</code>
          <code>lower(str)</code>
          <code>upper(str)</code>
          <code>includes(str, substr)</code>
          <code>abs(num)</code>
          <code>min(a, b)</code>
          <code>max(a, b)</code>
        </div>
        <p className="text-xs font-medium mt-2">Operators</p>
        <p className="text-xs text-muted-foreground">
          + - * / {'>'} {'<'} {'>'}= {'<'}= == != && || ? :
        </p>
      </div>
    </div>
  );
}
