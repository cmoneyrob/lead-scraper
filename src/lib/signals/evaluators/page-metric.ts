import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

type MetricName = 'word_count' | 'link_count' | 'image_count';
type ComparisonOperator = 'greater_than' | 'less_than' | 'equals';

interface PageMetricConfig {
  metric: MetricName;
  operator: ComparisonOperator;
  value: number;
}

const METRIC_FIELDS: Record<MetricName, string> = {
  word_count: 'wordCount',
  link_count: 'linkCount',
  image_count: 'imageCount',
};

function parseConfig(config: Record<string, unknown>): PageMetricConfig {
  return {
    metric: config.metric as MetricName,
    operator: config.operator as ComparisonOperator,
    value: config.value as number,
  };
}

function resolveMetric(
  context: SignalEvaluationContext,
  metric: MetricName
): number | undefined {
  const enrichment = context.lead.enrichment_data;
  if (!enrichment) return undefined;

  const fieldName = METRIC_FIELDS[metric] as keyof typeof enrichment;
  const value = enrichment[fieldName];
  return typeof value === 'number' ? value : undefined;
}

export const PageMetricEvaluator: SignalEvaluator = {
  type: 'page_metric',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const metricValue = resolveMetric(context, cfg.metric);

    if (metricValue === undefined) {
      return {
        matched: false,
        rawScore: 0,
        matchDetails: {
          reason: `Metric "${cfg.metric}" not available`,
          operator: cfg.operator,
          threshold: cfg.value,
        },
      };
    }

    let matched: boolean;
    switch (cfg.operator) {
      case 'greater_than':
        matched = metricValue > cfg.value;
        break;
      case 'less_than':
        matched = metricValue < cfg.value;
        break;
      case 'equals':
        matched = metricValue === cfg.value;
        break;
    }

    return {
      matched,
      rawScore: matched ? 1 : 0,
      matchDetails: {
        metric: cfg.metric,
        actualValue: metricValue,
        operator: cfg.operator,
        threshold: cfg.value,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const validMetrics: MetricName[] = [
      'word_count',
      'link_count',
      'image_count',
    ];
    if (!validMetrics.includes(config.metric as MetricName)) {
      errors.push(
        `metric must be one of: ${validMetrics.join(', ')}`
      );
    }

    const validOperators: ComparisonOperator[] = [
      'greater_than',
      'less_than',
      'equals',
    ];
    if (!validOperators.includes(config.operator as ComparisonOperator)) {
      errors.push(
        `operator must be one of: ${validOperators.join(', ')}`
      );
    }

    if (typeof config.value !== 'number') {
      errors.push('value must be a number');
    }

    return { valid: errors.length === 0, errors };
  },
};
