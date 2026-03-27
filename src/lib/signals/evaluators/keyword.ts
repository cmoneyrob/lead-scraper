import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

interface KeywordConfig {
  keywords: string[];
  field: string;
  case_sensitive: boolean;
  match_mode: 'any' | 'all';
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

function parseConfig(config: Record<string, unknown>): KeywordConfig {
  return {
    keywords: config.keywords as string[],
    field: config.field as string,
    case_sensitive: (config.case_sensitive as boolean) ?? false,
    match_mode: (config.match_mode as 'any' | 'all') ?? 'any',
  };
}

export const KeywordEvaluator: SignalEvaluator = {
  type: 'keyword',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const fieldValue = resolveField(context, cfg.field);

    const searchText = cfg.case_sensitive ? fieldValue : fieldValue.toLowerCase();
    const matchedKeywords: Record<string, number> = {};

    for (const keyword of cfg.keywords) {
      const searchKeyword = cfg.case_sensitive ? keyword : keyword.toLowerCase();
      let count = 0;
      let startIdx = 0;

      while (true) {
        const idx = searchText.indexOf(searchKeyword, startIdx);
        if (idx === -1) break;
        count++;
        startIdx = idx + 1;
      }

      if (count > 0) {
        matchedKeywords[keyword] = count;
      }
    }

    const matchedCount = Object.keys(matchedKeywords).length;
    const totalKeywords = cfg.keywords.length;

    const matched =
      cfg.match_mode === 'all'
        ? matchedCount === totalKeywords
        : matchedCount > 0;

    const rawScore = totalKeywords > 0 ? matchedCount / totalKeywords : 0;

    return {
      matched,
      rawScore,
      matchDetails: {
        matchedKeywords,
        matchedCount,
        totalKeywords,
        field: cfg.field,
        matchMode: cfg.match_mode,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(config.keywords)) {
      errors.push('keywords must be an array of strings');
    } else if (config.keywords.length === 0) {
      errors.push('keywords array must not be empty');
    } else if (!config.keywords.every((k: unknown) => typeof k === 'string')) {
      errors.push('all keywords must be strings');
    }

    if (typeof config.field !== 'string' || config.field.length === 0) {
      errors.push('field must be a non-empty string');
    }

    if (
      config.case_sensitive !== undefined &&
      typeof config.case_sensitive !== 'boolean'
    ) {
      errors.push('case_sensitive must be a boolean');
    }

    if (
      config.match_mode !== undefined &&
      config.match_mode !== 'any' &&
      config.match_mode !== 'all'
    ) {
      errors.push('match_mode must be "any" or "all"');
    }

    return { valid: errors.length === 0, errors };
  },
};
