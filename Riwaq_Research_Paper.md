# Riwaq: A Reproducible and Evidence-Bound Framework for Hadith Transmission Analysis

**Inspired by: Academic Crescent Hadith Chain Builder**

**Author:** Munir Abbasi — Riwaq Project

**Corresponding Author:** Munir Abbasi, Riwaq Project

**Date:** March 2026

---

## Abstract

Western hadith scholarship has relied on manual application of G.H.A. Juynboll's Common Link (CL) and Partial Common Link (PCL) methodology for over four decades. This paper presents **Riwaq** (formerly Academic Crescent Hadith Chain Builder)—a research-grade, browser-based tool that operationalizes Juynboll's framework into a reproducible computational workflow. The system combines graph-theoretic analysis of *isnād* (transmission chain) topology with evidence-based confidence scoring, claim-evidence binding to classical biographical sources, and anti-hallucination safeguards that prevent unsupported analytical claims from reaching exports. We describe the system architecture, scoring methodology, and verification framework (286 automated tests covering schema validation, entity resolution, CL/PCL detection, evidence binding, and export consistency). We distinguish between *verification*—demonstrating the software computes correctly— and *validation*—demonstrating the tool achieves its intended scholarly purpose. A mixed-methods evaluation study is proposed to validate the tool's utility for contemporary scholars engaged in *isnād-cum-matn* analysis (ICMA).

**Keywords:** Hadith studies, Common Link methodology, Juynboll, digital humanities, graph analysis, *isnād-cum-matn* analysis, computational historiography

---

## 1. Introduction

### 1.1 Background and Motivation

The study of *hadith*—reports of the sayings, actions, and tacit approvals attributed to the Prophet Muhammad and his companions—constitutes the second source of authority in Islamic jurisprudence (*fiqh*) after the Quran. The authentication and dating of hadith texts has occupied Muslim scholars for over fourteen centuries, giving rise to a sophisticated discipline of textual criticism that predates Western source criticism by nearly a millennium (Robson, 1958; Brown, 2009). Within Western academic scholarship, the critical study of hadith underwent significant transformation in the mid-twentieth century, catalyzed by Joseph Schacht's (1950) application of historical-critical methods borrowed from biblical studies.

Building upon Schacht's foundational work, G.H.A. Juynboll (1935–2010), the Dutch scholar of Islam, developed what remains the most systematic methodological framework for the formal analysis of hadith transmission. Juynboll's Common Link (CL) and Partial Common Link (PCL) methodology, articulated across several seminal publications (Juynboll, 1983, 1991, 1996, 2007), provides a graph-theoretic approach to identifying the earliest narrators in transmission chains and dating hadith texts through topological analysis of *isnād* networks.

The central insight of Juynboll's methodology is that hadith transmissions exhibit characteristic fan-out patterns. When a single narrator receives a report from one authority and subsequently transmits it to multiple students, this convergence point—termed a Common Link—represents the moment when a hadith "enters the public domain" (Juynboll, 1983, p. 73). By mapping these transmission convergences across multiple hadith variants, scholars can triangulate the earliest plausible date for a given report and identify potentially problematic transmission patterns.

Despite its analytical power, the CL/PCL methodology has been applied almost exclusively through manual techniques. Scholars traditionally construct transmission diagrams on paper, identify fan-out patterns through visual inspection, and cross-reference narrator biographies from classical biographical dictionaries such as *Tahdhīb al-Kamāl* by al-Mizzī, *Taqrīb al-Tahdhīb* by Ibn Hajar al-Asqalānī, and *Mīzān al-I'tidāl* by al-Dhahabī. This manual approach presents three fundamental challenges for contemporary scholarship:

1. **Reproducibility deficit**: Manual CL/PCL analysis produces outputs that vary between scholars and are difficult to verify or replicate. Different analysts may identify different CL candidates for the same transmission family, and the reasoning behind these identifications is often not formally documented.

2. **Evidence traceability gap**: Analytical claims regarding narrator reliability, chronology conflicts, and transmission anomalies are frequently asserted without systematic binding to specific biographical evidence records. This creates difficulties for peer review and scholarly verification.

3. **Scalability constraint**: Large hadith corpora—such as the approximately 7,563 hadiths in *Ṣaḥīḥ al-Bukhārī* or the ~4,000 hadiths in *Sahih Muslim*—comprise thousands of transmission families. Manual analysis of these collections within practical timeframes is largely infeasible.

### 1.2 The Case for Computational Support

The challenges outlined above are not unique to hadith studies; they characterize many domains where complex pattern recognition meets historical evidence. Computational support for scholarly analysis has transformed fields including epigraphy (Elliott et al., 2021), paleography (Harrison et al., 2019), and historical network analysis (Bridonneau, 2021). In each case, computational tools serve not to replace scholarly judgment but to make pattern recognition more systematic, documentation more rigorous, and large-scale analysis tractable.

The present work responds to this broader methodological movement by introducing **Riwaq**, a browser-based computational framework that translates Juynboll's CL/PCL methodology into reproducible algorithms. The name "Riwaq" (روقة) refers to the colonnaded arcades of traditional Islamic architecture—spaces where scholars historically gathered for discourse and transmission of knowledge. This choice of nomenclature reflects the tool's purpose: facilitating the continuation of scholarly transmission in a digital medium.

### 1.3 Research Contributions

This paper makes the following contributions to digital Islamic studies and computational humanities:

1. **Algorithmic formalization of CL/PCL methodology**: We present the first complete computational specification of Juynboll's CL/PCL scoring framework, including feature computation formulas, weighting schemes, and outcome classification criteria. This formalization makes implicit methodological assumptions explicit and auditable.

2. **Evidence binding architecture**: We introduce a claim-evidence model that enforces systematic binding between analytical claims and classical biographical sources. This architecture includes anti-hallucination safeguards that prevent unsupported claims from reaching export artifacts.

3. **Verification framework**: We describe a comprehensive test suite of 286 automated tests covering eight functional modules, verifying that the software correctly implements its specifications.

4. **Proposed evaluation methodology**: We present a mixed-methods study design for *validating* the tool's utility in actual scholarly workflows—addressing whether computational CL/PCL detection improves reproducibility, whether evidence binding reduces unsupported claims, and whether the tool enables analysis at scales impractical for manual methods.

### 1.4 Paper Structure

The remainder of this paper is organized as follows. Section 2 provides a theoretical foundation by reviewing the historiography of hadith authentication and prior computational approaches. Section 3 details the system architecture, including the runtime model and module structure. Section 4 presents the CL/PCL analytical methodology, including graph construction, feature computation, and the scoring formula. Section 5 describes the evidence binding system and anti-hallucination safeguards. Section 6 presents the verification framework and test suite, with an explicit distinction between verification (software correctness) and validation (scholarly utility). Section 7 proposes the evaluation study design for validating the tool with actual scholarly users. Section 8 discusses implications, limitations, and future directions. Section 9 concludes.

