> **Domain background.** Not an implementation contract. This document describes hadith-scholarship methodology, not Riwaq runtime behavior. Design suggestions here are proposals, not decisions — see `docs/DECISIONS.md` for the binding decision ledger and `docs/STATUS.md` for the implemented/designed/envisioned triage.

These terms describe the methodological concepts used in isnad-cum-matn analysis. They are background for understanding Riwaq's analytical model, not a database or UI specification.

**1. Isnad (The Chain)**
The *isnad* is the chronological chain of transmitters reporting the hadith, typically formatted as "A heard from B, who heard from C, who heard from the Prophet."

* **App Context:** In software, an *isnad* is essentially a directed graph. Each transmitter is a node, and the transmission of hearing/reporting is the edge connecting them.

**2. Matn (The Text)**
The *matn* is the actual narrative content or saying of the hadith.

* **Riwaq context:** Textual comparison may expose exact and normalized differences, but any semantic equivalence or transmission-by-meaning judgment must remain explicit and evidence-aware. Do not infer an NLP capability unless the owning implementation provides it.

**3. Variant / Tariq (The Pathway)**
A *tariq* (plural: *turuq*) is a single, complete instance of a hadith as recorded in a specific physical book (like *Sahih al-Bukhari* or the *Musannaf* of Ibn Abi Shaybah). It consists of one specific *isnad* securely attached to one specific *matn*.

* **App Context:** The *tariq* is the base record in your database. Every variation in wording or chain branching stems from comparing different *turuq* against one another.

**4. Common Link (CL)**
The Common Link is a structural candidate identified from the branching pattern of the analyzed transmission family. It is commonly discussed as an early narrator from whom multiple downstream branches are represented in the corpus. Its historical meaning depends on the quality, independence, chronology, and completeness of the evidence.

* **Riwaq context:** CL/PCL detection is owned by the analyzer and its documented feature rules. Do not replace that contract with a generic highest-out-degree shortcut or infer historical authorship from the detected structure.

**5. Partial Common Link (PCL)**
A PCL is a downstream branching candidate associated with a larger CL/PCL structure. It represents a sub-branch in the analyzed transmission family rather than an independent verdict about historical reliability.

* **App Context:** PCLs are critical because they group the textual data. If you want to know what the Common Link actually said, you don't look at every individual end-student; you look at the aggregated reports of the PCLs.

**6. Reconstructed Earlier Form**
A reconstructed earlier form is not a physical text found in a source. It is a *hypothetical* wording inferred from agreements and differences across relevant branches. It should be treated as a model-dependent reconstruction, not the exact wording taught by the Common Link or the ultimate original of the report.

* **Riwaq context:** Software may assist comparison and expose shared or branch-specific wording. A reconstructed form remains an analytical proposal whose provenance, assumptions, and uncertainty must be visible; these definitions do not assert an automatic reconstruction feature.
