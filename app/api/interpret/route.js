/**
 * POST /api/interpret
 *
 * Accepts summarized run data and a user question.
 * Builds a data-grounded system prompt and calls Groq LLM
 * for plain-English interpretation of agent results.
 *
 * Body: {
 *   runSummary: object,         — extracted key data from primary run
 *   compareSummary?: object,    — optional second run for comparison
 *   question: string,           — user's question
 *   conversationHistory?: array — prior messages for multi-turn chat
 * }
 *
 * The LLM is a Tier-2 interpretation layer ONLY.
 * It never influences the deterministic scientific pipeline.
 */

import { NextResponse } from 'next/server';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'llama-3.3-70b-versatile';

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'groq_not_configured',
          message:
            'GROQ_API_KEY is not configured. Add it to your .env.local (local) or Vercel environment variables (production).',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { runSummary, compareSummary, question, conversationHistory } = body;

    if (!runSummary) {
      return NextResponse.json(
        { error: 'No run data provided. Select a run first.' },
        { status: 400 }
      );
    }

    if (!question || !question.trim()) {
      return NextResponse.json(
        { error: 'A question is required.' },
        { status: 400 }
      );
    }

    // Build the system prompt with embedded run data
    const systemPrompt = buildSystemPrompt(runSummary, compareSummary);

    // Assemble message history for multi-turn conversation
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []),
      { role: 'user', content: question },
    ];

    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        messages,
        temperature: 0.3,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq API error:', groqRes.status, errText);
      throw new Error(`Groq API returned ${groqRes.status}`);
    }

    const groqData = await groqRes.json();
    const reply =
      groqData.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({
      interpretation: reply,
      model: groqData.model || MODEL,
      usage: groqData.usage || null,
    });
  } catch (err) {
    console.error('Interpret API error:', err);
    return NextResponse.json(
      { error: 'Interpretation failed', detail: err.message },
      { status: 500 }
    );
  }
}

/**
 * Build the Groq system prompt with embedded analysis data.
 * The prompt instructs the LLM to ONLY reference data present in the results.
 */
function buildSystemPrompt(runSummary, compareSummary) {
  let prompt = `You are a biomedical research assistant interpreting the output of a deterministic agentic AI therapy response prediction system. Your role is to explain what the computational results mean in plain, accessible English.

CRITICAL RULES — YOU MUST FOLLOW ALL OF THESE:
1. ONLY reference data points that appear in the ANALYSIS RESULTS below. Never fabricate, infer, or assume data that is not explicitly present.
2. If asked about something not present in the results, state clearly: "That information is not available in this analysis."
3. Reference specific numbers from the results: mutation frequencies (e.g., "PIK3CA was mutated in 63.8% of samples"), association scores, confidence levels, benchmark composite scores, and tier classifications.
4. Explain the clinical significance of findings where supported by the data, but always qualify with "based on this analysis" or "according to these results."
5. When discussing predictions, explain what the confidence level means and what factors contributed to it (query boost, interaction modifiers, CIViC clinical evidence boost).
6. When discussing benchmark tiers, explain the 7-dimension scoring system: clinical precedence, cancer gene census, known drug evidence, mutation frequency, drug evidence (DGIdb), mechanistic plausibility, and clinical evidence (CIViC).
7. Keep responses concise: 2-4 paragraphs for initial interpretations, 1-2 paragraphs for follow-ups.
8. End your FIRST interpretation (not follow-ups) with "Questions you might consider:" followed by 2-3 specific follow-up questions based on the data.
9. This is NOT clinical advice. Include this disclaimer naturally in your first response.

SCORING SYSTEM REFERENCE:
- Confidence scores: high (≥0.8), moderate (0.5-0.79), low (<0.5). Components: base score (from mutation frequency + association score), query boost (+0.10 if query matches therapy), interaction delta (from biomarker interaction rules), clinical evidence boost (+0.10 if CIViC Level A or B).
- Benchmark tiers: Tier 1 — Strong (≥0.60), Tier 2 — Moderate (0.35-0.59), Tier 3 — Exploratory (<0.35). Composite from 7 weighted dimensions summing to 1.0.
- CIViC evidence levels: A (validated), B (clinical), C (case study), D (preclinical), E (inferential).
- Data sources: cBioPortal (TCGA cohort mutations), OpenTargets (target-disease associations), CIViC (clinical evidence), DGIdb (drug-gene interactions), Reactome (pathway context).

═══════════════════════════════════
PRIMARY ANALYSIS RESULTS:
═══════════════════════════════════
${JSON.stringify(runSummary, null, 2)}`;

  if (compareSummary) {
    prompt += `

═══════════════════════════════════
COMPARISON ANALYSIS (second disease context):
═══════════════════════════════════
${JSON.stringify(compareSummary, null, 2)}

COMPARISON INSTRUCTIONS:
When comparing two disease contexts, specifically address:
- Key differences in mutation frequencies and what they imply about each disease
- How the deterministic pipeline produces different predictions from disease-specific configs
- Which context has stronger therapeutic leads (higher benchmark tiers and composite scores)
- Biomarker differences driving different therapy recommendations
- Shared vs. unique therapeutic opportunities across the two contexts`;
  }

  return prompt;
}