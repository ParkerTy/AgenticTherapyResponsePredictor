/**
 * GET /api/run/[runId]
 *
 * Fetches the full artifacts (including all tool_calls steps and report) for
 * a specific run by its text run_id. Used by the run detail page.
 *
 * Also returns the run's children (refinements) so the UI can render the
 * parent->child->grandchild thread.
 */

import { NextResponse } from 'next/server';
import { supabase } from '../../../../src/lib/supabase.js';

export async function GET(request, { params }) {
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured on server' },
      { status: 503 }
    );
  }

  const { runId } = await params;
  if (!runId) {
    return NextResponse.json(
      { error: 'Missing runId' },
      { status: 400 }
    );
  }

  try {
    // Fetch the agent_run row
    const { data: run, error: runErr } = await supabase
      .from('agent_runs')
      .select('*')
      .eq('run_id', runId)
      .single();

    if (runErr) throw runErr;
    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    // Fetch all tool_calls for this run, ordered by timestamp
    const { data: steps, error: stepsErr } = await supabase
      .from('tool_calls')
      .select('step_name, input, output, timestamp')
      .eq('agent_run_id', run.id)
      .order('timestamp', { ascending: true });
    if (stepsErr) throw stepsErr;

    // Fetch the report for this run
    const { data: reports, error: reportsErr } = await supabase
      .from('reports')
      .select('title, summary, full_report, provenance, generated_at')
      .eq('agent_run_id', run.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (reportsErr) throw reportsErr;

    const reportRow = reports?.[0] || null;

    // Fetch children (runs that were refined from this one)
    const { data: children, error: childrenErr } = await supabase
      .from('agent_runs')
      .select('id, run_id, disease_context, query, status, parent_run_id, created_at')
      .eq('parent_run_id', runId)
      .order('created_at', { ascending: true });
    if (childrenErr) throw childrenErr;

    // If this run has a parent, fetch minimal parent metadata too
    let parent = null;
    if (run.parent_run_id) {
      const { data: parentData } = await supabase
        .from('agent_runs')
        .select('run_id, disease_context, query, created_at')
        .eq('run_id', run.parent_run_id)
        .single();
      parent = parentData || null;
    }

    return NextResponse.json({
      run,
      parent,
      children: children || [],
      steps: steps || [],
      report: reportRow,
    });
  } catch (err) {
    console.error('Run detail API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch run', detail: err.message },
      { status: 500 }
    );
  }
}