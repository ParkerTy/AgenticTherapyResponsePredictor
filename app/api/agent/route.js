/**
 * POST /api/agent
 *
 * Body: { diseaseContext: string, query: string }
 *
 * Phase 3 update: pre-validates the query using the deterministic parser. If
 * the parser finds zero recognizable terms, returns 400 with a helpful payload
 * that the UI can render as guidance (example queries + the controlled vocab).
 *
 * Otherwise runs the full agent and logs every step to Supabase.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { runAgent } from '../../../src/lib/agent/index.js';
import { parseQuery, getExampleQueries } from '../../../src/lib/agent/queryParser.js';
import {
  logAgentRun,
  logToolCall,
  logEvidenceItems,
  logReport,
} from '../../../src/lib/agent/logger.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { diseaseContext, query } = body;

    if (!diseaseContext || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: diseaseContext, query' },
        { status: 400 }
      );
    }

    // Pre-validate the query. Block the run if no recognizable terms.
    const preParsed = parseQuery(query);
    if (!preParsed.hasRecognizedTerms) {
      return NextResponse.json(
        {
          error: 'unrecognized_query',
          message:
            'Your query did not contain any recognizable therapy classes, biomarkers, clinical settings, or intents. Please rephrase using terms the agent understands. See examples below.',
          examples: getExampleQueries(diseaseContext),
          parsedQuery: preParsed,
        },
        { status: 400 }
      );
    }

    // Load disease config from JSON
    const configPath = path.join(
      process.cwd(),
      'src',
      'lib',
      'configs',
      `${diseaseContext}.json`
    );
    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: `Disease context '${diseaseContext}' not found` },
        { status: 404 }
      );
    }
    const diseaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    diseaseConfig.diseaseKey = diseaseContext;

    // Run the agent
    const artifacts = await runAgent(diseaseConfig, query);

    // Persist to Supabase (best-effort; logger handles missing config gracefully)
    try {
      const agentRun = await logAgentRun({
        run_id: artifacts.runId,
        disease_context: diseaseContext,
        query,
        status: artifacts.status,
        config_used: diseaseConfig,
        started_at: artifacts.startedAt,
        completed_at: artifacts.completedAt,
      });

      const agentRunId = agentRun?.[0]?.id;

      if (agentRunId) {
        for (const step of artifacts.steps) {
          await logToolCall({
            agent_run_id: agentRunId,
            step_name: step.step,
            input: null,
            output: step.result,
            timestamp: step.timestamp,
          });
        }

        const synthesisStep = artifacts.steps.find((s) => s.step === 'synthesize');
        if (synthesisStep?.result?.evidenceTable) {
          await logEvidenceItems(
            agentRunId,
            synthesisStep.result.evidenceTable.map((e) => ({
              gene: e.gene,
              role: e.role,
              effect: e.effect,
              data_source: 'cBioPortal+OpenTargets',
              score: e.diseaseAssociationScore || null,
              url: null,
              metadata: e,
            }))
          );
        }

        const reportStep = artifacts.steps.find((s) => s.step === 'report');
        if (reportStep?.result) {
          await logReport({
            agent_run_id: agentRunId,
            title: reportStep.result.title,
            summary: reportStep.result.summary,
            full_report: reportStep.result,
            provenance: reportStep.result.provenance,
            generated_at: reportStep.result.generatedAt,
          });
        }
      }
    } catch (logErr) {
      console.error('Supabase logging failed (non-fatal):', logErr.message);
    }

    return NextResponse.json(artifacts);
  } catch (err) {
    console.error('Agent API error:', err);
    return NextResponse.json(
      { error: 'Agent execution failed', detail: err.message },
      { status: 500 }
    );
  }
}