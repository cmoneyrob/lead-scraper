import type {
  SignalEvaluator,
  SignalEvaluationContext,
  SignalEvaluationResult,
} from '../types';

const VALID_PLATFORMS = new Set([
  'linkedin',
  'twitter',
  'github',
  'facebook',
  'instagram',
  'youtube',
]);

interface SocialPresenceConfig {
  platforms: string[];
  match_mode: 'any' | 'all';
}

function parseConfig(config: Record<string, unknown>): SocialPresenceConfig {
  return {
    platforms: config.platforms as string[],
    match_mode: (config.match_mode as 'any' | 'all') ?? 'any',
  };
}

export const SocialPresenceEvaluator: SignalEvaluator = {
  type: 'social_presence',

  evaluate(
    config: Record<string, unknown>,
    context: SignalEvaluationContext
  ): SignalEvaluationResult {
    const cfg = parseConfig(config);
    const socialLinks = context.lead.enrichment_data?.socialLinks ?? [];
    const detectedPlatforms = new Set(
      socialLinks.map((link) => link.platform.toLowerCase())
    );

    const matchedPlatforms: string[] = [];

    for (const platform of cfg.platforms) {
      if (detectedPlatforms.has(platform.toLowerCase())) {
        matchedPlatforms.push(platform);
      }
    }

    const totalRequired = cfg.platforms.length;
    const matchedCount = matchedPlatforms.length;

    const matched =
      cfg.match_mode === 'all'
        ? matchedCount === totalRequired
        : matchedCount > 0;

    const rawScore = totalRequired > 0 ? matchedCount / totalRequired : 0;

    return {
      matched,
      rawScore,
      matchDetails: {
        matchedPlatforms,
        matchedCount,
        totalRequired,
        detectedPlatforms: Array.from(detectedPlatforms),
        matchMode: cfg.match_mode,
      },
    };
  },

  validateConfig(config: Record<string, unknown>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!Array.isArray(config.platforms)) {
      errors.push('platforms must be an array of strings');
    } else if (config.platforms.length === 0) {
      errors.push('platforms array must not be empty');
    } else {
      for (const p of config.platforms) {
        if (typeof p !== 'string') {
          errors.push('all platforms must be strings');
          break;
        }
        if (!VALID_PLATFORMS.has(p.toLowerCase())) {
          errors.push(
            `Invalid platform "${p}". Valid platforms: ${Array.from(VALID_PLATFORMS).join(', ')}`
          );
        }
      }
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
