/**
 * Agent Orchestrator — Runs the 7-step reasoning loop end-to-end.
 *
 * Phase 3 update: now begins with a deterministic query-parse step. The parsed
 * query is propagated to plan and predict so the user's natural-language input
 * actually steers agent behavior. The parse step is logged as a tool call
 * named 'parseQuery' for full audit trail.
 *
 * Step order:
 *   parseQuery -> plan -> retrieve -> synthesize -> predict -> generateLeads
 *               -> benchmark -> report
 */

import { plan } from './plan.js';
import { retrieve } from './retrieve.js';
import { synthesize } from './synthesize.js';
import { predict } from './predict.js';
import { generateLeads } from './generateLeads.js';
import { benchmark } from './benchmark.js';
import { report } from './report.js';
import { parseQuery } from './queryParser.js';

export async function runAgent(diseaseConfig, query) {
  const artifacts = {
    runId: `run_${Date.now()}`,
    disease: diseaseConfig.disease,
    diseaseSubtype: diseaseConfig.subtype,
    diseaseKey: diseaseConfig.diseaseKey || null,
    query,
    parsedQuery: null,
    startedAt: new Date().toISOString(),
    steps: [],
    status: 'in_progress',
  };

  try {
    // Step 0 — Parse the query (deterministic). Logged as tool call.
    const parsedQuery = parseQuery(query);
    artifacts.parsedQuery = parsedQuery;
    artifacts.steps.push({
      step: 'parseQuery',
      result: parsedQuery,
      timestamp: new Date().toISOString(),
    });

    // Step 1 — Plan (now query-aware)
    const planResult = await plan(diseaseConfig, query, parsedQuery);
    artifacts.steps.push({ step: 'plan', result: planResult, timestamp: new Date().toISOString() });

    // Step 2 — Retrieve
    const retrieveResult = await retrieve(diseaseConfig);
    artifacts.steps.push({ step: 'retrieve', result: retrieveResult, timestamp: new Date().toISOString() });

    // Step 3 — Synthesize
    const synthesizeResult = await synthesize(diseaseConfig, retrieveResult);
    artifacts.steps.push({ step: 'synthesize', result: synthesizeResult, timestamp: new Date().toISOString() });

    // Step 4 — Predict (now query-aware)
    const predictResult = await predict(diseaseConfig, synthesizeResult, parsedQuery);
    artifacts.steps.push({ step: 'predict', result: predictResult, timestamp: new Date().toISOString() });

    // Step 5 — Generate Leads
    const leadsResult = await generateLeads(diseaseConfig, predictResult);
    artifacts.steps.push({ step: 'generateLeads', result: leadsResult, timestamp: new Date().toISOString() });

    // Step 6 — Benchmark
    const benchmarkResult = await benchmark(leadsResult);
    artifacts.steps.push({ step: 'benchmark', result: benchmarkResult, timestamp: new Date().toISOString() });

    // Step 7 — Report
    const reportResult = await report(artifacts);
    artifacts.steps.push({ step: 'report', result: reportResult, timestamp: new Date().toISOString() });

    artifacts.completedAt = new Date().toISOString();
    artifacts.status = 'completed';
    return artifacts;
  } catch (err) {
    artifacts.completedAt = new Date().toISOString();
    artifacts.status = 'error';
    artifacts.error = { message: err.message, stack: err.stack };
    return artifacts;
  }
}