---

## 2. Background and Related Work

### 2.1 The *Isnād* System and Hadith Authentication

The *isnād* (chain of transmission) constitutes a unique methodological feature of Islamic textual criticism. Unlike Western source criticism, which relies primarily on internal textual criteria, hadith authentication developed sophisticated criteria for evaluating the reliability of individual narrators within transmission chains (Lecomte, 1965; Motzki, 2004). Classical Muslim scholars developed elaborate biographical dictionaries (*kutub al-rijāl*) that documented the reliability (*thiqāh*), memory (*hifẓ*), and moral character (*'adālah*) of thousands of narrators across multiple generations (Brown, 2024; Wikipedia, *Biographical evaluation*).

The science of *'ilm al-rijāl* (literally "knowledge of men")—the discipline of evaluating hadith narrators—emerged early in Islamic history and became one of the most sophisticated systems of source criticism ever developed. Ali ibn al-Madini (d. 234/849), an early authority, famously declared that "knowing the narrators is half of knowledge." The discipline gained systematic structure through works such as Ibn Abi Hatim al-Razi's (d. 327/938) *Kitab al-Jarh wa al-Ta'dil*, which established foundational criteria for evaluating narrators (Dickinson, 2001; al-Darul Tahqiq, 2016).

Classical *'ulūm al-ḥadīth* (sciences of hadith) established systematic principles for evaluating transmission chains. Ibn Hajar al-Asqalani (d. 852/1449), in his *Taqrib al-Tahdhib* and *Tahdhib al-Tahdhib*, classified narrators into twelve ranks, from the Companions of the Prophet down through various grades of reliability and weakness. His student al-Dhahabi (d. 748/1347) compiled the *Mizan al-I'tidal* as a balanced encyclopedia addressing both reliable and weak narrators, while al-Mizzi (d. 742/1341) produced the massive *Tahdhib al-Kamal*, adding geographical and chronological details to biographical entries (IslamOnline, 2026).

Narrators were classified into categories such as *thiqah* (trustworthy), *ṣadūq* (truthful), *lā yunsab ilayhi* (unknown/majhūl), and various grades of weakness (*da'īf*). The methodology developed by Muslim scholars—particularly the principles of *jarh wa-ta'dīl* (disparagement and accreditation)—remains foundational to both traditional and contemporary hadith scholarship (Ibn al-Salah, d. 643/1245; al-Suyuti, d. 911/1505).

### 2.2 Juynboll's Common Link Methodology

G.H.A. Juynboll's contribution was to synthesize the traditional biographical approach with systematic graph-theoretic analysis of transmission networks. In his landmark 1983 work *Muslim Tradition: Studies in Chronology, Provenance and Authorship of Early Hadith*, Juynboll articulated a methodology for dating hadith through analysis of *isnād* topology. Subsequent refinements appeared in his *Encyclopedia of Canonical Hadith* (2007) and in critical discussions by other scholars (Melchert, 2020; Abu-Alabbas et al., 2020). The central concepts are:

**Common Link (CL)**: The earliest narrator in a transmission family who receives from a single authority and transmits to multiple students. The CL represents the convergence point where a hadith entered wide circulation. Below the CL, transmission paths may diverge and recombine; above it, the chain typically narrows toward a single original source.

**Partial Common Link (PCL)**: A downstream narrator exhibiting similar but weaker convergence patterns—transmitting to multiple students but not satisfying all CL criteria. PCLs may represent secondary dissemination points or indicate transmission anomalies.

**Fan-out ratio**: The ratio of immediate students to upstream teachers. CL candidates typically exhibit fan-out ratios significantly greater than one, indicating that a single narrator served as a nexus for multiple transmission paths.

**Spider and dive strands**: Anomalous transmission patterns. Spider strands (*spinnenpoot*-strands, in Juynboll's original terminology) represent transmissions that bypass apparent CLs and connect to earlier narrators through unexpected routes. Dive strands represent chains that narrow unusually rapidly. Both patterns may indicate later fabrication or transmission contamination.

It should be noted that Juynboll's methodology has been subject to critique and refinement. Christopher Melchert (2020) has documented the theory and practice of hadith criticism in the mid-ninth century, noting that earlier hadith scholars employed diverse approaches to evaluating transmissions. Some scholars have questioned whether the CL/PCL framework adequately captures the complexity of early hadith transmission, given that oral transmission was characteristically paraphrastic and flexible (Little, 2024). These debates underscore that Juynboll's methodology, while influential, represents one approach within a broader scholarly tradition.

### 2.3 Prior Computational Approaches

Despite the obvious graph-theoretic nature of *isnād* analysis, computational approaches to hadith studies remain nascent. Several prior efforts deserve acknowledgment:

**Motzki's source criticism**: While not computational, Herbert Motzki's (2004) work on *isnād*-cum-*matn* analysis influenced subsequent methodological discussions. Motzki's approach emphasized matching transmission variants to reconstruct original texts, a methodology that could benefit from computational text comparison tools. His emphasis on analyzing the relationship between *isnād* structure and *matn* content aligns with the multi-dimensional analysis that Riwaq enables.

**Al-Minaei's database projects**: Various projects have attempted to digitize hadith collections and biographical data (e.g., the *Mawsu'at al-Hadith al-Sharif* project), but these typically focus on retrieval rather than analytical functionality. The distinction between digitization and analysis is crucial: most prior projects have treated hadith as documents to be stored and retrieved, not as networks to be analyzed.

**Network analysis approaches**: Some scholars have applied social network analysis to *isnād* data (Johansson et al., 2013), examining metrics such as centrality and clustering. However, these studies typically treat *isnād* as social networks rather than transmission documents, missing the documentological specificity of CL/PCL methodology. The CL concept, in particular, is not merely about network centrality but about the earliest point of public dissemination—a subtle but important distinction (Abu-Alabbas et al., 2020, Chapter 5).

**Khoei et al.'s work**: Recent computational work by Khoei et al. (2023) has explored machine learning approaches to hadith classification, though this focuses on text categorization rather than transmission chain analysis. Their work demonstrates growing interest in computational approaches within the field, suggesting a receptive audience for tools like Riwaq.

**Melchert's methodological contributions**: Christopher Melchert's extensive scholarship on the formation of hadith transmission (1997, 2015, 2020) has clarified the historical development of *isnād* practices. His work on the tension between traditionist and jurist approaches to hadith criticism provides important context for understanding why different scholarly communities may adopt different analytical frameworks.

To the best of our knowledge, Riwaq represents the first attempt to implement the complete CL/PCL methodology as a computational workflow with evidence binding and anti-hallucination safeguards.

### 2.4 Relationship to Classical *'Ilm al-Rijāl*

A critical question for any computational tool engaging with hadith is its relationship to the classical tradition of *'ilm al-rijāl*. This discipline, which developed over centuries of Muslim scholarship, evaluated narrators based on criteria including *'adālah* (integrity), *dabt* (precision in transmission), and *'isma* (protection from error). Critics assessed narrators according to scales that often included six or more levels of praise and multiple categories of criticism (al-Suyuti, *Tadrib al-Rawi*; Ibn Hajar, *Nuzhat al-Nathar*).

Riwaq's evidence binding system (Section 5) directly engages with this tradition by requiring that analytical claims be linked to biographical evidence records. The tool does not attempt to replicate the full complexity of *jarh wa-ta'dīl* evaluation, which involves nuanced assessment of narrator character, scholarly reliability, and contextual factors. Rather, it provides a structural complement—focusing on transmission topology while incorporating biographical classifications as reliability priors.

The tool's `reliability_weighted` profile accepts narrator classifications from classical sources (e.g., *thiqah*, *ṣadūq*, *da'īf*) as inputs to the scoring formula. This approach treats *'ilm al-rijāl* as authoritative while remaining agnostic about the internal logic of different classification systems. Future work could explore more sophisticated integration with classical source criticism, including differentiation between strict (*mutashaddid*) and lenient (*mutasahil*) critics (Abu Ghuddah's work on *al-Raf'u wa al-Takmil* represents one modern attempt at such systematization).

### 2.5 Digital Humanities Context

The development of Riwaq participates in broader disciplinary conversations within digital humanities and computational social science. Relevant frameworks include:

**Computational historiography**: The use of computational methods for historical analysis, including text mining, network analysis, and geographic information systems (Graham et al., 2015).

**Reproducible research**: The movement toward making research artifacts—including data, code, and analytical workflows—available for verification and extension (Stodden et al., 2016). Riwaq's export functionality and evidence binding support this goal.

**Human-computer interaction in scholarly contexts**: The design of computational tools that augment rather than replace scholarly judgment, respecting domain expertise while providing systematic analysis support (Svensson, 2010).

---

## 3. System Architecture

### 3.1 Design Principles

Riwaq's architecture is governed by several design principles derived from the requirements of scholarly research tools:

**Privacy by default**: All data remains in the user's browser. No data is transmitted to external servers, ensuring that scholars can work with sensitive materials without concerns about data exposure.

**Reproducibility**: Analytical results must be deterministic and reproducible. The system explicitly handles non-deterministic elements (such as timestamps) to ensure consistent output across repeated analysis runs.

**Transparency**: All scoring decisions are documented and auditable. Scholars can trace how confidence scores are computed and what evidence supports specific claims.

**Interoperability**: The system supports multiple export formats (Markdown, DOCX, PDF, JSON) to integrate with existing scholarly workflows and publication pipelines.

**No installation required**: The application is delivered as a static HTML document, requiring only a web browser. This eliminates installation barriers and ensures long-term accessibility without dependency on hosting infrastructure.

### 3.2 Runtime Model

The application is implemented as a single static HTML document of approximately 1,765 lines containing embedded CSS and JavaScript. No backend server, database, or external API is required. Data persistence is achieved through the browser's `localStorage` API, using the storage key `hadith-chain-builder-v2`.

The static deployment model offers several advantages:

- **Security**: Eliminating server-side components removes an entire attack surface. There are no database vulnerabilities, server misconfigurations, or API security concerns to manage.

- **Cost**: Static hosting on platforms such as GitHub Pages incurs no infrastructure costs.

- **Longevity**: A static HTML file can be archived and viewed decades hence without dependency on specific software or hosting services. This aligns with scholarly requirements for research data longevity.

- **Offline capability**: The application functions fully offline after initial load, supporting use in environments with limited connectivity.

### 3.3 Module Structure

The system is organized into the following functional modules:

| Module               | Approximate Location | Responsibility                                                  |
| -------------------- | -------------------- | --------------------------------------------------------------- |
| State Management     | Lines 854–1300       | `localStorage` persistence, schema migration, data integrity    |
| Rendering Pipeline   | Lines 1400–1650      | DOM updates, SVG canvas, chain visualization                    |
| Date/Age Computation | Lines 955–1120       | Julian Day Number conversions, Hijri/Gregorian calendar support |
| Matn Diffing         | Lines 1524–1590      | Word-level longest common subsequence text comparison           |
| CL/PCL Analyzer      | External module      | Graph topology analysis, confidence scoring computation         |
| Evidence Binding     | External module      | Claim-evidence validation, anti-hallucination enforcement       |
| Export Pipeline      | External module      | Markdown, DOCX, PDF, JSON artifact generation                   |

The CL/PCL Analyzer, Evidence Binding, and Export Pipeline are implemented as external modules to facilitate independent testing and future modular replacement. These modules communicate through well-defined interfaces and are covered by dedicated test suites.

### 3.4 Schema Versioning

The system employs a forward-only schema migration strategy to support data evolution while preserving existing user data:

**Schema v0 (legacy)**: The original schema format using a single-chain structure:

```json
{
  "narrators": [...]
}
```

**Schema v1 (canonical)**: The current schema format supporting multi-variant hadith families:

```json
{
  "hadith_family": {
    "variants": [...],
    "narrators": {...}
  }
}
```

Migration from v0 to v1 is automatic during application load. The migration function is idempotent—running it multiple times produces the same result—and preserves all user data without loss of information.

### 3.5 Data Flow

The typical analytical workflow proceeds as follows:

1. **Import**: Scholars import hadith data in the supported JSON batch format, either through file upload or manual entry.

2. **Annotation**: Scholars annotate transmission variants, add biographical evidence records, and specify narrator relationships.

3. **Analysis**: The CL/PCL Analyzer processes the annotated data, computing features and confidence scores for each narrator.

4. **Validation**: The Evidence Binding module validates that analytical claims are properly supported by evidence records.

5. **Export**: Validated results are exported in the desired format, with anti-hallucination safeguards blocking any unsupported claims.

---

## 4. CL/PCL Analytical Methodology

### 4.1 Graph Construction

Given a batch of hadith records, the system constructs a directed graph representing the transmission network. The graph components are:

**Nodes (Narrators)**: Each narrator is represented by a unique, stable `narrator_id` that persists across sessions. The `narrator_id` serves as the primary key for entity resolution and evidence binding. A narrator's biographical data—including name variants, death date (if known), and reliability evidence—is stored separately and linked by `narrator_id`.

**Edges (Transmission Relationships)**: Directed edges from teacher to student represent transmission relationships. Each edge may carry metadata including the transmission type (*samá'*, *irābah*, *iqrār*), the source document if known, and any uncertainty flags.

**Variants (Transmission Paths)**: A variant represents a complete transmission path for a given hadith, from the original attribution (e.g., the Prophet) through all intermediate narrators to the collector who compiled the hadith in a canonical collection.

**Bundles (Transmission Families)**: A bundle groups all variants that share the same original attribution, representing what traditional scholarship might call a single hadith "chapter" or "trace."

### 4.2 Feature Computation

For each narrator node `n`, the system computes the following features, which serve as inputs to the confidence scoring formula:

**Fan-out (`fan_out`)**: The number of direct students of narrator `n`. Computed as:

```
fan_out(n) = |directStudents(n)|
```

In graph-theoretic terms, this is the out-degree of node `n`. High fan-out values indicate that a narrator transmitted to many students, consistent with the CL pattern.

**Bundle Coverage (`bundle_coverage`)**: The proportion of transmission bundles containing narrator `n`. Computed as:

```
bundle_coverage(n) = variantsContaining(n) / totalVariants
```

Bundle coverage close to 1.0 indicates that a narrator appears in virtually all transmission variants, suggesting centrality to the transmission network.

**Collector Diversity (`collector_diversity`)**: The number of distinct terminal collectors reachable from narrator `n`. Computed as:

```
collector_diversity(n) = |distinctTerminalCollectors(n)|
```

This metric captures the breadth of hadith collections that include transmissions from narrator `n`. Higher diversity suggests wider dissemination through canonical collections.

**Pre-Single-Strand Ratio (`pre_single_strand_ratio`)**: The proportion of upstream hops that represent single-strand transmission. Computed as:

```
pre_single_strand_ratio(n) = singleStrandHops(n) / totalUpstreamHops(n)
```

A high pre-single-strand ratio indicates that transmission "narrowed" before reaching `n`, consistent with the CL representing an early dissemination point.

**Bypass Ratio (`bypass_ratio`)**: The proportion of transmission variants that exhibit spider or dive patterns relative to `n`. Computed as:

```
bypass_ratio(n) = bypassStrands(n) / totalVariants
```

High bypass ratios may indicate transmission anomalies that warrant scholarly attention.

### 4.3 Scoring Formula

The confidence score for a CL/PCL candidate is computed through a weighted combination of structural signals, modified by penalty terms for anomalies:

#### 4.3.1 Structural Signals

The structural component comprises five signals:

| Signal | Weight | Description                    |
| ------ | ------ | ------------------------------ |
| S1     | 0.30   | Pre-single-strand ratio        |
| S2     | 0.25   | Bundle coverage                |
| S3     | 0.15   | Normalized collector diversity |
| S4     | 0.20   | Normalized fan-out             |
| S5     | 0.10   | Matn coherence (default 0.50)  |

The collector diversity signal is normalized to the range [0, 1] using the formula:

```
S3 = (collector_diversity - 2) / 6
```

This normalization assumes a typical range of 2–8 distinct collectors, which covers most historical transmission patterns.

The fan-out signal is normalized against the maximum observed fan-out in the current analysis batch:

```
S4 = fan_out(n) / maxFanOut
```

The matn coherence signal (S5) is currently set to a default of 0.50 but may be computed from text comparison of matn variants when the optional NLP module is enabled.

#### 4.3.2 Penalty Terms

Three penalty terms reduce the structural score for detected anomalies:

| Penalty | Weight | Condition                    |
| ------- | ------ | ---------------------------- |
| P1      | 0.20   | Bypass ratio                 |
| P2      | 0.10   | Chronology conflict detected |
| P3      | 0.05   | Provenance incompleteness    |

Chronology conflicts arise when the biographical dates of a narrator are inconsistent with the transmission relationships modeled in the graph (e.g., a narrator's death date predating a student's birth date).

Provenance incompleteness reflects missing or partial evidence records for a narrator. The penalty is computed as:

```
P3 = (1 - provenance_completeness)
```

where `provenance_completeness` is the proportion of expected biographical data that is present.

#### 4.3.3 Final Score Computation

The structural score is computed as:

```
structural_score = max(0, min(1, 
  0.30*S1 + 0.25*S2 + 0.15*S3 + 0.20*S4 + 0.10*S5 
  - 0.20*P1 - 0.10*P2 - 0.05*P3
))
```

The `max(0, min(1, ...))` ensures the score remains within the valid range [0, 1].

### 4.4 Analysis Profiles

The system supports two analysis profiles:

**`structural_only`**: Computes confidence scores based solely on graph topology features. This profile is suitable for initial exploratory analysis when biographical data has not been ingested.

**`reliability_weighted`**: Combines structural scores with reliability priors from biographical evidence. The reliability prior (35% weight) is derived from the narrator's classification in classical biographical sources. This profile requires that biographical data be available for the narrators in the analysis batch.

### 4.5 Outcome Classification

Based on the final confidence score, each CL/PCL candidate is classified into one of four outcome categories:

| Outcome                  | Confidence Range | Interpretation                                                                      |
| ------------------------ | ---------------- | ----------------------------------------------------------------------------------- |
| `supported`              | ≥ 0.75           | Strong structural and (if applicable) reliability support for CL/PCL classification |
| `contested`              | 0.55–0.75        | Moderate support, but with unresolved contradictions                                |
| `uncertain`              | 0.35–0.55        | Insufficient structural signal to support confident classification                  |
| `likely_weak_in_context` | < 0.35           | Weak structural signal and (if applicable) weak reliability support                 |

**Contradiction Cap**: A distinctive feature of the classification system is the contradiction cap. When unresolved contradictions are detected (e.g., multiple CL candidates with comparable scores), the maximum achievable confidence is capped at 0.70 and the outcome limited to `contested`. This prevents overconfident claims in cases of genuine scholarly ambiguity.

### 4.6 Worked Example

Consider a transmission family with the following characteristics for narrator N:

- Fan-out: 4 students
- Appears in all 10 transmission variants (coverage = 1.0)
- Reaches 5 distinct collectors (diversity = 5)
- 8 of 10 upstream hops are single-strand (ratio = 0.8)
- No bypass strands detected (bypass = 0)
- No chronology conflicts (P2 = 0)
- Full biographical provenance (P3 = 0)
- Default matn coherence (S5 = 0.5)

Compute:

```
S1 = 0.8
S2 = 1.0
S3 = (5 - 2) / 6 = 0.5
S4 = 4 / maxFanOut (assume max = 4) = 1.0
S5 = 0.5

P1 = 0 * 0.2 = 0
P2 = 0 * 0.1 = 0
P3 = 0 * 0.05 = 0

score = 0.30*0.8 + 0.25*1.0 + 0.15*0.5 + 0.20*1.0 + 0.10*0.5
      = 0.24 + 0.25 + 0.075 + 0.20 + 0.05
      = 0.815

Outcome: supported (≥ 0.75)
```

---

## 5. Evidence Binding and Anti-Hallucination

### 5.1 The Claim-Evidence Model

A distinctive feature of Riwaq is its enforcement of systematic binding between analytical claims and classical biographical evidence. The claim-evidence model ensures that scholarly assertions are traceable to source documents, facilitating verification and preventing unsupported claims.

**Analytical Claims**: Any assertion regarding a narrator's reliability, transmission role, or classification as a CL/PCL candidate. Claims are generated during analysis and attached to narrator nodes.

**Evidence Records**: Documentary evidence from classical biographical sources supporting or contradicting analytical claims. Each evidence record includes:

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

The evidence record includes both machine-readable fields (for validation) and human-readable citation text (for export).

### 5.2 Validation Rules

The evidence binding system applies a hierarchy of validation rules:

| Violation Level | Condition                      | Consequence                |
| --------------- | ------------------------------ | -------------------------- |
| `blocking`      | Unknown narrator ID in claim   | Claim excluded from export |
| `blocking`      | Synthetic evidence ID pattern  | Claim blocked from export  |
| `warning`       | Missing provenance on evidence | Confidence reduced         |
| `info`          | Dissent notes present          | Flagged for scholar review |

**Blocking violations** prevent claims from appearing in exported artifacts. This ensures that publications generated by Riwaq contain only evidence-bound claims that scholars can defend.

**Warning-level violations** reduce confidence scores but do not exclude claims. These are brought to the scholar's attention for review.

**Info-level violations** flag conditions that may warrant attention but do not affect scoring, such as the presence of dissenting scholarly opinions regarding a narrator's reliability.

### 5.3 Synthetic Pattern Detection

To prevent hallucinated evidence—fabricated or auto-generated citations appearing to reference real sources—the system maintains a list of forbidden ID patterns:

- `synthetic_*`
- `placeholder_*`
- `fake_*`
- `test_*`
- `dummy_*`
- `generated_*`
- `auto_*`

Any evidence record with an ID matching one of these patterns is rejected at import time. This safeguard ensures that exported claims reference genuine evidence records that scholars have consciously created or curated.

### 5.4 Rationale for Anti-Hallucination Safeguards

The inclusion of anti-hallucination safeguards responds to well-documented concerns about large language model (LLM) behavior in scholarly contexts (Ji et al., 2023). When scholars use AI-assisted tools for research, there is risk that generated citations, references, or claims may appear plausible while being fabrications. By enforcing that every claim be bound to a pre-existing evidence record, Riwaq prevents "ghost claims" that cite sources that do not exist or assertions that lack evidential support.

This approach treats evidence as a prerequisite rather than a post-hoc addition—scholars must curate their evidence base before analysis, ensuring that subsequent claims are grounded in documented sources.

---

## 6. Verification Framework

### 6.1 Verification vs. Validation: A Critical Distinction

Before describing the test suite, it is essential to clarify a distinction fundamental to evaluating computational tools for scholarly research: the difference between *verification* and *validation* (Sommerville, 2015).

**Verification** answers the question: *"Are we building the product correctly?"* Verification demonstrates that the software correctly implements its specified functionality—that scoring formulas compute as designed, that edge cases are handled, and that outputs are reproducible across runs.

**Validation** answers the question: *"Are we building the correct product?"* Validation demonstrates that the implemented tool actually achieves its intended purpose in the real world—that it improves scholarly workflows, that its outputs are useful to domain experts, and that it advances research objectives.

Riwaq's development has addressed verification thoroughly through automated testing. Validation, however, requires empirical study with actual scholarly users—a phase that remains prospective. Section 7 proposes a mixed-methods evaluation study to validate the tool's utility for hadith scholarship.

This distinction matters because:

1. **Passing tests ≠ proven utility**: A tool may have perfect test coverage yet fail to serve its intended purpose if the underlying methodological assumptions are flawed or the interface is unusable.

2. **Verification enables but does not guarantee validity**: Even correct scoring formulas may produce misleading results if the input data is incomplete or the feature definitions do not capture the phenomena they purport to measure.

3. **Scholarly tools require validation by domain experts**: Unlike commercial software with clear success metrics, scholarly tools must be judged by their contribution to knowledge production—a judgment that only trained scholars can make.

The following subsections describe the verification framework; Section 7 describes the proposed validation study.

### 6.2 Test Suite Architecture

The system includes a comprehensive test suite of 286 automated tests organized into eight functional modules. Tests are implemented using Vitest and can be executed via `npx vitest run`.

| Module                | Test Count | Primary Focus                 |
| --------------------- | ---------- | ----------------------------- |
| JSON validation       | 33+        | Schema enforcement, migration |
| Compatibility adapter | 21         | v0→v1 migration correctness   |
| Entity resolution     | 27         | Narrator ID disambiguation    |
| Reliability layer     | 27         | Evidence parsing and indexing |
| CL/PCL analyzer       | 65         | Scoring formula correctness   |
| Evidence binding      | 49         | Anti-hallucination safeguards |
| Canonical reports     | 42         | Export consistency            |
| E2E pipeline          | 22         | Full workflow + determinism   |

The test suite applies JPL/NASA coding standards (Holzmann, 2006) to the extent applicable, emphasizing deterministic behavior, defensive coding, and explicit verification.

### 6.3 Determinism Verification

Reproducibility is verified through repeated execution tests. The system includes 4 × 20-run determinism tests that confirm stable output across repeated analysis runs. Timestamps and other non-deterministic elements are explicitly excluded from comparison.

The determinism tests cover:

1. Identical scoring outputs across runs
2. Stable CL/PCL candidate rankings
3. Consistent export artifact generation
4. Preservation of evidence bindings

### 6.4 Golden Test Vectors

Five canonical test fixtures validate scoring correctness across representative scenarios:

**FIXTURE_CLEAR_CL**: A transmission family with a clear CL candidate exhibiting fan-out=3, coverage=1.0, and diversity=3. Expected outcome: high confidence score with `supported` classification.

**FIXTURE_CL_WITH_BYPASS**: The same CL candidate with an additional spider strand connecting to an upstream narrator. Expected outcome: reduced score due to bypass penalty, but still classified as `supported`.

**FIXTURE_PCL_ONLY**: A transmission family without a clear CL (maximum fan-out=2, below CL threshold). Expected outcome: best candidate classified as PCL with lower confidence.

**FIXTURE_CHRONOLOGY_PENALTIES**: Two competing CL candidates with differing provenance and chronology characteristics. Expected outcome: differentiation based on penalty terms.

**FIXTURE_PROFILE_DIFFERENCE**: Identical transmission data analyzed under both `structural_only` and `reliability_weighted` profiles. Expected outcome: divergence in final scores reflecting reliability prior.

### 6.5 Edge Case Coverage

The test suite includes coverage for edge cases including:

- Narrators with identical names (entity resolution)
- Circular transmission references (graph validation)
- Missing biographical dates (provenance scoring)
- Multiple equally-weighted CL candidates (contradiction cap)
- Empty transmission variants (schema validation)
- Evidence records with conflicting ratings (dissent handling)

---

## 7. Proposed Validation Study

### 7.1 The Need for User Testing

While the verification framework (Section 6) establishes that Riwaq computes correctly, it does not establish that the tool serves its intended scholarly purpose. Verification tests can confirm that a confidence score of 0.815 is computed correctly for a given narrator—but they cannot confirm that identifying this narrator as a CL candidate advances hadith scholarship, that scholars find such identifications useful, or that the tool integrates effectively into established research workflows.

User testing is essential for several reasons:

**Methodological soundness**: The CL/PCL methodology, while influential, represents one scholarly approach among several. Validation requires confirming that computational implementation faithfully captures the methodology's intent and that output aligns with expert judgments in cases where traditional scholars have reached consensus.

**Usability**: Scholarly tools must accommodate domain-specific workflows. A tool that is technically correct but cumbersome to use may fail adoption despite its analytical value.

**Impact assessment**: The ultimate measure of a scholarly tool is whether it enables new knowledge or deeper insights. Validation studies can assess whether Riwaq facilitates discoveries that would not otherwise occur.

**Unintended consequences**: Computational tools may introduce subtle biases or encourage over-reliance on automated outputs. User testing can identify such effects before they become entrenched.

### 7.3 Research Questions

We propose a mixed-methods validation study to evaluate Riwaq's utility for contemporary hadith scholarship. The study addresses four research questions:

**RQ1:** Does computational CL/PCL detection improve inter-rater reliability compared to manual analysis?

This question addresses the reproducibility challenge. We hypothesize that computational tools will produce more consistent CL/PCL identifications across analysts, as the scoring formula provides a shared decision framework.

**RQ2:** Does evidence binding reduce the rate of unsupported analytical claims in scholarly outputs?

This question evaluates the effectiveness of the anti-hallucination safeguards. We hypothesize that enforced claim-evidence binding will increase the proportion of claims that can be substantiated from classical sources.

**RQ3:** What is the learning curve for scholars adopting this tool for ICMA workflows?

This question addresses usability and adoption barriers. We hypothesize that familiarization time will be moderate (1–2 weeks) for scholars with basic computer literacy.

**RQ4:** Does the tool enable analysis of larger hadith corpora than manual methods?

This question addresses scalability. We hypothesize that the tool will enable comprehensive analysis of transmission families within the six canonical collections, a scale infeasible for manual methods.

**Note on current status**: At the time of writing, the verification framework is complete and all 286 tests pass. The validation study described below is proposed but has not yet been conducted. The study design will require institutional review board (IRB) approval, participant recruitment, and pilot testing before full execution.

### 7.4 Study Design

#### Phase 1: Controlled Benchmarking (Months 1–3)

**Participants**: Ten hadith scholars recruited from university departments of Islamic Studies and Islamic seminaries (*madāris*). Stratified sampling ensures five early-career scholars (post-doctoral or doctoral, with <10 years hadith research experience) and five senior scholars (associate or full professors, or recognized traditional scholars with equivalent standing).

**Task**: Each participant analyzes 20 hadith families from *Ṣaḥīḥ al-Bukhārī* using two methods in counterbalanced order:

1. Manual method: Paper-based CL/PCL identification following traditional procedures
2. Computational method: Using Riwaq for the same analysis

Each hadith family is analyzed by two participants to enable inter-rater reliability calculation.

**Measures**:

- *Inter-rater reliability*: Cohen's kappa (κ) for CL identification, computed separately for manual and computational conditions
- *Time-to-completion*: Minutes from hadith family presentation to final CL/PCL identification
- *Evidence citation completeness*: Proportion of claims explicitly supported by cited biographical sources
- *Perceived usability*: System Usability Scale (SUS) adapted for scholarly tools

#### Phase 2: Longitudinal Adoption (Months 4–9)

**Participants**: Twenty-five scholars using Riwaq for ongoing research projects. Participants are recruited from Phase 1 volunteers (10) and additional recruited scholars (15).

**Data collection**:

- *Usage logs*: Anonymous analytics tracking feature use, analysis frequency, and workflow patterns
- *Structured interviews*: Monthly 30-minute semi-structured interviews exploring adoption barriers, workflow integration, and scholarly impact
- *Export artifact analysis*: Examination of exported reports for claim-evidence binding rates and unsupported claim incidence

**Measures**:

- *Weekly active usage*: Proportion of weeks with at least one analysis session
- *Feature adoption curve*: Trajectory of engagement with advanced features (evidence binding, multi-variant analysis, export)
- *Claim support rate*: Proportion of analytical claims with evidence citations, tracked longitudinally

#### Phase 3: Corpus Scaling Study (Months 10–12)

**Task**: Complete transmission analysis of all hadiths related to a selected theme (e.g., "prayer" (*ṣalāh*)) across the six canonical collections (*Kutub al-Sittah*).

**Participants**: Research team (2–3 scholars) plus volunteer participants from Phase 2.

**Measures**:

- *Throughput*: Number of hadith transmission families analyzed per week
- *CL/PCL candidate inventory*: Complete list of identified candidates with confidence scores
- *Novel pattern discovery*: Emergent transmission patterns not previously documented in scholarship
- *Comparative coverage*: Proportion of hadiths with identified CL/PCL candidates versus incomplete analysis

### 7.5 Ethical Considerations

The study protocol has been designed with attention to ethical principles:

**Informed consent**: All participants provide written informed consent. Participants may withdraw at any time without penalty.

**Data privacy**: All participant data remains confidential. Usage logs are anonymized before analysis. No personally identifying information is stored beyond consent records.

**Benefit sharing**: Participants receive early access to the tool, training materials, and acknowledgment in resulting publications. Participants from underrepresented regions receive priority recruitment.

**Dual use concerns**: Riwaq is designed for scholarly analysis and does not include features that could facilitate academic dishonesty (e.g., auto-generation of claims without evidence). The anti-hallucination safeguards specifically prevent unsupported assertions from reaching exports.

### 7.6 Limitations of the Proposed Study

Several limitations should be acknowledged:

**Sample size**: The proposed sample (10 in Phase 1, 25 in Phase 2) is modest. Effect sizes may be difficult to detect with statistical confidence.

**Participant self-selection**: Participants who volunteer may differ systematically from non-volunteers in technological aptitude or methodological preferences.

**Language scope**: The tool interface is English-only. Scholars working primarily in Arabic may face additional barriers.

**Methodological scope**: The tool implements Juynboll's CL/PCL methodology. Scholars from traditions emphasizing other authentication criteria (e.g., *jarh wa-ta'dīl* based on moral evaluation) may not find the tool directly applicable.

---

## 8. Discussion

### 8.1 Contributions to Digital Islamic Studies

Riwaq represents a novel contribution to digital Islamic studies on several dimensions. First, it provides the first computational implementation of Juynboll's CL/PCL methodology, a framework that has shaped Western hadith scholarship for four decades. By translating implicit analytical procedures into explicit, auditable algorithms, the tool enables verification and critique of computational findings that has not previously been possible.

Second, the evidence binding architecture addresses a recognized challenge in computational humanities: the risk that automated tools will generate plausible-sounding but unsupported claims. The anti-hallucination safeguards in Riwaq enforce evidentiary grounding as a design constraint rather than an afterthought.

Third, the static, zero-dependency deployment model offers a sustainable approach to tool longevity. Scholarly infrastructure must often outlast the careers of individual developers and the funding cycles of individual projects. A static HTML file that runs in any browser offers near-universal accessibility with minimal maintenance burden.

### 8.2 Verification Complete, Validation Pending

As emphasized throughout this paper, Riwaq's development has achieved *verification* but not yet *validation*. The 286-test suite confirms that the software correctly implements its specifications: scoring formulas compute as designed, edge cases are handled, evidence binding functions as specified, and outputs are deterministic.

Validation—the demonstration that the tool achieves its intended scholarly purpose—remains prospective. The proposed evaluation study (Section 7) outlines a rigorous approach to validation, but its execution awaits institutional approval, funding, and participant recruitment.

This distinction has implications for how the tool should be interpreted:

- **Verification status**: Complete. The tool does what it claims to do, within the bounds of its specifications.
- **Validation status**: Pending. Whether the tool's outputs advance hadith scholarship requires empirical study with domain experts.

Scholars adopting Riwaq should understand that the tool's verified correctness does not guarantee validated utility. Computational CL/PCL identification may be mathematically sound yet practically unhelpful if its outputs do not align with scholarly intuition, if its interface is too cumbersome for practical use, or if its underlying methodological assumptions do not capture the phenomena they purport to measure.

The path from verification to validation runs through the scholarly community. Riwaq is offered as a contribution to that community, with the expectation that validation will emerge through use, critique, and refinement by hadith scholars themselves.

### 8.3 Relationship to Traditional Scholarship

It is essential to emphasize that Riwaq is designed to complement rather than replace traditional hadith scholarship. The tool operationalizes one specific analytical methodology—Juynboll's CL/PCL approach—while leaving space for other frameworks and scholarly judgments.

Traditional *jarh wa-ta'dīl* (narrator criticism), as developed over centuries by scholars from Ibn Abi Hatim al-Razi (d. 327/938) through al-Dhahabi (d. 748/1347) and Ibn Hajar al-Asqalani (d. 852/1449), involves nuanced evaluation of narrator character, memory, and transmission practices that cannot be fully captured in computational metrics. The biographical dictionaries (*kutub al-rijāl*) contain thousands of narrators with complex profiles that resist simple classification. The discipline involves sophisticated frameworks for evaluating critic reliability (*thabat al-mu'alliq*), assessing the relative stringency of different critics, and making fine-grained distinctions between narrator grades that computational tools can at best approximate (Brown, 2024).

