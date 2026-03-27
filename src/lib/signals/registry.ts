import type { SignalType, SignalEvaluator } from './types';
import { KeywordEvaluator } from './evaluators/keyword';
import { RegexEvaluator } from './evaluators/regex';
import { TechnologyEvaluator } from './evaluators/technology';
import { SocialPresenceEvaluator } from './evaluators/social-presence';
import { DomainAgeEvaluator } from './evaluators/domain-age';
import { PageMetricEvaluator } from './evaluators/page-metric';
import { CompositeEvaluator } from './evaluators/composite';
import { CustomExpressionEvaluator } from './evaluators/custom-expression';

const evaluatorRegistry: ReadonlyMap<SignalType, SignalEvaluator> = new Map<
  SignalType,
  SignalEvaluator
>([
  ['keyword', KeywordEvaluator],
  ['regex', RegexEvaluator],
  ['technology', TechnologyEvaluator],
  ['social_presence', SocialPresenceEvaluator],
  ['domain_age', DomainAgeEvaluator],
  ['page_metric', PageMetricEvaluator],
  ['composite', CompositeEvaluator],
  ['custom_expression', CustomExpressionEvaluator],
]);

export function getEvaluator(type: SignalType): SignalEvaluator {
  const evaluator = evaluatorRegistry.get(type);
  if (!evaluator) {
    throw new Error(`No evaluator registered for signal type: ${type}`);
  }
  return evaluator;
}

export function getRegisteredTypes(): SignalType[] {
  return Array.from(evaluatorRegistry.keys());
}
