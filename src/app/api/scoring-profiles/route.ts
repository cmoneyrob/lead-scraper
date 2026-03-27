import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface CreateProfileBody {
  name: string;
  description?: string;
  qualification_threshold?: number;
  signal_ids?: string[];
  is_default?: boolean;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  void request;

  const { data: profiles, error } = await supabase
    .from('scoring_profiles')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scoring profiles' }, { status: 500 });
  }

  return NextResponse.json({ profiles }, { status: 200 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: CreateProfileBody;
  try {
    body = await request.json() as CreateProfileBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.name || typeof body.name !== 'string') {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  if (body.is_default) {
    await supabase
      .from('scoring_profiles')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true);
  }

  const { data: profile, error } = await supabase
    .from('scoring_profiles')
    .insert({
      user_id: user.id,
      name: body.name,
      description: body.description ?? null,
      qualification_threshold: body.qualification_threshold ?? 70,
      signal_ids: body.signal_ids ?? [],
      is_default: body.is_default ?? false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to create scoring profile' }, { status: 500 });
  }

  return NextResponse.json({ profile }, { status: 201 });
}
