/**
 * API Route: /api/agent
 * Accepts a disease context key and query, runs the agentic loop,
 * logs everything to Supabase, and returns results.
 */

import { runAgent } from '../../../src/lib/agent/index.js';
import { logAgentRun, logToolCall, logEvidenceItems, logReport } from '../../../src/lib/agent/logger.js';

import hrPosHer2Neg from '../../../src/lib/configs/hr_pos_her2_neg.json';
import tnbc from '../../../src/lib/configs/tnbc.json';
import crc from '../../../src/lib/configs/crc.json';

const configs = {
  'hr_pos_her2_neg': hrPosHer2Neg,
  'tnbc': tnbc,
  'crc': crc,
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { diseaseContext, query } = body;

    if (!diseaseContext || !configs[diseaseContext]) {
      return Response.json(
        { error: `Invalid disease context. Choose from: ${Object.keys(configs).join(', ')}` },
        { status: 400 }
      );
    }

    if (!query) {
      return Response.json(
        { error: 'A query is required.' },
        { status: 400 }
      );
    }

    const config = configs[diseaseContext];
    const result = await runAgent(config, query);

    // Log to Supabase
    const dbRun = await logAgentRun(result);

    if (dbRun) {
      // Log each tool call
      for (const step of result.steps) {
        await logToolCall(dbRun.id, step);
      }

      // Log evidence items from synthesize step
      const synthesizeStep = result.steps.find((s) => s.step === 'synthesize');
      if (synthesizeStep?.result?.evidenceTable) {
        await logEvidenceItems(dbRun.id, synthesizeStep.result.evidenceTable);
      }

      // Log the report
      const reportStep = result.steps.find((s) => s.step === 'report');
      if (reportStep?.result) {
        await logReport(dbRun.id, reportStep.result, result);
      }
    }

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: 'Agent execution failed', details: error.message },
      { status: 500 }
    );
  }
}