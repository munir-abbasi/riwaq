# Riwaq: Digital Isnād Analysis — A Browser-Based Computational Framework for Hadith Transmission Studies Using Common Link Methodology

**Formerly: Academic Crescent Hadith Chain Builder**

**Author:** Munir Abbasi — Riwaq Project

---

## Abstract

Western hadith scholarship has relied on manual application of G.H.A. Juynboll's Common Link (CL) and Partial Common Link (PCL) methodology for over four decades. This paper presents **Riwaq** (formerly Academic Crescent Hadith Chain Builder)—a research-grade, browser-based tool that operationalizes Juynboll's framework into a reproducible computational workflow. The system combines graph-theoretic analysis of isnād (transmission chain) topology with evidence-based confidence scoring, claim-evidence binding to classical biographical sources, and anti-hallucination safeguards that prevent unsupported analytical claims from reaching exports. We describe the system architecture, scoring methodology, and validation framework (286 automated tests covering schema validation, entity resolution, CL/PCL detection, evidence binding, and export consistency). A mixed-methods study design is proposed to evaluate the tool's utility for contemporary scholars engaged in isnād-cum-matn analysis (ICMA).

**Keywords:** Hadith studies, Common Link methodology, Juynboll, digital humanities, graph analysis, isnād-cum-matn analysis

---

## 1. Introduction

### 1.1 Background

The study of hadith—reports of the sayings, actions, and approvals attributed to the Prophet Muhammad—has undergone significant methodological evolution in Western academia. Joseph Schacht's foundational work (1950) introduced critical historical methods, later refined by G.H.A. Juynboll (1935–2010), who developed the Common Link (CL) and Partial Common Link (PCL) framework as a systematic approach to dating and authenticating hadith transmissions.

In Juynboll's model:
- A **Common Link** is the earliest narrator in a transmission family who receives from a single authority and transmits to multiple students—representing the convergence point where a hadith "enters the public domain."
- A **Partial Common Link** is a downstream node exhibiting similar but weaker convergence patterns.

