/**
 * POST /api/agent
 *
 * Body: { diseaseContext: string, query: string }
 *
 * Phase 3 Step 1 added: pre-validates the query via deterministic parser. If
 * the parser finds zero recognizable terms, returns 400 with example queries.
 *
 * Otherwise runs the full agent and logs every step to Supabase using the
 * logger module's canonical signatures (logAgentRun(artifacts),
 * logToolCall(dbId, step), logEvidenceItems(dbId, table),
 * logReport(dbId, reportResult, artifacts)).
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

    // Persist to Supabase using the logger's canonical signatures.
    // Best-effort: failures are logged but do not break the response.
    try {
      const agentRunRow = await logAgentRun(artifacts);
      const agentRunDbId = agentRunRow?.id;

      if (agentRunDbId) {
        for (const step of artifacts.steps) {
          await logToolCall(agentRunDbId, step);
        }

        const synthesisStep = artifacts.steps.find((s) => s.step === 'synthesize');
        if (synthesisStep?.result?.evidenceTable) {
          await logEvidenceItems(agentRunDbId, synthesisStep.result.evidenceTable);
        }

        const reportStep = artifacts.steps.find((s) => s.step === 'report');
        if (reportStep?.result) {
          await logReport(agentRunDbId, reportStep.result, artifacts);
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