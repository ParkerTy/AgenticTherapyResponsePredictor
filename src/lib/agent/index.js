/**
 * Agent Orchestrator — Runs the agent reasoning loop end-to-end.
 *
 * Phase 3 step order:
 *   parseQuery -> plan -> retrieve -> synthesize -> interactions
 *               -> predict -> generateLeads -> benchmark -> report
 *
 * The interactions step (Phase 3 Step 2) evaluates biomarker co-occurrence
 * and modifier rules and feeds modifiers into predict.
 */

import { plan } from './plan.js';
import { retrieve } from './retrieve.js';
import { synthesize } from './synthesize.js';
import { runInteractions } from './interactions.js';
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
    const parsedQuery = parseQuery(query);
    artifacts.parsedQuery = parsedQuery;
    artifacts.steps.push({ step: 'parseQuery', result: parsedQuery, timestamp: new Date().toISOString() });

    const planResult = await plan(diseaseConfig, query, parsedQuery);
    artifacts.steps.push({ step: 'plan', result: planResult, timestamp: new Date().toISOString() });

    const retrieveResult = await retrieve(diseaseConfig);
    artifacts.steps.push({ step: 'retrieve', result: retrieveResult, timestamp: new Date().toISOString() });

    const synthesizeResult = await synthesize(diseaseConfig, retrieveResult);
    artifacts.steps.push({ step: 'synthesize', result: synthesizeResult, timestamp: new Date().toISOString() });

    const interactionsResult = await runInteractions(diseaseConfig, synthesizeResult);
    artifacts.steps.push({ step: 'interactions', result: interactionsResult, timestamp: new Date().toISOString() });

    const predictResult = await predict(diseaseConfig, synthesizeResult, parsedQuery, interactionsResult);
    artifacts.steps.push({ step: 'predict', result: predictResult, timestamp: new Date().toISOString() });

    const leadsResult = await generateLeads(diseaseConfig, predictResult);
    artifacts.steps.push({ step: 'generateLeads', result: leadsResult, timestamp: new Date().toISOString() });

    const benchmarkResult = await benchmark(leadsResult);
    artifacts.steps.push({ step: 'benchmark', result: benchmarkResult, timestamp: new Date().toISOString() });

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