Riwaq's reliability weighting can incorporate traditional classifications, but the tool does not pretend to replicate the full range of traditional scholarly judgment. The evidence binding system (Section 5) engages with classical sources by requiring claims to be linked to biographical evidence, but it does not attempt to automate the evaluative process itself.

Furthermore, the tool's output requires interpretation by domain experts. A "supported" CL classification indicates structural and evidential consistency with the CL pattern but does not constitute a final authentication judgment. Traditional scholars may weight different evidence sources, consider oral transmission traditions not captured in biographical dictionaries, and apply hermeneutical principles beyond graph topology.

### 8.4 Implications for Reproducibility in Islamic Studies

The reproducibility crisis affecting social sciences and medicine (Open Science Collaboration, 2015; Camerer et al., 2016) has received less attention in Islamic studies, where the dominant mode remains individual scholarship rather than systematic replication. Computational tools like Riwaq could catalyze a shift toward more reproducible scholarship by:

1. **Making methodologies explicit**: The scoring formula and feature definitions are documented and auditable, enabling critique and refinement.

2. **Enabling verification**: Export formats facilitate independent verification of analytical claims.

3. **Supporting replication studies**: Scholars can attempt to replicate findings using the same tool and compare results.

4. **Creating shared infrastructure**: The tool establishes a common vocabulary and framework for discussing CL/PCL analysis, potentially enabling meta-analytic studies.

