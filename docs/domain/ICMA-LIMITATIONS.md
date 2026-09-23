> **Domain background.** Not an implementation contract. This document describes hadith-scholarship methodology, not Riwaq runtime behavior. Design suggestions here are proposals, not decisions — see `docs/DECISIONS.md` for the binding decision ledger and `docs/STATUS.md` for the implemented/designed/envisioned triage.

Software-assisted isnad-cum-matn analysis has both technical and epistemological limits. These constraints should shape how evidence is represented and interpreted without being mistaken for a runtime feature specification.

> **Scope:** This document describes methodological limits. Architecture and implemented capabilities are defined elsewhere in the repository.

**1. Data Scarcity and the *Ahad* Problem**
Strong CL/PCL inference depends on enough independent branching and textual variation to discriminate between competing transmission hypotheses. Sparse or solitary material may still be described and compared, but it may be insufficient for the structural inference ICMA is being asked to support.

* **Riwaq context:** Sparse families remain explicit as `insufficient_data` when the analyzer cannot support a CL/PCL candidate. This analytical state is distinct from schema validation failure or evidence-binding failure.

**2. The Computational Weight of Classical Arabic NLP**
Comparing variants of highly inflected classical Arabic is not equivalent to exact string matching. Synonyms, word order, orthography, morphology, and transmission by meaning can all complicate comparison, and semantic equivalence may require scholarly judgment.

* **Riwaq context:** Exact or normalized textual comparison should expose what was computed and what remains interpretive. This limitation does not imply an NLP, LLM, remote-GPU, or context-server architecture unless such a capability is explicitly implemented and documented by its owning module.

**3. UI/UX Constraints for Complex Graphs**
A complete stemma for a widely transmitted hadith can contain hundreds of nodes and intersecting edges. Rendering this directed acyclic graph (DAG) without it turning into an unreadable "hairball" is a significant frontend challenge.

* **Design consideration:** Readability, RTL text handling, and selective graph focus can improve analysis of large stemmata. Treat these as UI design considerations unless the browser implementation and tests establish them as current product behavior.

**4. Epistemological Boundaries (The Limits of Verification)**
ICMA is a historical-critical tool, not a theological verdict. A CL/PCL pattern can support claims about recoverable circulation within the analyzed evidence, but it does not establish that the Common Link is the ultimate origin, prove the remaining path to the Prophet Muhammad, or prove the exact text existed in the reconstructed form at a particular moment.

* **Riwaq context:** Visual and report language should distinguish reported source data, derived structural features, analytical inferences, and unresolved uncertainty. A rendered edge is not automatically a historically verified transmission event, so the UI should not encode that stronger meaning without evidence from the owning layer.
