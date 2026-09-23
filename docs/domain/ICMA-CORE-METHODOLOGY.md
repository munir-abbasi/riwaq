> **Domain background.** Not an implementation contract. This document describes hadith-scholarship methodology, not Riwaq runtime behavior. Design suggestions here are proposals, not decisions — see `docs/DECISIONS.md` for the binding decision ledger and `docs/STATUS.md` for the implemented/designed/envisioned triage.

The core of isnad-cum-matn analysis lies in systematically cross-referencing textual variation with transmission structure. Software can assist this process, but the steps below do not imply that every step is automated in Riwaq.

> **Scope:** This is methodological background. Riwaq's runtime contracts are defined by the architecture documents and owning source modules.

**1. Exhaustive Collection (Data Ingestion)**
The researcher should assemble the relevant recorded instances (*turuq*) as completely as feasible and document the searched corpus and known gaps.

* **Riwaq context:** Imported records must preserve source provenance, chain structure, matn, and corpus boundaries. Search or NLP capabilities should not be inferred from this methodological requirement.

**2. Construct the Isnad Bundle / Stemma (Graph Generation)**
Once all variants are collected, the individual chains are mapped onto a single, unified tree structure called a stemma, tracing the pathways back in time.

* **Riwaq context:** Graph structure is derived only after narrator identity and transmission data are represented canonically. The browser visualization is an evidence surface over that state, not an independent analytical authority.

**3. Identify the Common Links (Node Analysis)**
By analyzing the stemma, the researcher pinpoints the Common Link (CL)—the oldest narrator where multiple independent chains converge—as well as the Partial Common Links (PCLs) who act as the major sub-branching points below the CL.

* **Riwaq context:** Candidate detection is owned by the analyzer's explicit feature and classification rules. Generic out-degree alone is not the implementation contract and does not establish historical authorship or authenticity.

**4. Synoptic Comparison of the Matn (Text Diffing)**
The researcher places all the textual variants side-by-side to meticulously highlight where words were added, omitted, structurally shifted, or swapped for synonyms.

* **Riwaq context:** Software can expose textual differences and support synoptic comparison. Semantic normalization or Arabic root analysis is an additional capability only if implemented and documented by its owning module.

**5. Correlate Text with Transmission Branches (The Core Analysis)**
This is the "cum-matn" step. The researcher checks whether textual variations cluster with *isnad* branches. If PCL A's branch consistently contains a phrase absent from PCL B's branch, the pattern can support an inference that the variation arose at or before the recoverable A branch point. Such correlation strengthens a transmission hypothesis but does not by itself authenticate the tree.

* **Riwaq context:** Computation may group variants and expose branch-associated features. Historical attribution of a wording to a person or date remains an evidence-bound analytical claim.

**6. Reconstruct an Earlier Recoverable Form (Dating and Synthesis)**
By comparing wording shared across branches with branch-specific differences, the researcher may propose an earlier recoverable form associated with the Common Link horizon. The result is a reconstruction under stated assumptions, not an attested exact original.

* **Riwaq context:** Shared wording can be computed as a feature, but a historical reconstruction must preserve its evidence, assumptions, competing variants, and uncertainty. This document does not assert an automatic Urtext generator.
