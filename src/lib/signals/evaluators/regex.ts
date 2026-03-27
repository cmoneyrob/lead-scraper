import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

interface RegexConfig {
  pattern: string;
  flags: string;
  field: string;
}

function resolveField(context: SignalEvaluationContext, field: string): string {
  const leadFields: Record<string, string | null | undefined> = {
    company_name: context.lead.company_name,
    domain: context.lead.domain,
    url: context.lead.url,
    title: context.lead.title,
    description: context.lead.description,
  };

  if (field in leadFields) {
    return leadFields[field] ?? '';
  }

  const enrichment = context.lead.enrichment_data;
  if (!enrichment) return '';

  const enrichmentFields: Record<string, string | undefined> = {
    content: enrichment.content,
    'enrichment.title': enrichment.title,
    'enrichment.metaDescription': enrichment.metaDescription,
  };

  return enrichmentFields[field] ?? '';
}

function parseConfig(config: Record<string, unknown>): RegexConfig {
  return {
    pattern: config.pattern as string,
    flags: (config.flags as string) ?? '',
    field: config.field as string,
  };
}

export const RegexEvaluator: SignalEvaluator = {
  type: 'regex',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const fieldValue = resolveField(context, cfg.field);

    let regex: RegExp;
    try {
      const flags = cfg.flags.includes('g') ? cfg.flags : cfg.flags + 'g';
      regex = new RegExp(cfg.pattern, flags);
    } catch {
      return {
        matched: false,
        rawScore: 0,
        matchDetails: { error: `Invalid regex pattern: ${cfg.pattern}` },
      };
    }

    const matches: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(fieldValue)) !== null) {
      matches.push(match[0]);
      if (matches.length > 100) break; // safety limit
    }

    const matchCount = matches.length;
    let rawScore = 0;
    if (matchCount === 1) rawScore = 0.5;
    else if (matchCount >= 2) rawScore = 1;

    return {
      matched: matchCount > 0,
      rawScore,
      matchDetails: {
        matches,
        matchCount,
        pattern: cfg.pattern,
        field: cfg.field,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof config.pattern !== 'string' || config.pattern.length === 0) {
      errors.push('pattern must be a non-empty string');
    } else {
      try {
        new RegExp(config.pattern as string, (config.flags as string) ?? '');
      } catch {
        errors.push(`Invalid regex pattern: ${config.pattern}`);
      }
    }

    if (config.flags !== undefined && typeof config.flags !== 'string') {
      errors.push('flags must be a string');
    }

    if (typeof config.field !== 'string' || config.field.length === 0) {
      errors.push('field must be a non-empty string');
    }

    return { valid: errors.length === 0, errors };
  },
};