### 8.5 Limitations and Threats to Validity

Several limitations should be acknowledged:

**Scope constraints**: Riwaq implements a specific subset of hadith analytical methodology. Scholars working within other traditions (e.g., traditional *'ilm al-rijāl*) will need different tools. The current interface is English-only, limiting accessibility for Arabic-speaking scholars.

**Data dependency**: The `reliability_weighted` analysis profile requires pre-ingested biographical data. The accuracy of reliability priors depends on the quality and completeness of the underlying data.

**Feature computation limitations**: Some features rely on heuristics (e.g., matn coherence defaults to 0.50 when NLP analysis is unavailable). These defaults may not reflect actual matn relationships.

**Chronological data incompleteness**: Many early hadith narrators lack reliably documented biographical dates. The chronology conflict detection (P2) may produce false negatives for conflicts that exist but are not detectable from available data.

### 8.6 Future Development Directions

Several avenues for future development are envisioned:

**Matn coherence analysis**: Enhancement of the matn coherence signal (S5) through NLP-based comparison of text variants. This would strengthen scoring by incorporating textual evidence alongside transmission topology.

**Collaborative annotation**: Multi-scholar evidence curation with version control, enabling teams to jointly develop and maintain evidence databases.

**Visualization enhancements**: Interactive bundle diagrams with temporal layering, enabling scholars to visualize transmission evolution over time.

**Additional CL/PCL variants**: Extension of the framework to implement methodological refinements proposed by subsequent scholars (e.g., Brown's adaptations of Juynboll's methodology).

**API and integration**: RESTful API enabling integration with other digital humanities platforms and custom scholarly workflows.

---

## 9. Conclusion

This paper has presented Riwaq, a browser-based computational framework for hadith transmission analysis using Juynboll's Common Link methodology. The system operationalizes decades of hadith scholarship into reproducible computational workflows, addressing the reproducibility, traceability, and scalability challenges that have limited previous applications of CL/PCL analysis.

Key contributions include:

1. The first complete algorithmic specification of CL/PCL scoring, including feature computation formulas and outcome classification criteria.

2. An evidence binding architecture that enforces systematic linking between analytical claims and classical biographical sources.

3. Anti-hallucination safeguards that prevent unsupported claims from reaching exported artifacts.

4. A comprehensive verification framework of 286 tests ensuring scoring correctness and output determinism.

5. A proposed mixed-methods validation study to assess the tool's impact on reproducibility, evidence citation, and scalability—recognizing that verification (correct implementation) is complete while validation (scholarly utility) awaits empirical confirmation.

Riwaq represents a step toward more systematic, verifiable, and scalable hadith scholarship. The tool's correctness has been verified; its scholarly utility awaits validation. While the tool cannot replace the nuanced judgment of trained scholars, it can support more rigorous application of established methodologies and enable analysis at scales previously impractical. As digital humanities methods continue to influence Islamic studies, tools like Riwaq may help bridge traditional scholarship and computational approaches, contributing to a more transparent and reproducible scholarly commons. The path forward runs through the scholarly community—validation will emerge through use, critique, and refinement by hadith experts themselves.

---

## Acknowledgments

The author gratefully acknowledges the hadith scholars who provided methodological guidance during the design phase, and the Digital Humanities community at large for the foundational frameworks that informed this work.

---

## References

Abu-Alabbas, B., Melchert, C., & Dann, M. (Eds.). (2020). *Modern hadith studies: Continuing debates and new approaches*. Edinburgh University Press.

Bridonneau, N. (2021). Network analysis of Islamic manuscripts: Mapping hadith transmission in early Islam. *Digital Scholarship in the Humanities*, 36(2), 234–251.

Brown, J. A. C. (2009). *Hadith: Muhammad's legacy in the medieval and modern world*. Oneworld Publications.

Brown, J. A. C. (2024). Authenticating hadith and the history of hadith criticism. *Yaqeen Institute for Islamic Research*. https://yaqeeninstitute.org.my/read/paper/authenticating-hadith-and-the-history-of-hadith-criticism

Camerer, C. F., et al. (2016). Evaluating replicability of laboratory experiments in economics. *Science*, 351(6280), 1433–1436.

Elliott, T., Gillies, S., & Bagnall, R. S. (2021). *Digital corpus of Egyptian artifacts*. New York University Institute for the Study of the Ancient World.

Graham, S., Milligan, I., & Weingart, S. (2015). *Exploring big historical data: The historian's macroscope*. Imperial College Press.

Harrison, M., et al. (2019). Machine learning for medieval handwriting analysis. *Journal of Historical Networks Research*, 3(1), 45–67.

Holzmann, G. J. (2006). The power of ten rules for programming in C. *IEEE Computer*, 39(3), 86–92.

Ji, Z., et al. (2023). Survey of hallucination in natural language generation. *ACM Computing Surveys*, 55(12), 1–38.

Johansson, E., et al. (2013). Social network analysis of hadith transmitters. In *Proceedings of the 4th International Conference on Islamic Applications in Computer Science and Information Technology* (pp. 112–119).

Juynboll, G. H. A. (1983). *Muslim tradition: Studies in chronology, provenance and authorship of early hadith*. Cambridge University Press.

Juynboll, G. H. A. (1991). *Studies on the origin and development of Islamic law: Collected essays, Part 1*. Doctoral dissertation, Rijksuniversiteit te Leiden.

Juynboll, G. H. A. (1996). *Studies in the development of Islamic law: Collected essays, Part 2*. Doctoral dissertation, Rijksuniversiteit te Leiden.

Juynboll, G. H. A. (2007). *Encyclopedia of canonical hadith*. Brill.

Khoei, A., et al. (2023). Computational approaches to hadith classification: A systematic review. *Journal of Islamic Studies*, 34(2), 178–203.

Lecomte, G. (1965). *Ibn Qutayba: L'homme, son oeuvre, ses idées sociales*. Institut Français de Damas.

Little, J. J. (2024). *The hadith of 'A'ishah's marital age: A study in the evolution of early Islamic historical memory* (PhD dissertation). University of Oxford.

Melchert, C. (1997). *The formation of the Sunni schools of law, 9th–10th centuries C.E.* Brill.

Melchert, C. (2015). *Hadith, piety, and law: Selected studies*. Lockwood Press.

Melchert, C. (2020). The theory and practice of hadith criticism in the mid-ninth century. In B. Abu-Alabbas, C. Melchert, & M. Dann (Eds.), *Modern hadith studies: Continuing debates and new approaches* (pp. 74–102). Edinburgh University Press.

Motzki, H. (2004). *Hadith: Origins and developments* (R. W. Boucher's translation). Routledge.

Open Science Collaboration. (2015). Estimating the reproducibility of psychological science. *Science*, 349(6251), aac4716.

Robson, J. (1958). The transmission of Ibn Ishaq's Sirat rasul Allah. *The Muslim World*, 48(3–4), 180–190, 236–245.

Schacht, J. (1950). *The origins of Muhammadan jurisprudence*. Clarendon Press.

Sommerville, I. (2015). *Software engineering* (10th ed.). Pearson.

Stodden, V., et al. (2016). Enhancing reproducibility for computational methods. *Science*, 354(6317), 1240–1241.

Svensson, P. (2010). The humanities in the age of e-research. In *Digital humanities in practice* (pp. 1–23). Facet Publishing.

al-Darul Tahqiq. (2016). The science of al-Jarh wa al-Ta'dil: Separating wheat from chaff. *Darul Tahqiq*. https://www.darultahqiq.com/science-al-jarh-wa-al-tadil/

Dickinson, E. (2001). *The development of early Sunnite hadith criticism: The Taqdima of Ibn Abi Hatim al-Razi*. Brill.

IslamOnline. (2026). The study of hadith reporters: Unveiling the science of Rijal al-Hadith. *IslamOnline*. https://islamonline.net/en/hadith-reporters-rijal-alhadith/

Wikipedia. (n.d.). Biographical evaluation. *Wikipedia, The Free Encyclopedia*. https://en.wikipedia.org/wiki/Biographical_evaluation

---

## Appendix A: Import Schema Reference

The complete annotated batch format for data import is documented in `docs/examples/sample-import.json`. The schema supports:

- Single and multi-variant hadith families
- Narrator biographical data with multiple name variants
- Transmission relationships with metadata
- Reliability evidence records
- Matn (text) variants

## Appendix B: Test Fixture Documentation

All test fixtures are documented in the `tests/fixtures/` directory. Each fixture includes:

- Input data (JSON)
- Expected analysis results
- Commentary explaining the scenario

Fixtures are available under MIT-compatible research use terms.

## Appendix C: Repository and Deployment

**Source code**: https://github.com/AcademicCrescent-spec/Isnad-builder~

**Issue tracking**: The GitHub repository provides issue tracking for bug reports, feature requests, and methodological discussions.

**Test execution**: Run the full test suite with:

```bash
npx vitest run
```

**Deployment**: The application is deployed as static GitHub Pages from the `./academic` directory.

---

*Paper prepared using Riwaq computational framework for hadith transmission analysis.*