Scholars traditionally apply this methodology manually by drawing transmission diagrams on paper, identifying fan-out patterns, and cross-referencing narrator biographies from classical sources (e.g., *Tahdhib al-Kamal*, *Taqrib al-Tahdhib*, *Mizan al-I'tidal*). This process is labor-intensive, prone to human error, and difficult to reproduce or verify.

### 1.2 Problem Statement

Contemporary hadith scholars face three interconnected challenges:

1. **Reproducibility gap**: Manual CL/PCL analysis produces non-standardized outputs that are difficult to verify or replicate.
2. **Evidence traceability**: Analytical claims are often not systematically bound to specific biographical evidence records.
3. **Scalability**: Analyzing large hadith collections (e.g., *Sahih al-Bukhari* with 7,563 hadiths) manually is impractical.

### 1.3 Contribution

This paper presents **Riwaq** (formerly Academic Crescent Hadith Chain Builder), which addresses these challenges through:

- **Graph-based CL/PCL detection** with deterministic scoring formulas
- **Evidence binding layer** linking analytical claims to reliability records
- **Anti-hallucination safeguards** that flag unknown narrators and block unsupported claims
- **Multi-format export** (Markdown, DOCX, PDF, JSON) for publication-ready outputs
- **Zero-install deployment** as a static browser application

---

## 2. System Architecture

### 2.1 Runtime Model

The application is a single static HTML document (~1,765 lines) containing embedded CSS and JavaScript. No backend, database, or external API is required. Data persists in browser `localStorage` under key `hadith-chain-builder-v2`.

**Design rationale:** Static deployment eliminates server-side attack surface, reduces infrastructure costs, and ensures long-term accessibility without dependency on hosting services.

### 2.2 Module Structure

| Module | Lines | Responsibility |
|--------|-------|----------------|
| State Management | ~854–1300 | localStorage persistence, schema migration |
| Rendering Pipeline | ~1400–1650 | DOM updates, SVG canvas, chain visualization |
| Date/Age Computation | ~955–1120 | JDN conversions, Hijri/Gregorian calendar support |
| Matn Diffing | ~1524–1590 | Word-level LCS-based text comparison |
| CL/PCL Analyzer | External | Graph topology analysis, confidence scoring |
| Evidence Binding | External | Claim-evidence validation, anti-hallucination |
| Export Pipeline | External | Markdown, DOCX, PDF, JSON artifact generation |

### 2.3 Schema Versioning

The system uses forward-only schema migration:

- **v0 (legacy)**: Single-chain format `{ narrators: [...] }`
- **v1 (canonical)**: Family/variant format supporting multi-variant hadith families

Migration is automatic and idempotent, preserving all user data during upgrades.

---

## 3. CL/PCL Analytical Methodology

### 3.1 Graph Construction

Given a batch of hadith records, the system builds a directed graph where:
- **Nodes** represent narrators (identified by stable `narrator_id`)
- **Edges** represent transmission relationships (teacher → student)
- **Variants** represent different transmission paths for the same hadith

### 3.2 Feature Computation

For each narrator node `n`, the following features are computed:

| Feature | Formula | Interpretation |
|---------|---------|----------------|
| `fan_out` | `|directStudents(n)|` | Number of direct students |
| `bundle_coverage` | `variantsContaining(n) / totalVariants` | Proportion of transmission bundles containing n |
| `collector_diversity` | `|distinctTerminalCollectors reachable from n|` | Number of distinct collection endpoints |
| `pre_single_strand_ratio` | `singleStrandHops / totalUpstreamHops` | Degree of transmission narrowing before n |
| `bypass_ratio` | `bypassStrands / totalVariants` | Anomaly signal (spider/dive strands) |

### 3.3 Scoring Formula

The structural score for a CL candidate is computed as:

```
S1 = pre_single_strand_ratio (weight: 0.30)
S2 = bundle_coverage (weight: 0.25)
S3 = (collector_diversity - 2) / 6 (weight: 0.15)
S4 = fan_out / maxFanOut (weight: 0.20)
S5 = matn_coherence (default: 0.50) (weight: 0.10)

P1 = bypass_ratio * 0.20 (penalty)
P2 = chronology_conflict * 0.10 (penalty)
P3 = (1 - provenance_completeness) * 0.05 (penalty)

structural_score = max(0, min(1, 
  0.30*S1 + 0.25*S2 + 0.15*S3 + 0.20*S4 + 0.10*S5 
  - 0.20*P1 - 0.10*P2 - 0.05*P3
))
```

### 3.4 Analysis Profiles

| Profile | Description | Use Case |
|---------|-------------|----------|
| `structural_only` | Graph topology features only | Works without external reliability data |
| `reliability_weighted` | 65% structural + 35% reliability prior | Requires narrator biographical evidence |

### 3.5 Outcome Classification

Based on final confidence scores:

| Outcome | Confidence Range | Evidence Requirement |
|---------|------------------|----------------------|
| `supported` | ≥ 0.75 | Structural + reliability support |
| `contested` | 0.55–0.75 | Contradiction cap active |
| `uncertain` | 0.35–0.55 | Insufficient structural signal |
| `likely_weak_in_context` | < 0.35 | Weak structural + reliability |

**Contradiction cap:** Unresolved contradictions limit confidence to 0.70 and outcome to `contested`.

---

## 4. Evidence Binding and Anti-Hallucination

### 4.1 Claim-Evidence Model

Every analytical claim must be bound to at least one `ReliabilityEvidence` record from classical sources:

```json
{
  "evidence_id": "ev-hisham-001",
  "narrator_id": "hisham-ibn-urwah",
  "rating": "thiqah",
  "scholar": "Ibn Hajar al-Asqalani",
  "work": "Taqrib al-Tahdhib",
  "citation_text": "ثقة حافظ",
  "source_ref": {
    "collection": "Taqrib al-Tahdhib",
    "source_type": "print",
    "source_locator": "Dar al-Ma'rifah, Beirut / Vol. 2"
  }
}
```

### 4.2 Validation Rules

| Violation Level | Condition | Consequence |
|-----------------|-----------|-------------|
| `blocking` | Unknown narrator ID in claim | Claim excluded from export |
| `blocking` | Synthetic evidence ID pattern | Claim blocked |
| `warning` | Missing provenance on evidence | Confidence reduced |
| `info` | Dissent notes present | Flagged for scholar review |

### 4.3 Synthetic Pattern Detection

Evidence IDs matching these patterns are rejected:
- `synthetic_*`, `placeholder_*`, `fake_*`, `test_*`, `dummy_*`, `generated_*`, `auto_*`

---

## 5. Validation Framework

### 5.1 Test Suite Coverage

The system includes 286 automated tests organized into 8 modules:

| Module | Tests | Focus |
|--------|-------|-------|
| JSON validation | 33+ | Schema enforcement, migration |
| Compatibility adapter | 21 | v0→v1 migration correctness |
| Entity resolution | 27 | Narrator ID disambiguation |
| Reliability layer | 27 | Evidence parsing and indexing |
| CL/PCL analyzer | 65 | Scoring formula correctness |
| Evidence binding | 49 | Anti-hallucination safeguards |
| Canonical reports | 42 | Export consistency |
| E2E pipeline | 22 | Full workflow + determinism |

### 5.2 Determinism Verification

4 × 20-run determinism tests confirm stable output across repeated runs (timestamps excluded from comparison). This ensures reproducibility of analytical results.

### 5.3 Golden Test Vectors

Five canonical fixtures validate scoring correctness:

1. **FIXTURE_CLEAR_CL**: Clear CL fan-out (fan_out=3, coverage=1.0, diversity=3)
2. **FIXTURE_CL_WITH_BYPASS**: CL with spider strand triggering bypass penalty
3. **FIXTURE_PCL_ONLY**: PCL-only case (fan_out=2, below CL threshold)
4. **FIXTURE_CHRONOLOGY_PENALTIES**: Two CL candidates with provenance/chronology differences
5. **FIXTURE_PROFILE_DIFFERENCE**: Demonstrates structural_only vs reliability_weighted divergence

---

## 6. Proposed Study Design

### 6.1 Research Questions

**RQ1:** Does computational CL/PCL detection improve inter-rater reliability compared to manual analysis?

**RQ2:** Does evidence binding reduce the rate of unsupported analytical claims in scholarly outputs?

**RQ3:** What is the learning curve for scholars adopting this tool for ICMA workflows?

**RQ4:** Does the tool enable analysis of larger hadith corpora than manual methods?

### 6.2 Study Phases

#### Phase 1: Benchmarking (Months 1–3)

**Participants:** 10 hadith scholars (5 early-career, 5 senior)

**Task:** Analyze 20 hadith families from *Sahih al-Bukhari* using both manual and computational methods (counterbalanced order).

**Metrics:**
- Inter-rater reliability (Cohen's κ) for CL identification
- Time-to-completion per hadith family
- Evidence citation completeness (% of claims bound to sources)

#### Phase 2: Longitudinal Adoption (Months 4–9)

**Participants:** 25 scholars using the tool for ongoing research projects

**Data Collection:**
- Weekly usage logs (anonymized)
- Monthly structured interviews
- Export artifact analysis (claim-evidence binding rates)

**Metrics:**
- Weekly active usage
- Feature adoption curve
- Claim support rate over time

#### Phase 3: Corpus Scaling Study (Months 10–12)

**Task:** Analyze complete transmission families for a selected hadith theme (e.g., "prayer" hadiths across six canonical collections)

**Metrics:**
- Number of hadiths analyzed
- CL/PCL candidates identified
- Novel transmission patterns discovered

### 6.3 Ethical Considerations

- **Data privacy:** All data remains browser-local; no cloud storage
- **Scholarly attribution:** Tool generates audit trails linking claims to classical sources
- **Methodological transparency:** Scoring formulas are open-source and documented

### 6.4 Limitations

- **Scope:** Tool supports Juynboll's methodology; other isnād analysis schools (e.g., traditional *jarh wa-ta'dil*) are not directly modeled
- **Language:** Interface is English-only; Arabic matn support is read-only
- **Evidence dependency:** `reliability_weighted` profile requires pre-ingested biographical data

---

## 7. Discussion

### 7.1 Contribution to Digital Islamic Studies

This tool represents one of the first computational implementations of Juynboll's CL/PCL framework. By translating manual analytical steps into reproducible algorithms, it enables:

- **Verification:** Scholars can audit scoring decisions via explainability reports
- **Scaling:** Large corpora become analyzable within practical timeframes
- **Standardization:** Export formats support peer review and replication

### 7.2 Relationship to Traditional Methods

The tool does not replace traditional *jarh wa-ta'dil* (narrator criticism) but complements it by:

- Making transmission topology visible and quantifiable
- Binding graph-based claims to classical biographical evidence
- Flagging contradictions for scholar review rather than auto-resolving

### 7.3 Future Directions

- **Matn coherency analysis:** NLP-based comparison of matn variants to strengthen S5 scoring
- **Collaborative annotation:** Multi-scholar evidence curation with version control
- **Visualization enhancements:** Interactive bundle diagrams with temporal layering

---

## 8. Conclusion

**Riwaq** (formerly Academic Crescent Hadith Chain Builder) operationalizes Juynboll's CL/PCL methodology into a reproducible, evidence-bound computational workflow. With 286 passing tests, deterministic scoring, and anti-hallucination safeguards, the system provides a reliable foundation for contemporary isnād research. The proposed mixed-methods study will evaluate its practical utility for scholars engaged in hadith transmission analysis.

---

## References

1. Juynboll, G.H.A. (1983). *Muslim Tradition: Studies in Chronology, Provenance and Authorship of Early Hadith*. Cambridge University Press.

2. Juynboll, G.H.A. (2007). *Encyclopedia of Canonical Hadith*. Brill.

3. Brown, J.A.C. (2009). *Hadith: Muhammad's Legacy in the Medieval and Modern World*. Oneworld Publications.

4. Schacht, J. (1950). *The Origins of Muhammadan Jurisprudence*. Clarendon Press.

5. Holzmann, G.J. (2006). "The Power of Ten Rules for Programming in C." *IEEE Computer*, 39(3), 86–92.

6. OWASP Foundation. (2021). *OWASP Secure Coding Practices Quick Reference Guide*.

---

## Appendix A: Import Schema Example

See `docs/examples/sample-import.json` for complete annotated batch format.

## Appendix B: Test Fixture Availability

All test fixtures are available in `tests/fixtures/` directory under MIT-compatible research use terms.

---

## Appendix C: Repository Information

**Source Code:** https://github.com/AcademicCrescent-spec/Isnad-builder~

**Test Suite:** 286 passing tests (run via `npx vitest run`)

**Deployment:** Static GitHub Pages via `./academic` directory

**License:** No explicit license file present in repository
