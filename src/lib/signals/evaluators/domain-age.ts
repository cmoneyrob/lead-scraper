import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

interface DomainAgeConfig {
  operator: 'greater_than' | 'less_than';
  value_days: number;
}

function parseConfig(config: Record<string, unknown>): DomainAgeConfig {
  return {
    operator: config.operator as 'greater_than' | 'less_than',
    value_days: config.value_days as number,
  };
}

export const DomainAgeEvaluator: SignalEvaluator = {
  type: 'domain_age',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const domainAge = context.lead.enrichment_data?.domainAge;

    if (domainAge === undefined || domainAge === null) {
      return {
        matched: false,
        rawScore: 0,
        matchDetails: {
          reason: 'Domain age data not available',
          operator: cfg.operator,
          thresholdDays: cfg.value_days,
        },
      };
    }

    const matched =
      cfg.operator === 'greater_than'
        ? domainAge > cfg.value_days
        : domainAge < cfg.value_days;

    return {
      matched,
      rawScore: matched ? 1 : 0,
      matchDetails: {
        domainAgeDays: domainAge,
        operator: cfg.operator,
        thresholdDays: cfg.value_days,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (
      config.operator !== 'greater_than' &&
      config.operator !== 'less_than'
    ) {
      errors.push('operator must be "greater_than" or "less_than"');
    }

    if (typeof config.value_days !== 'number' || config.value_days < 0) {
      errors.push('value_days must be a non-negative number');
    }

    return { valid: errors.length === 0, errors };
  },
};
