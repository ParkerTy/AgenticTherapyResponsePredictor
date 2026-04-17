/**
 * POST /api/agent
 *
 * Body: { diseaseContext: string, query: string, parentRunId?: string }
 *
 * Phase 3 Step 4 update: accepts optional parentRunId to support refinement
 * threading. When present, the new run's parent_run_id column links it to
 * the parent run in the database.
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
    const { diseaseContext, query, parentRunId } = body;

    if (!diseaseContext || !query) {
      return NextResponse.json(
        { error: 'Missing required fields: diseaseContext, query' },
        { status: 400 }
      );
    }

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

    const artifacts = await runAgent(diseaseConfig, query);
    if (parentRunId) {
      artifacts.parentRunId = parentRunId;
    }

    try {
      const agentRunRow = await logAgentRun(artifacts, parentRunId);
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