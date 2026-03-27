/**
 * Converts signal definitions into Brave Search queries.
 * This is the core of signal-driven scraping — signals define
 * what you're looking for, and this module figures out how to search for it.
 */

interface SignalConfig {
  id: string;
  name: string;
  signal_type: string;
  config: Record<string, unknown>;
  category?: string | null;
}

export interface ScrapeQueryParams {
  signals: SignalConfig[];
  location?: string;
  count?: number;
}

export interface GeneratedQuery {
  query: string;
  description: string;
  source_signals: string[];
}

const TECHNOLOGY_SEARCH_HINTS: Record<string, string[]> = {
  react: ['React developer', 'React website'],
  'next.js': ['Next.js', 'Vercel deployed'],
  vue: ['Vue.js website'],
  angular: ['Angular application'],
  wordpress: ['WordPress site', 'powered by WordPress'],
  shopify: ['Shopify store', 'powered by Shopify'],
  wix: ['Wix website'],
  squarespace: ['Squarespace site'],
  'google analytics': ['small business website'],
  hubspot: ['HubSpot CRM', 'inbound marketing'],
  salesforce: ['Salesforce CRM'],
  stripe: ['online payments', 'e-commerce'],
  bootstrap: ['small business website'],
  tailwind: ['modern web application'],
  jquery: ['legacy website', 'outdated website technology'],
  php: ['PHP website'],
  'node.js': ['Node.js application'],
  python: ['Python web application'],
  ruby: ['Ruby on Rails'],
  aws: ['AWS hosted', 'Amazon Web Services'],
  cloudflare: ['Cloudflare protected'],
};

/**
 * Build search queries from signal definitions.
 * Each signal type contributes differently to the search strategy.
 */
export function buildQueriesFromSignals(params: ScrapeQueryParams): GeneratedQuery[] {
  const queries: GeneratedQuery[] = [];
  const keywordGroups: Map<string, { keywords: string[]; signalIds: string[] }> = new Map();
  const techTerms: string[] = [];
  const techSignalIds: string[] = [];
  const socialTerms: string[] = [];
  const socialSignalIds: string[] = [];

  for (const signal of params.signals) {
    switch (signal.signal_type) {
      case 'keyword': {
        const keywords = signal.config.keywords as string[] | undefined;
        if (keywords && keywords.length > 0) {
          const field = (signal.config.field as string) || 'content';
          const key = `${field}:${signal.config.match_mode ?? 'any'}`;
          const existing = keywordGroups.get(key);
          if (existing) {
            existing.keywords.push(...keywords);
            existing.signalIds.push(signal.id);
          } else {
            keywordGroups.set(key, { keywords: [...keywords], signalIds: [signal.id] });
          }
        }
        break;
      }
      case 'technology': {
        const technologies = signal.config.technologies as string[] | undefined;
        if (technologies) {
          techSignalIds.push(signal.id);
          for (const tech of technologies) {
            const hints = TECHNOLOGY_SEARCH_HINTS[tech.toLowerCase()];
            if (hints) {
              techTerms.push(...hints.slice(0, 1));
            } else {
              techTerms.push(tech);
            }
          }
        }
        break;
      }
      case 'social_presence': {
        const platforms = signal.config.platforms as string[] | undefined;
        if (platforms) {
          socialSignalIds.push(signal.id);
          for (const platform of platforms) {
            if (platform === 'linkedin') socialTerms.push('site:linkedin.com/company');
            else if (platform === 'twitter') socialTerms.push('twitter OR x.com');
          }
        }
        break;
      }
      case 'regex': {
        const pattern = signal.config.pattern as string | undefined;
        if (pattern) {
          // Extract meaningful words from regex for search
          const words = pattern.replace(/[\\.*+?^${}()|[\]]/g, ' ').trim().split(/\s+/).filter(w => w.length > 2);
          if (words.length > 0) {
            const key = `regex`;
            const existing = keywordGroups.get(key);
            if (existing) {
              existing.keywords.push(...words);
              existing.signalIds.push(signal.id);
            } else {
              keywordGroups.set(key, { keywords: words, signalIds: [signal.id] });
            }
          }
        }
        break;
      }
      case 'domain_age': {
        const operator = signal.config.operator as string;
        const days = signal.config.value_days as number;
        if (operator === 'less_than' && days < 365) {
          queries.push({
            query: `new business${params.location ? ` ${params.location}` : ''} recently launched website`,
            description: `Finding new businesses (domain age < ${days} days)`,
            source_signals: [signal.id],
          });
        } else if (operator === 'greater_than' && days > 3650) {
          queries.push({
            query: `established business${params.location ? ` ${params.location}` : ''} company website`,
            description: `Finding established businesses (domain age > ${Math.round(days / 365)} years)`,
            source_signals: [signal.id],
          });
        }
        break;
      }
      case 'page_metric': {
        const metric = signal.config.metric as string;
        const op = signal.config.operator as string;
        const value = signal.config.value as number;
        if (metric === 'word_count' && op === 'less_than' && value < 200) {
          queries.push({
            query: `small business${params.location ? ` ${params.location}` : ''} basic website`,
            description: 'Finding businesses with minimal web presence (low word count)',
            source_signals: [signal.id],
          });
        }
        break;
      }
    }
  }

  // Build keyword-based queries
  for (const [, group] of keywordGroups) {
    const uniqueKeywords = [...new Set(group.keywords)];
    // Chunk keywords into groups of 5 to avoid overly long queries
    for (let i = 0; i < uniqueKeywords.length; i += 5) {
      const chunk = uniqueKeywords.slice(i, i + 5);
      const queryTerms = chunk.map(k => k.includes(' ') ? `"${k}"` : k);
      const locationPart = params.location ? ` ${params.location}` : '';
      queries.push({
        query: `${queryTerms.join(' OR ')}${locationPart}`,
        description: `Keyword search: ${chunk.join(', ')}`,
        source_signals: group.signalIds,
      });
    }
  }

  // Build tech-based queries
  if (techTerms.length > 0) {
    const uniqueTech = [...new Set(techTerms)];
    const locationPart = params.location ? ` ${params.location}` : '';
    queries.push({
      query: `${uniqueTech.map(t => `"${t}"`).join(' OR ')}${locationPart}`,
      description: `Technology detection: ${uniqueTech.join(', ')}`,
      source_signals: techSignalIds,
    });
  }

  // If no queries were generated, create a broad one
  if (queries.length === 0) {
    const locationPart = params.location ? ` ${params.location}` : '';
    queries.push({
      query: `business company${locationPart}`,
      description: 'Broad business search (no specific signal criteria)',
      source_signals: params.signals.map(s => s.id),
    });
  }

  return queries;
}
