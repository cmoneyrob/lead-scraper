import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';
import { parse } from '../expression/parser';
import { evaluateExpression } from '../expression/evaluator';

interface CustomExpressionConfig {
  expression: string;
}

function buildVariables(context: SignalEvaluationContext): Record<string, unknown> {
  const variables: Record<string, unknown> = {
    lead: {
      id: context.lead.id,
      company_name: context.lead.company_name,
      domain: context.lead.domain ?? '',
      url: context.lead.url ?? '',
      title: context.lead.title ?? '',
      description: context.lead.description ?? '',
    },
  };

  const enrichment = context.lead.enrichment_data;
  if (enrichment) {
    (variables.lead as Record<string, unknown>).content = enrichment.content;
    (variables.lead as Record<string, unknown>).wordCount = enrichment.wordCount;
    (variables.lead as Record<string, unknown>).imageCount = enrichment.imageCount;
    (variables.lead as Record<string, unknown>).linkCount = enrichment.linkCount;
    (variables.lead as Record<string, unknown>).domainAge = enrichment.domainAge ?? 0;
    (variables.lead as Record<string, unknown>).techCount = enrichment.technologies.length;
    (variables.lead as Record<string, unknown>).socialCount = enrichment.socialLinks.length;
    (variables.lead as Record<string, unknown>).metaDescription = enrichment.metaDescription;
  }

  const signals: Record<string, unknown> = {};
  context.priorResults.forEach((result, signalId) => {
    signals[signalId] = {
      matched: result.matched,
      score: result.rawScore,
    };
  });
  variables.signals = signals;

  return variables;
}

export const CustomExpressionEvaluator: SignalEvaluator = {
  type: 'custom_expression',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = config as unknown as CustomExpressionConfig;
    const variables = buildVariables(context);

    try {
      const ast = parse(cfg.expression);
      const result = evaluateExpression(ast, variables);

      return {
        matched: result > 0,
        rawScore: Math.max(0, Math.min(1, result)),
        matchDetails: {
          expression: cfg.expression,
          computedValue: result,
        },
      };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown expression error';
      return {
        matched: false,
        rawScore: 0,
        matchDetails: {
          expression: cfg.expression,
          error: message,
        },
      };
    }
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (typeof config.expression !== 'string' || config.expression.length === 0) {
      errors.push('expression must be a non-empty string');
      return { valid: false, errors };
    }

    try {
      parse(config.expression as string);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Unknown parse error';
      errors.push(`Invalid expression: ${message}`);
    }

    return { valid: errors.length === 0, errors };
  },
};
