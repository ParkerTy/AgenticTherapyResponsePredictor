/**
 * Interactions Step — Evaluates biomarker interaction rules.
 *
 * Reads `interactionRules` from the disease config, evaluates each rule's
 * trigger against the synthesis evidence table, and emits a list of
 * confidence modifiers that the predict step will apply.
 *
 * Rule trigger types supported:
 *   - 'co_mutation': all listed genes must have mutationFrequency > 0
 *                   (or any pair if `anyOf` is supplied)
 *   - 'single_mutation': one gene with frequency > frequencyThreshold (default 0)
 *
 * Output:
 *   {
 *     firedRules: [{ id, name, description, effects: [...] }],
 *     skippedRules: [{ id, reason }],
 *     modifiers: [{ biomarker, therapy, confidenceDelta, reason, ruleId }]
 *   }
 *
 * The `modifiers` array is what predict.js consumes. firedRules and
 * skippedRules are kept for the audit trail and UI display.
 */

export async function runInteractions(diseaseConfig, synthesisResult) {
  const rules = diseaseConfig.interactionRules || [];
  const evidenceTable = synthesisResult.evidenceTable || [];

  const evidenceByGene = {};
  for (const e of evidenceTable) {
    evidenceByGene[e.gene] = e;
  }

  const firedRules = [];
  const skippedRules = [];
  const modifiers = [];

  for (const rule of rules) {
    const evaluation = evaluateTrigger(rule.trigger, evidenceByGene);
    if (!evaluation.fired) {
      skippedRules.push({ id: rule.id, name: rule.name, reason: evaluation.reason });
      continue;
    }

    firedRules.push({
      id: rule.id,
      name: rule.name,
      description: rule.description,
      triggerEvaluation: evaluation,
      effects: rule.effects,
    });

    for (const effect of rule.effects || []) {
      modifiers.push({
        ruleId: rule.id,
        ruleName: rule.name,
        biomarker: effect.biomarker,
        therapy: effect.therapy,
        confidenceDelta: effect.confidenceDelta,
        reason: effect.reason,
      });
    }
  }

  return {
    rulesEvaluated: rules.length,
    firedRules,
    skippedRules,
    modifiers,
    evaluatedAt: new Date().toISOString(),
  };
}

/**
 * Evaluates a single rule trigger.
 * Returns { fired: boolean, reason: string, matchedGenes: string[] }
 */
function evaluateTrigger(trigger, evidenceByGene) {
  if (!trigger || !trigger.type) {
    return { fired: false, reason: 'no_trigger_defined' };
  }

  if (trigger.type === 'co_mutation') {
    // anyOf overrides: any one of the listed gene-pairs/groups can satisfy
    if (Array.isArray(trigger.anyOf) && trigger.anyOf.length > 0) {
      for (const group of trigger.anyOf) {
        const result = checkAllGenesMutated(group, evidenceByGene);
        if (result.allMutated) {
          return { fired: true, reason: 'co_mutation_anyOf_matched', matchedGenes: group };
        }
      }
      return { fired: false, reason: 'co_mutation_anyOf_none_matched' };
    }
    // Standard: every listed gene must be mutated
    const genes = trigger.genes || [];
    const result = checkAllGenesMutated(genes, evidenceByGene);
    if (result.allMutated) {
      return { fired: true, reason: 'co_mutation_matched', matchedGenes: genes };
    }
    return { fired: false, reason: `co_mutation_unsatisfied (missing: ${result.missing.join(', ')})` };
  }

  if (trigger.type === 'single_mutation') {
    const gene = trigger.gene;
    const threshold = trigger.frequencyThreshold ?? 0;
    const ev = evidenceByGene[gene];
    if (!ev) return { fired: false, reason: `gene_not_in_evidence (${gene})` };
    const freq = parseFloat(ev.mutationFrequency) || 0;
    if (freq > threshold) {
      return { fired: true, reason: `single_mutation_above_threshold (${freq}% > ${threshold}%)`, matchedGenes: [gene] };
    }
    return { fired: false, reason: `single_mutation_below_threshold (${freq}% <= ${threshold}%)` };
  }

  return { fired: false, reason: `unsupported_trigger_type: ${trigger.type}` };
}

function checkAllGenesMutated(genes, evidenceByGene) {
  const missing = [];
  for (const g of genes) {
    const ev = evidenceByGene[g];
    const freq = parseFloat(ev?.mutationFrequency) || 0;
    if (freq <= 0) missing.push(g);
  }
  return { allMutated: missing.length === 0, missing };
}