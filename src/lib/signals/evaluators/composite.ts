import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

type CompositeOperator = 'all_of' | 'any_of' | 'weighted_average';

interface CompositeConfig {
  signal_ids: string[];
  operator: CompositeOperator;
  weights?: number[];
}

function parseConfig(config: Record<string, unknown>): CompositeConfig {
  return {
    signal_ids: config.signal_ids as string[],
    operator: config.operator as CompositeOperator,
    weights: config.weights as number[] | undefined,
  };
}

export const CompositeEvaluator: SignalEvaluator = {
  type: 'composite',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const results: { signalId: string; result: SignalEvaluationResult | null }[] = [];

    for (const signalId of cfg.signal_ids) {
      const prior = context.priorResults.get(signalId) ?? null;
      results.push({ signalId, result: prior });
    }

    const availableResults = results.filter(
      (r): r is { signalId: string; result: SignalEvaluationResult } =>
        r.result !== null
    );

    if (availableResults.length === 0) {
      return {
        matched: false,
        rawScore: 0,
        matchDetails: {
          reason: 'No prior signal results available',
          requestedSignals: cfg.signal_ids,
        },
      };
    }

    let matched: boolean;
    let rawScore: number;

    switch (cfg.operator) {
      case 'all_of': {
        matched = availableResults.every((r) => r.result.matched);
        const sum = availableResults.reduce(
          (acc, r) => acc + r.result.rawScore,
          0
        );
        rawScore = availableResults.length > 0 ? sum / availableResults.length : 0;
        break;
      }

      case 'any_of': {
        matched = availableResults.some((r) => r.result.matched);
        const maxScore = availableResults.reduce(
          (max, r) => Math.max(max, r.result.rawScore),
          0
        );
        rawScore = maxScore;
        break;
      }

      case 'weighted_average': {
        const weights = cfg.weights ?? availableResults.map(() => 1);
        let weightedSum = 0;
        let totalWeight = 0;

        for (let i = 0; i < availableResults.length; i++) {
          const weight = weights[i] ?? 1;
          weightedSum += availableResults[i].result.rawScore * weight;
          totalWeight += weight;
        }

        rawScore = totalWeight > 0 ? weightedSum / totalWeight : 0;
        matched = rawScore > 0;
        break;
      }
    }

    const signalResults: Record<string, { matched: boolean; rawScore: number }> = {};
    for (const r of results) {
      signalResults[r.signalId] = r.result
        ? { matched: r.result.matched, rawScore: r.result.rawScore }
        : { matched: false, rawScore: 0 };
    }

    return {
      matched,
      rawScore,
      matchDetails: {
        operator: cfg.operator,
        signalResults,
        availableCount: availableResults.length,
        totalRequested: cfg.signal_ids.length,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(config.signal_ids)) {
      errors.push('signal_ids must be an array of strings');
    } else if (config.signal_ids.length === 0) {
      errors.push('signal_ids array must not be empty');
    } else if (
      !config.signal_ids.every((id: unknown) => typeof id === 'string')
    ) {
      errors.push('all signal_ids must be strings');
    }

    const validOperators: CompositeOperator[] = [
      'all_of',
      'any_of',
      'weighted_average',
    ];
    if (!validOperators.includes(config.operator as CompositeOperator)) {
      errors.push(
        `operator must be one of: ${validOperators.join(', ')}`
      );
    }

    if (config.weights !== undefined) {
      if (!Array.isArray(config.weights)) {
        errors.push('weights must be an array of numbers');
      } else if (
        !config.weights.every((w: unknown) => typeof w === 'number' && w >= 0)
      ) {
        errors.push('all weights must be non-negative numbers');
      } else if (
        Array.isArray(config.signal_ids) &&
        config.weights.length !== config.signal_ids.length
      ) {
        errors.push('weights array must have the same length as signal_ids');
      }
    }

    return { valid: errors.length === 0, errors };
  },
};
