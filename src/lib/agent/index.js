/**
 * Agentic AI Scientist — Core Orchestrator
 * Inspired by BioAgents (2025) agentic reasoning framework.
 * Implements a 7-step reusable reasoning loop:
 * Plan → Retrieve → Synthesize → Predict → Generate Leads → Benchmark → Report
 *
 * Each step logs artifacts for reproducibility and auditability.
 */

import { plan } from './plan.js';
import { retrieve } from './retrieve.js';
import { synthesize } from './synthesize.js';
import { predict } from './predict.js';
import { generateLeads } from './generateLeads.js';
import { benchmark } from './benchmark.js';
import { report } from './report.js';

export async function runAgent(diseaseConfig, query) {
  const runId = `run_${Date.now()}`;
  const artifacts = {
    runId,
    disease: diseaseConfig.subtype,
    query,
    startedAt: new Date().toISOString(),
    steps: [],
  };

  try {
    // Step 1: Plan
    const planResult = await plan(diseaseConfig, query);
    artifacts.steps.push({ step: 'plan', result: planResult, timestamp: new Date().toISOString() });

    // Step 2: Retrieve
    const retrieveResult = await retrieve(diseaseConfig, planResult);
    artifacts.steps.push({ step: 'retrieve', result: retrieveResult, timestamp: new Date().toISOString() });

    // Step 3: Synthesize
    const synthesizeResult = await synthesize(diseaseConfig, retrieveResult);
    artifacts.steps.push({ step: 'synthesize', result: synthesizeResult, timestamp: new Date().toISOString() });

    // Step 4: Predict
    const predictResult = await predict(diseaseConfig, synthesizeResult);
    artifacts.steps.push({ step: 'predict', result: predictResult, timestamp: new Date().toISOString() });

    // Step 5: Generate Leads
    const leadsResult = await generateLeads(diseaseConfig, predictResult);
    artifacts.steps.push({ step: 'generateLeads', result: leadsResult, timestamp: new Date().toISOString() });

    // Step 6: Benchmark
    const benchmarkResult = await benchmark(diseaseConfig, leadsResult);
    artifacts.steps.push({ step: 'benchmark', result: benchmarkResult, timestamp: new Date().toISOString() });

    // Step 7: Report
    const reportResult = await report(diseaseConfig, artifacts);
    artifacts.steps.push({ step: 'report', result: reportResult, timestamp: new Date().toISOString() });

    artifacts.completedAt = new Date().toISOString();
    artifacts.status = 'completed';

    return artifacts;
  } catch (error) {
    artifacts.completedAt = new Date().toISOString();
    artifacts.status = 'error';
    artifacts.error = error.message;
    return artifacts;
  }
}