# Riwaq AI/LLM Readiness & Feasibility Assessment

**Project**: Riwaq (Deterministic Hadith Isnad-cum-Matn Analysis Tool)  
**Date**: 2026-10-25  
**Domain**: Computational Hadith Studies, Digital Humanities, AI Systems Architecture  
**Architectural Baseline**: 10-Layer Abstraction Tower ($L_0 \to L_9$)

---

## 1. Executive Summary & Readiness Scorecard

Riwaq possesses a **uniquely resilient architecture** for AI integration. Because the system is structured as an explicit, unidirectional **Abstraction Tower ($L_0 \to L_9$)** with a strictly deterministic analytical core (`clpcl-analyzer.js`, `evidence-binding.js`, `canonical-report.js`), it avoids the common flaw of many GenAI systems: allowing stochastic LLM generation to overwrite ground-truth data or calculate analytical scores.

The primary architectural gap is the **complete absence of a structured representation for the *matn***. In `scripts/json-validator.js`, `matn_raw` is merely an unparsed string, and feature `S5` (`matn_coherence`) in `scripts/clpcl-analyzer.js` is hardcoded to a constant `0.50` default (`D017`). For Riwaq to become a true **Isnad-cum-Matn Analysis** workbench, LLMs should be leveraged specifically as an upstream perception/structuring engine ($L_0 \to L_3$), while leaving graph topology, CL/PCL detection, and publication gating strictly deterministic.

```
Overall AI/LLM Readiness: 73.3 / 100 (Architecture-Ready, Perception-Gapped)
```

| Pillar | Score | Status | Primary Finding |
|---|:---:|:---:|---|
| **1. Data Model & Representation ($L_0 - L_3$)** | **68%** | `Degraded` | Isnad and biographical profiles are token-efficient and schema-validated; **matn apparatus is unsegmented and unindexed**. |
| **2. Task Suitability & Agent Boundaries ($L_4 - L_6$)** | **92%** | `Production-Grade` | Pristine encapsulation of deterministic algorithms ($S_1-S_5$, contradiction caps, CL/PCL gates); boundaries are already enforced by tests. |
| **3. Trust, Provenance, & Anti-Hallucination ($L_6 - L_7$)** | **85%** | `Strong` | `anti-hallucination.js` blocks synthetic/unverifiable claims; missing an auditable "AI Proposal/Staging" buffer before state commits. |
| **4. Tooling & Control Plane Ergonomics** | **78%** | `High` | Agent-native CLI surfaces (`manifest`, `snapshot`, `diagnose`) provide single-hop inspection; lacks a native Model Context Protocol (MCP) server. |
| **5. Benchmarking & Eval Harness** | **45%** | `Critical Gap` | 302 deterministic tests pass, but zero LLM evaluation datasets, ground-truth ICMA corpora, or fuzzy extraction rubrics exist. |
| **6. Architectural Risks & Anti-Patterns** | **72%** | `Mitigated` | Deterministic validators mitigate hallucinated citations; risk remains around LLM context bloat and chronological isnad orientation inversion. |

---

## 2. Layer-by-Layer Readiness Matrix ($L_0 \to L_9$)

The table below maps Riwaq’s 10-layer Abstraction Tower to AI integration feasibility, safe agent interventions, and non-negotiable invariants.

| Layer | Semantic Role | AI Integration Feasibility | Recommended Model / Tool | Mandatory Invariant |
|---|---|---|---|---|
| **$L_0$ Evidence** | Source text, manuscripts, rijāl evaluations | **High (Extraction)** | Multimodal OCR + Arabic LLMs (e.g. Gemini 1.5 Pro / Claude 3.5 Sonnet) via RAG | Original manuscript/print locator and verbatim citation text must be preserved immutable. |
| **$L_1$ Intake** | Validated, normalized batch | **High (Transformation)** | Small structured-output models (Llama 3.3 70B / Flash) constrained by JSON schema | Output must validate against `json-validator.js` and pass `anti-hallucination.js`. |
| **$L_2$ Identity** | Canonical narrators, merges, splits | **Medium (Proposal Only)** | Arabic Embedding (e.g. text-embedding-3-large) + LLM Entity Linker | **AI cannot commit merges/splits directly.** Proposals require cryptographic receipts in `entity-resolution.js` after human approval. |
| **$L_3$ Transmission** | Families, variants, chains, matn segments | **High (Synoptic Alignment)** | LLM sequence aligner with token-level diffing | Variant boundary and isnad array orientation (`companion -> collector`) must remain explicit. |
| **$L_4$ Graph/Features** | Nodes, edges, fan-out, chronology | **FORBIDDEN (0% AI)** | Deterministic algorithms in `clpcl-analyzer.js` | Graph topology and chronology metrics must be computed strictly via graph math. |
| **$L_5$ Interpretation** | CL/PCL scoring, candidate outcomes | **FORBIDDEN (0% AI)** | Deterministic scoring formulas in `clpcl-analyzer.js` | Analytical weights ($S_1-S_5, P_1-P_3$) and contradiction caps are immutable code contracts. |
| **$L_6$ Claim Validity** | Evidence binding & proceed gates | **FORBIDDEN (0% AI)** | Deterministic validator in `evidence-binding.js` | `analysis_can_proceed` and `canExport()` must never be overridden or relaxed by an agent. |
| **$L_7$ Explanation** | Audit trail, uncertainty, weak paths | **Medium (Narrative Synthesis)** | Reasoning LLMs (o1, Gemini Flash Thinking) for drafting commentary | Explanations must strictly cite underlying $L_4-L_6$ telemetry without adding ungrounded claims. |
| **$L_8$ Report** | Canonical report representation | **Low (Observer)** | `canonical-report.js` | Unified serializable representation; single source of truth for projections. |
| **$L_9$ Projection** | Exporters (MD, DOCX, PDF, CLI) | **High (Styling/Translation)** | Exporter scripts + Pandoc / Weasyprint | Exporters transform projections; they never recompute analytical meaning. |

