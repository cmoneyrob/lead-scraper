import type {
  SignalDefinition,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from './types';
import { getEvaluator } from './registry';

export interface SignalScore {
  signalId: string;
  signalType: string;
  result: SignalEvaluationResult;
  weightedScore: number;
}

export interface PipelineResult {
  scores: SignalScore[];
  totalScore: number;
  maxPossibleScore: number;
  normalizedScore: number;
  qualified: boolean;
}

interface TopologicalNode {
  signal: SignalDefinition;
  dependencies: Set<string>;
}

function extractDependencies(signal: SignalDefinition): Set<string> {
  if (signal.signal_type === 'composite') {
    const signalIds = signal.config.signal_ids;
    if (Array.isArray(signalIds)) {
      return new Set(signalIds as string[]);
    }
  }
  return new Set();
}

function topologicalSort(signals: SignalDefinition[]): SignalDefinition[] {
  const signalMap = new Map<string, TopologicalNode>();

  for (const signal of signals) {
    signalMap.set(signal.id, {
      signal,
      dependencies: extractDependencies(signal),
    });
  }

  const sorted: SignalDefinition[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(id: string): void {
    if (visited.has(id)) return;

    if (visiting.has(id)) {
      throw new Error(`Circular dependency detected involving signal: ${id}`);
    }

    const node = signalMap.get(id);
    if (!node) return;

    visiting.add(id);

    node.dependencies.forEach((depId) => {
      visit(depId);
    });

    visiting.delete(id);
    visited.add(id);
    sorted.push(node.signal);
  }

  for (const signal of signals) {
    visit(signal.id);
  }

  return sorted;
}

export function runPipeline(
  lead: SignalEvaluationContext['lead'],
  signals: SignalDefinition[],
  qualificationThreshold: number = 0.5
): PipelineResult {
  const activeSignals = signals.filter((s) => s.is_active);
  const sortedSignals = topologicalSort(activeSignals);

  const priorResults = new Map<string, SignalEvaluationResult>();
  const scores: SignalScore[] = [];
  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const signal of sortedSignals) {
    const evaluator = getEvaluator(signal.signal_type);
    const context: SignalEvaluationContext = { lead, priorResults };
    const result = evaluator.evaluate(signal.config, context);

    const weightedScore = result.rawScore * signal.weight * signal.max_score;
    totalScore += weightedScore;
    maxPossibleScore += signal.weight * signal.max_score;

    priorResults.set(signal.id, result);
    scores.push({
      signalId: signal.id,
      signalType: signal.signal_type,
      result,
      weightedScore,
    });
  }

  const normalizedScore =
    maxPossibleScore > 0 ? totalScore / maxPossibleScore : 0;

  return {
    scores,
    totalScore,
    maxPossibleScore,
    normalizedScore,
    qualified: normalizedScore >= qualificationThreshold,
  };
}
