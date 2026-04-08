# Agentic AI Scientist

**Therapy Response Prediction & Generative Lead Benchmarking Across Disease Contexts**

Student: Ty Parker
Course: INFO 603/404 Biological Data Management
Instructor: Prof. Jake Y. Chen
Date: Spring 2026

## Overview

This system implements a reusable agentic AI scientist that executes a 7-step reasoning loop to predict therapy responses and benchmark therapeutic leads across multiple oncology disease contexts. The agent architecture is inspired by BioAgents (2025).

## Scientific Question

Can a general-purpose agentic AI workflow integrate open-source clinical, genomic, pathway, and drug-target knowledge to (1) predict therapy response patterns and (2) benchmark newly proposed therapeutic leads, while maintaining transparency, reproducibility, and auditability across disease contexts?

## Agentic Reasoning Loop

1. **Plan** — Interpret query and generate a step-by-step reasoning plan
2. **Retrieve** — Pull clinical, genomic, pathway, and drug-target evidence
3. **Synthesize** — Assemble an auditable evidence table
4. **Predict** — Apply transparent heuristics for therapy response
5. **Generate Leads** — Propose mechanism-level therapeutic candidates
6. **Benchmark** — Compare leads against standard therapies
7. **Report** — Produce reproducible output with full provenance

Every step is logged, traceable, and stored in the database.

## Supported Disease Contexts

| Context | Config Key | Key Biomarkers |
|---|---|---|
| HR+/HER2- Breast Cancer | hr_pos_her2_neg | ESR1, PIK3CA, RB1 |
| Triple-Negative Breast Cancer | tnbc | BRCA1, BRCA2, PD-L1 |
| Colorectal Cancer | crc | KRAS, NRAS, MSI |

Disease contexts are defined by JSON configuration files — no code changes required to add new contexts.

## Tech Stack

- **Frontend/Fullstack:** Next.js (JavaScript)
- **Database:** Supabase (PostgreSQL)
- **Deployment:** Vercel
- **Agent Framework:** Custom modular agent inspired by BioAgents (2025)
- **External APIs:** cBioPortal, OpenTargets (integration in Phase 2)

## Project Structure
app/ — Next.js app router pages and API routes
src/
components/ — UI components
lib/
agent/ — 7-step agentic reasoning loop
configs/ — Disease context JSON configurations
docs/
progress-reports/ — Phase progress reports

## FAIR Compliance

### Findable
- Organized repository with clear naming conventions
- Indexed reports and structured outputs

### Accessible
- Public GitHub repository
- Clear README and documentation
- API documentation for all endpoints

### Interoperable
- Standard data formats (JSON)
- Modular architecture with config-driven disease contexts
- REST API interface

### Reusable
- Config-driven system — swap disease context without code changes
- Documented workflows with full provenance
- All agent artifacts stored with traceability

## Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. Run `npm run dev`
5. Open http://localhost:3000

## Environment Variables

See `.env.example` for required variables.

## Phase Progress

- [x] Phase 1 — Foundation (project setup, schema, agent skeleton, deployment)
- [ ] Phase 2 — Data & Evidence (API integration, evidence tables, logging)
- [ ] Phase 3 — Intelligence (prediction logic, lead generation, benchmarking)
- [ ] Phase 4 — Polish & Generalization (multi-context, UI, final report)
