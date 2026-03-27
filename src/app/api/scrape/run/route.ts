import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { BraveSearchClient } from '@/lib/brave/client';
import { parseBraveResults } from '@/lib/brave/parse';
import { fetchUrl } from '@/lib/enrichment/fetcher';
import { parseHtml } from '@/lib/enrichment/parser';
import { buildQueriesFromSignals } from '@/lib/scraper/query-builder';
import { runPipeline } from '@/lib/signals/pipeline';
import type { EnrichmentData } from '@/lib/signals/types';

interface ScrapeRunBody {
  signal_ids: string[];
  scoring_profile_id?: string;
  location?: string;
  count?: number;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: ScrapeRunBody;
  try {
    body = await request.json() as ScrapeRunBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.signal_ids) || body.signal_ids.length === 0) {
    return NextResponse.json({ error: 'signal_ids must be a non-empty array' }, { status: 400 });
  }

  // Fetch the signals
  const { data: signals, error: signalsError } = await supabase
    .from('signal_definitions')
    .select('*')
    .in('id', body.signal_ids)
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (signalsError || !signals || signals.length === 0) {
    return NextResponse.json({ error: 'No active signals found' }, { status: 400 });
  }

  // Get qualification threshold
  let qualificationThreshold = 0.5;
  if (body.scoring_profile_id) {
    const { data: profile } = await supabase
      .from('scoring_profiles')
      .select('qualification_threshold')
      .eq('id', body.scoring_profile_id)
      .eq('user_id', user.id)
      .single();
    if (profile) {
      qualificationThreshold = profile.qualification_threshold / 100;
    }
  }

  // Build queries from signals
  const generatedQueries = buildQueriesFromSignals({
    signals,
    location: body.location,
    count: body.count ?? 20,
  });

  const queryText = generatedQueries.map(q => q.query).join(' | ');

  // Create scrape job record
  const { data: job, error: jobError } = await supabase
    .from('scrape_jobs')
    .insert({
      user_id: user.id,
      signal_ids: body.signal_ids,
      scoring_profile_id: body.scoring_profile_id ?? null,
      status: 'searching',
      query_generated: queryText,
      location: body.location ?? null,
      search_params: {
        count: body.count ?? 20,
        queries: generatedQueries,
      },
      log: [{ step: 'started', time: new Date().toISOString(), message: `Generated ${generatedQueries.length} search queries from ${signals.length} signals` }],
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: 'Failed to create scrape job' }, { status: 500 });
  }

  // Run the pipeline (non-blocking response — start processing)
  // We'll do it inline for now and return results when done
  try {
    const braveClient = new BraveSearchClient();
    const allParsedResults: Array<{
      company_name: string;
      domain: string | null;
      url: string;
      title: string | null;
      description: string | null;
      raw_search_result: unknown;
    }> = [];

    // Phase 1: Search
    const searchCount = Math.min(body.count ?? 20, 20);
    for (const genQuery of generatedQueries) {
      try {
        const response = await braveClient.webSearch({
          q: genQuery.query,
          count: searchCount,
        });
        const webResults = response.web?.results ?? [];
        const parsed = parseBraveResults(webResults);
        allParsedResults.push(...parsed);
      } catch {
        // Log search error but continue with other queries
      }
    }

    // Deduplicate by domain
    const seenDomains = new Set<string>();
    const uniqueResults = allParsedResults.filter(r => {
      if (!r.domain || seenDomains.has(r.domain)) return false;
      seenDomains.add(r.domain);
      return true;
    });

    await appendLog(supabase, job.id, 'searched', `Found ${uniqueResults.length} unique results from ${allParsedResults.length} total`);
    await supabase.from('scrape_jobs').update({
      status: 'scraping',
      results_found: uniqueResults.length,
    }).eq('id', job.id);

    // Phase 2: Create leads and deep scrape each one
    const createdLeads: Array<{ id: string; url: string | null }> = [];

    for (const result of uniqueResults) {
      const { data: lead } = await supabase
        .from('leads')
        .insert({
          user_id: user.id,
          company_name: result.company_name,
          domain: result.domain,
          url: result.url,
          title: result.title,
          description: result.description,
          raw_search_result: result.raw_search_result as Record<string, unknown>,
          status: 'new',
          pipeline_stage: 'discovery',
        })
        .select('id, url')
        .single();

      if (lead) {
        createdLeads.push(lead);
      }
    }

    await appendLog(supabase, job.id, 'leads_created', `Created ${createdLeads.length} leads`);
    await supabase.from('scrape_jobs').update({
      leads_created: createdLeads.length,
    }).eq('id', job.id);

    // Phase 3: Deep scrape — fetch each site and enrich
    let scrapedCount = 0;
    for (const lead of createdLeads) {
      if (!lead.url) continue;
      try {
        const fetchResult = await fetchUrl(lead.url, { timeout: 15000 });
        const enrichmentData = parseHtml(fetchResult.html, lead.url, fetchResult.statusCode, fetchResult.headers);

        // Auto-populate contact fields from deep scrape
        const contactUpdate: Record<string, unknown> = {
          enrichment_data: enrichmentData as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        };

        if (enrichmentData.contacts) {
          if (enrichmentData.contacts.emails.length > 0) {
            contactUpdate.contact_email = enrichmentData.contacts.emails[0];
          }
          if (enrichmentData.contacts.phones.length > 0) {
            contactUpdate.contact_phone = enrichmentData.contacts.phones[0];
          }
        }

        await supabase.from('leads').update(contactUpdate).eq('id', lead.id);
        scrapedCount++;
      } catch {
        // Site unreachable, skip enrichment
      }
    }

    await appendLog(supabase, job.id, 'scraped', `Deep scraped ${scrapedCount} of ${createdLeads.length} sites`);
    await supabase.from('scrape_jobs').update({
      status: 'scoring',
      leads_scraped: scrapedCount,
    }).eq('id', job.id);

    // Phase 4: Score all leads with the signals
    let qualifiedCount = 0;
    const leadIds = createdLeads.map(l => l.id);

    if (leadIds.length > 0) {
      const { data: enrichedLeads } = await supabase
        .from('leads')
        .select('*')
        .in('id', leadIds)
        .eq('user_id', user.id);

      if (enrichedLeads) {
        for (const lead of enrichedLeads) {
          const pipelineResult = runPipeline(
            {
              id: lead.id,
              company_name: lead.company_name,
              domain: lead.domain,
              url: lead.url,
              title: lead.title,
              description: lead.description,
              enrichment_data: lead.enrichment_data as EnrichmentData | null,
            },
            signals,
            qualificationThreshold
          );

          // Save signal results
          for (const score of pipelineResult.scores) {
            await supabase.from('signal_results').upsert({
              lead_id: lead.id,
              signal_definition_id: score.signalId,
              matched: score.result.matched,
              raw_score: score.result.rawScore,
              weighted_score: score.weightedScore,
              match_details: score.result.matchDetails,
              evaluated_at: new Date().toISOString(),
            }, { onConflict: 'lead_id,signal_definition_id' });
          }

          // Update lead score
          await supabase.from('leads').update({
            total_score: pipelineResult.totalScore,
            qualified: pipelineResult.qualified,
            qualification_threshold: qualificationThreshold * 100,
            last_scored_at: new Date().toISOString(),
            pipeline_stage: pipelineResult.qualified ? 'research' : 'discovery',
          }).eq('id', lead.id);

          if (pipelineResult.qualified) qualifiedCount++;
        }
      }
    }

    await appendLog(supabase, job.id, 'scored', `Scored ${leadIds.length} leads, ${qualifiedCount} qualified`);

    // Complete the job
    await supabase.from('scrape_jobs').update({
      status: 'completed',
      leads_qualified: qualifiedCount,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    // Fetch final job state
    const { data: finalJob } = await supabase
      .from('scrape_jobs')
      .select('*')
      .eq('id', job.id)
      .single();

    return NextResponse.json({
      job: finalJob,
      summary: {
        queries_run: generatedQueries.length,
        results_found: uniqueResults.length,
        leads_created: createdLeads.length,
        leads_scraped: scrapedCount,
        leads_qualified: qualifiedCount,
      },
    }, { status: 200 });

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Scrape failed';
    await supabase.from('scrape_jobs').update({
      status: 'failed',
      error_message: message,
      completed_at: new Date().toISOString(),
    }).eq('id', job.id);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function appendLog(
  supabase: Awaited<ReturnType<typeof createClient>>,
  jobId: string,
  step: string,
  message: string,
) {
  const { data: job } = await supabase.from('scrape_jobs').select('log').eq('id', jobId).single();
  const log = Array.isArray(job?.log) ? job.log : [];
  log.push({ step, time: new Date().toISOString(), message });
  await supabase.from('scrape_jobs').update({ log }).eq('id', jobId);
}
