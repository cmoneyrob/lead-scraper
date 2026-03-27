export type SignalType =
  | 'keyword'
  | 'regex'
  | 'technology'
  | 'social_presence'
  | 'domain_age'
  | 'page_metric'
  | 'composite'
  | 'custom_expression';

export interface EnrichmentData {
  content: string;
  title: string;
  metaDescription: string;
  technologies: string[];
  socialLinks: { platform: string; url: string }[];
  links: string[];
  wordCount: number;
  imageCount: number;
  linkCount: number;
  headers: Record<string, string>;
  domainAge?: number;
}

export interface SignalEvaluationContext {
  lead: {
    id: string;
    company_name: string;
    domain: string | null;
    url: string | null;
    title: string | null;
    description: string | null;
    enrichment_data: EnrichmentData | null;
  };
  priorResults: Map<string, SignalEvaluationResult>;
}

export interface SignalEvaluationResult {
  matched: boolean;
  rawScore: number;
  matchDetails: Record<string, unknown>;
}

export interface SignalDefinition {
  id: string;
  signal_type: SignalType;
  config: Record<string, unknown>;
  weight: number;
  max_score: number;
  is_active: boolean;
}

export interface SignalEvaluator {
  type: SignalType;
  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult;
  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  };
}
