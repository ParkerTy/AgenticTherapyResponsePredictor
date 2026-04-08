/**
 * Agent Logger
 * Writes agent runs, tool calls, evidence items, and reports to Supabase.
 * If Supabase is not configured, logs to console as fallback.
 */

import { supabase } from '../supabase.js';

export async function logAgentRun(artifacts) {
  const record = {
    run_id: artifacts.runId,
    disease_context: artifacts.disease,
    query: artifacts.query,
    status: artifacts.status,
    config_used: { disease: artifacts.disease },
    started_at: artifacts.startedAt,
    completed_at: artifacts.completedAt,
  };

  if (!supabase) {
    console.log('[Logger] Agent run (no DB):', record);
    return null;
  }

  const { data, error } = await supabase
    .from('agent_runs')
    .insert(record)
    .select()
    .single();

  if (error) {
    console.error('[Logger] Failed to log agent run:', error.message);
    return null;
  }

  return data;
}

export async function logToolCall(agentRunDbId, step) {
  const record = {
    agent_run_id: agentRunDbId,
    step_name: step.step,
    input: {},
    output: step.result,
    timestamp: step.timestamp,
  };

  if (!supabase) {
    console.log('[Logger] Tool call (no DB):', record);
    return null;
  }

  const { error } = await supabase.from('tool_calls').insert(record);

  if (error) {
    console.error('[Logger] Failed to log tool call:', error.message);
  }
}

export async function logEvidenceItems(agentRunDbId, evidenceTable) {
  if (!evidenceTable || evidenceTable.length === 0) return;

  const records = evidenceTable.map((item) => ({
    agent_run_id: agentRunDbId,
    gene: item.gene,
    role: item.role,
    effect: item.effect,
    data_source: item.dataSource,
    score: null,
    url: null,
    metadata: item.retrievedData,
  }));

  if (!supabase) {
    console.log('[Logger] Evidence items (no DB):', records);
    return;
  }

  const { error } = await supabase.from('evidence_items').insert(records);

  if (error) {
    console.error('[Logger] Failed to log evidence items:', error.message);
  }
}

export async function logReport(agentRunDbId, reportResult, artifacts) {
  const record = {
    agent_run_id: agentRunDbId,
    title: reportResult.title,
    summary: reportResult.summary,
    full_report: artifacts,
    provenance: reportResult.provenance,
    generated_at: reportResult.generatedAt,
  };

  if (!supabase) {
    console.log('[Logger] Report (no DB):', record);
    return;
  }

  const { error } = await supabase.from('reports').insert(record);

  if (error) {
    console.error('[Logger] Failed to log report:', error.message);
  }
}