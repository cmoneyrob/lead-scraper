import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

interface TechnologyConfig {
  technologies: string[];
  match_mode: 'any' | 'all';
}

function parseConfig(config: Record<string, unknown>): TechnologyConfig {
  return {
    technologies: config.technologies as string[],
    match_mode: (config.match_mode as 'any' | 'all') ?? 'any',
  };
}

export const TechnologyEvaluator: SignalEvaluator = {
  type: 'technology',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const detectedTech = context.lead.enrichment_data?.technologies ?? [];
    const normalizedDetected = detectedTech.map((t) => t.toLowerCase());

    const matchedTechnologies: string[] = [];

    for (const tech of cfg.technologies) {
      if (normalizedDetected.includes(tech.toLowerCase())) {
        matchedTechnologies.push(tech);
      }
    }

    const totalRequired = cfg.technologies.length;
    const matchedCount = matchedTechnologies.length;

    const matched =
      cfg.match_mode === 'all'
        ? matchedCount === totalRequired
        : matchedCount > 0;

    const rawScore = totalRequired > 0 ? matchedCount / totalRequired : 0;

    return {
      matched,
      rawScore,
      matchDetails: {
        matchedTechnologies,
        matchedCount,
        totalRequired,
        detectedTechnologies: detectedTech,
        matchMode: cfg.match_mode,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(config.technologies)) {
      errors.push('technologies must be an array of strings');
    } else if (config.technologies.length === 0) {
      errors.push('technologies array must not be empty');
    } else if (
      !config.technologies.every((t: unknown) => typeof t === 'string')
    ) {
      errors.push('all technologies must be strings');
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
