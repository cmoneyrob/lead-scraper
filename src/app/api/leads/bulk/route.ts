import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { LeadStatus, PipelineStage } from '@/types/database';

type BulkAction = 'delete' | 'update_status' | 'update_stage' | 'add_tag' | 'remove_tag' | 'rescore';

interface BulkBody {
  lead_ids: string[];
  action: BulkAction;
  payload?: {
    status?: LeadStatus;
    pipeline_stage?: PipelineStage;
    tag_id?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: BulkBody;
  try {
    body = await request.json() as BulkBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!Array.isArray(body.lead_ids) || body.lead_ids.length === 0) {
    return NextResponse.json({ error: 'lead_ids must be a non-empty array' }, { status: 400 });
  }

  if (!body.action) {
    return NextResponse.json({ error: 'action is required' }, { status: 400 });
  }

  const { data: ownedLeads, error: fetchError } = await supabase
    .from('leads')
    .select('id')
    .in('id', body.lead_ids)
    .eq('user_id', user.id);

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to verify lead ownership' }, { status: 500 });
  }

  const ownedIds = new Set(ownedLeads?.map((l) => l.id) ?? []);
  const validIds = body.lead_ids.filter((id) => ownedIds.has(id));

  if (validIds.length === 0) {
    return NextResponse.json({ error: 'No valid leads found' }, { status: 404 });
  }

  switch (body.action) {
    case 'delete': {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', validIds);
      if (error) {
        return NextResponse.json({ error: 'Failed to delete leads' }, { status: 500 });
      }
      return NextResponse.json({ affected: validIds.length, action: 'delete' }, { status: 200 });
    }

    case 'update_status': {
      if (!body.payload?.status) {
        return NextResponse.json({ error: 'payload.status is required for update_status' }, { status: 400 });
      }
      const { error } = await supabase
        .from('leads')
        .update({ status: body.payload.status, updated_at: new Date().toISOString() })
        .in('id', validIds);
      if (error) {
        return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 });
      }
      return NextResponse.json({ affected: validIds.length, action: 'update_status' }, { status: 200 });
    }

    case 'update_stage': {
      if (!body.payload?.pipeline_stage) {
        return NextResponse.json({ error: 'payload.pipeline_stage is required for update_stage' }, { status: 400 });
      }
      const { error } = await supabase
        .from('leads')
        .update({ pipeline_stage: body.payload.pipeline_stage, updated_at: new Date().toISOString() })
        .in('id', validIds);
      if (error) {
        return NextResponse.json({ error: 'Failed to update pipeline stage' }, { status: 500 });
      }
      return NextResponse.json({ affected: validIds.length, action: 'update_stage' }, { status: 200 });
    }

    case 'add_tag': {
      if (!body.payload?.tag_id) {
        return NextResponse.json({ error: 'payload.tag_id is required for add_tag' }, { status: 400 });
      }
      const tagInserts = validIds.map((leadId) => ({
        lead_id: leadId,
        tag_id: body.payload!.tag_id!,
      }));
      const { error } = await supabase
        .from('lead_tags')
        .upsert(tagInserts, { onConflict: 'lead_id,tag_id' });
      if (error) {
        return NextResponse.json({ error: 'Failed to add tag to leads' }, { status: 500 });
      }
      return NextResponse.json({ affected: validIds.length, action: 'add_tag' }, { status: 200 });
    }

    case 'remove_tag': {
      if (!body.payload?.tag_id) {
        return NextResponse.json({ error: 'payload.tag_id is required for remove_tag' }, { status: 400 });
      }
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .in('lead_id', validIds)
        .eq('tag_id', body.payload.tag_id);
      if (error) {
        return NextResponse.json({ error: 'Failed to remove tag from leads' }, { status: 500 });
      }
      return NextResponse.json({ affected: validIds.length, action: 'remove_tag' }, { status: 200 });
    }

    case 'rescore': {
      const { data: signals } = await supabase
        .from('signal_definitions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (!signals || signals.length === 0) {
        return NextResponse.json({ error: 'No active signals found' }, { status: 400 });
      }

      return NextResponse.json({
        affected: validIds.length,
        action: 'rescore',
        message: 'Use POST /api/signals/evaluate for full scoring pipeline',
      }, { status: 200 });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  }
}
