/**
 * GET /api/history
 *
 * Query params (all optional):
 *   - diseaseContext: filter by disease_context
 *   - limit: max rows (default 50, cap 200)
 *
 * Returns a list of past agent runs (metadata only, not the full artifacts).
 * Used by the History page to render the list view.
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../src/lib/supabase.js';

export async function GET(request) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured on server', runs: [] },
      { status: 503 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const diseaseContext = searchParams.get('diseaseContext');
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10);
    const limit = Math.min(Math.max(limitRaw, 1), 200);

    let query = supabase
      .from('agent_runs')
      .select('id, run_id, disease_context, query, status, parent_run_id, parsed_query, started_at, completed_at, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (diseaseContext) {
      query = query.eq('disease_context', diseaseContext);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      runs: data || [],
      count: (data || []).length,
      filter: { diseaseContext: diseaseContext || null, limit },
    });
  } catch (err) {
    console.error('History API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch history', detail: err.message, runs: [] },
      { status: 500 }
    );
  }
}