---

## 3. High-Priority Gaps & Vulnerabilities

### Gap 1: Unstructured Matn Representation and Unmeasured $S_5$ Coherence
* **Evidence**: In `scripts/json-validator.js`, `matn_raw` is merely an optional string. In `scripts/clpcl-analyzer.js`, the structural feature $S_5$ (`matn_coherence`) is hardcoded to a constant `0.50` default (`default_constant_unmeasured`, `D017`).
* **Impact**: Riwaq currently operates almost exclusively as an *isnad* analyzer. In true ICMA methodology (Motzki, Schoeler), the identification of a Common Link is validated only when textual variations in the *matn* correlate with branch points in the *isnad* tree.
* **Remediation**: Introduce an $L_3$ `matn_segments` schema allowing an LLM to tokenize the text into semantic pericopes (propositions), identifying additions (*ziyādāt*), lexical substitutions (*murādifāt*), and scribal errors (*taṣḥīf*).

### Gap 2: Lack of an Asynchronous "AI Proposal" Buffer in Entity Resolution
* **Evidence**: `scripts/entity-resolution.js` directly executes `merge()` and `split()`, immediately updating `_idMap` and appending immutable receipts.
* **Impact**: If an LLM agent interacts directly with `entity-resolution.js`, an inaccurate entity resolution (e.g. conflating *Hisham ibn Urwah* with his father *Urwah ibn al-Zubayr*) permanently pollutes the identity state and retires valid IDs.
* **Remediation**: Architect a `ProposalStore` where LLMs submit candidate merges with similarity scores, reasoning, and source citations. The scholar reviews and approves proposals before `entity-resolution.js` mints durable SHA-256 receipts.

