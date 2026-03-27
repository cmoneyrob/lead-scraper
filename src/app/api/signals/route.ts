import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { SignalType } from '@/types/database';

interface CreateSignalBody {
  name: string;
  description?: string;
  signal_type: SignalType;
  config: Record<string, unknown>;
  weight?: number;
  max_score?: number;
  category?: string;
  sort_order?: number;
  is_active?: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  void request;

  const { data: signals, error } = await supabase
    .from('signal_definitions')
    .select('*')
    .eq('user_id', user.id)
    .order('sort_order', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch signals' }, { status: 500 });
  }

  return NextResponse.json({ signals }, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateSignalBody;
  try {
    body = await request.json() as CreateSignalBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (!body.signal_type) {
    return NextResponse.json({ error: 'signal_type is required' }, { status: 400 });
  }

  if (!body.config || typeof body.config !== 'object') {
    return NextResponse.json({ error: 'config is required and must be an object' }, { status: 400 });
  }

  const { data: signal, error } = await supabase
    .from('signal_definitions')
    .insert({
      user_id: user.id,
      name: body.name,
      description: body.description ?? null,
      signal_type: body.signal_type,
      config: body.config,
      weight: body.weight ?? 1,
      max_score: body.max_score ?? 10,
      category: body.category ?? null,
      sort_order: body.sort_order ?? 0,
      is_active: body.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create signal' }, { status: 500 });
  }

  return NextResponse.json({ signal }, { status: 201 });
}