### Gap 3: Missing Ground-Truth Evaluation Datasets for Scholarly Tasks
* **Evidence**: Tests in `tests/node/` verify schema validation, graph scoring, and export formatting using synthetic fixtures (`sample-multi-variant.json`).
* **Impact**: Zero benchmark datasets exist to evaluate how well an LLM extracts isnad chains from unstructured Arabic text or aligns matn variations.
* **Remediation**: Create a benchmark suite (`tests/evals/`) incorporating gold-standard ICMA case studies from published academic literature (e.g., Motzki's study of the Maymūnah marriage hadith in *Muṣannaf ʿAbd al-Razzāq*).

### Gap 4: Absence of an MCP (Model Context Protocol) Server
* **Evidence**: `scripts/agent-control.js` provides rich machine-readable interfaces (`manifest`, `snapshot`, `diagnose`), but execution requires running shell commands via `node scripts/riwaq-cli.mjs`.
* **Impact**: External AI clients (Claude Desktop, Cursor, Antigravity) cannot invoke Riwaq functions as standard, typed tool calls.
* **Remediation**: Wrap `riwaq-cli.mjs` commands into a lightweight stdio MCP server (`scripts/riwaq-mcp.mjs`).

---

## 4. Proposed Hybrid Architecture: Deterministic Core + Agentic Perception

```mermaid
flowchart TD
    subgraph L0_L3_Perception ["Perception & Intake Layer (Agentic / LLM)"]
        RawSources["Raw Hadith / Biographical Text (Arabic/Urdu/Eng)"]
        LLM_Parser["LLM Ingestion Agent (NER & Matn Tokenizer)"]
        MatnAlign["LLM Synoptic Alignment (Ziyādāt / Taṣḥīf Analysis)"]
        ProposalBuffer["AI Proposal Buffer (Staging / Human Review)"]
        
        RawSources --> LLM_Parser
        LLM_Parser --> MatnAlign
        LLM_Parser --> ProposalBuffer
        ProposalBuffer -->|Human Scholar Approval| CanonicalBatch["Canonical Batch JSON (schema_version: 1)"]
        MatnAlign --> CanonicalBatch
    end

    subgraph L1_L2_Intake ["Intake & Security Gates (Deterministic)"]
        CanonicalBatch --> AH_Sweep["Anti-Hallucination Sweep (anti-hallucination.js)"]
        AH_Sweep -->|Blocks Synthetic/Unknown IDs| EntityRes["Entity Resolution (entity-resolution.js)"]
        EntityRes -->|Mints SHA-256 Receipts| L3_Data["Normalized Transmission State"]
    end

    subgraph L4_L6_Analysis ["Deterministic Analytical Core (FORBIDDEN TO LLMs)"]
        L3_Data --> GraphFeatures["Graph Metrics & Fan-out (clpcl-analyzer.js)"]
        GraphFeatures --> CL_Scoring["CL/PCL Detection & Contradiction Cap"]
        CL_Scoring --> ClaimBinding["Evidence Binding Gate (evidence-binding.js)"]
        ClaimBinding -->|canExport() Gating| CanonicalReport["Canonical Report (canonical-report.js)"]
    end

    subgraph L7_L9_Synthesis ["Synthesis & Projection (Hybrid)"]
        CanonicalReport --> Explainer["LLM Narrative Synthesizer (explainability.js)"]
        CanonicalReport --> Exporters["Deterministic Exporters (MD / DOCX / PDF)"]
        Explainer --> Exporters
    end
```

### Control Flow Details:
1. **Perception**: An LLM agent reads raw texts, parses isnad strings into IDs, structures *rijāl* citations into `ReliabilityEvidence`, and segments *matn* variants into aligned pericopes.
2. **Staging & Verification**: Proposed narrator identities enter a staging buffer. Once approved by a researcher, the batch enters `anti-hallucination.js`.
3. **Deterministic Processing**: Once validated, Riwaq’s JavaScript algorithms compute graph metrics, detect CL/PCL candidates, apply contradiction caps, and evaluate publication gates without LLM intervention.
4. **Synthesis**: The final `CanonicalReport` telemetry is passed back to an LLM to generate scholarly prose summaries and comparative commentary.

---

## 5. Phased Engineering Roadmap

### Phase 1: Foundation & Matn Representation Expansion ($L_0 - L_3$)
- [ ] **Extend Batch Schema**: Add optional `matn_segments` and `variant_annotations` properties to `IsnadVariant` in `scripts/json-validator.js`.
- [ ] **Activate $S_5$ Feature Computation**: Replace the constant `0.50` default in `scripts/clpcl-analyzer.js` with a deterministic token overlap or Jaccard similarity metric over aligned matn pericopes, updating `matn_coherence_basis` to `measured_token_jaccard`.
- [ ] **AI Proposal Staging Schema**: Add a staging container for suggested narrator merges and matn alignments before committing them to the immutable log in `scripts/entity-resolution.js`.

### Phase 2: Agent Tooling & MCP Server Integration ($L_9$)
- [ ] **Implement Model Context Protocol (MCP) Server**: Build `scripts/riwaq-mcp.mjs` exposing Riwaq capabilities as standard MCP tools:
  - `riwaq_validate_batch`: Runs schema and anti-hallucination checks.
  - `riwaq_get_diagnostics`: Returns actionable remediation packets (`cli.diagnose`).
  - `riwaq_analyze_family`: Derives graph metrics and CL/PCL candidates.
  - `riwaq_export_report`: Generates canonical Markdown or PDF.
- [ ] **Chain Direction Guard**: Implement an explicit preflight validation rule rejecting isnad chains ordered `collector -> companion`, enforcing Riwaq's canonical `companion -> collector` orientation to prevent silent fan-out inversion.

### Phase 3: Scholarly ICMA Evaluation Suite & Benchmarking
- [ ] **Curate Golden ICMA Benchmark Suite**: Construct ground-truth test batches in `tests/benchmarks/` based on published studies (e.g. Harald Motzki, Gregor Schoeler, Pavel Pavlovitch).
- [ ] **LLM Extraction Eval Harness**: Implement an automated evaluation runner assessing LLM accuracy on:
  1. Extraction of narrator sequences from unstructured classical Arabic text.
  2. Disambiguation of complex historical names (*ansāb*, *kuná*, *alqāb*).
  3. Matn variant collation and synoptic apparatus generation.
