> **Domain background.** Not an implementation contract. This document describes hadith-scholarship methodology, not Riwaq runtime behavior. Design suggestions here are proposals, not decisions — see `docs/DECISIONS.md` for the binding decision ledger and `docs/STATUS.md` for the implemented/designed/envisioned triage.

**Isnad-cum-matn analysis (ICMA)** is a modern historical-critical method used in Islamic studies to investigate the transmission history of hadith reports. By correlating variations in a hadith’s text (*matn*) with variations in its chain of transmitters (*isnad*), scholars can test hypotheses about earlier recoverable forms and circulation within the analyzed corpus.

> **Scope:** This document is methodological background for Riwaq. It is not a runtime specification. Implemented behavior is defined by the owning source modules and repository architecture documents.

For software designed to assist hadith scholars, the key distinction is between computationally detectable structure and the historical interpretation a scholar may draw from it.

---

## 1. Background and Origins

Before the late 20th century, Western academic study of hadith was heavily influenced by the skepticism of Orientalist scholars like **Ignaz Goldziher** and **Joseph Schacht**. They argued that most hadiths were not authentic words of the Prophet Muhammad, but rather later fabrications retrojected backwards by scholars in the 2nd and 3rd Islamic centuries to justify legal doctrines.

Schacht and later **G.H.A. Juynboll** developed **"Common Link" theory**. They observed that when mapping out the various chains (*isnads*) of a single hadith, the chains often converged on a single narrator in the first or second century. Juynboll argued this "Common Link" was usually the fabricator of the hadith.

In the 1990s, the German scholar **Harald Motzki** became closely associated with the development and use of **isnad-cum-matn analysis**. Motzki argued that a Common Link did not necessarily indicate forgery. By studying both chains and textual variation across branches, ICMA can provide evidence consistent with circulation earlier than the surviving collections in which reports are preserved.

## 2. Core Definitions

To understand ICMA, several structural terms are required:

* **Isnad:** The chain of transmitters (e.g., A heard from B, who heard from C).
* **Matn:** The actual text or narrative content of the hadith.
* **Variant / Tariq:** A single, unique pathway of a hadith recorded in a specific collection (like Sahih al-Bukhari or the Musannaf of 'Abd al-Razzaq).
* **Common Link (CL):** A transmitter upon whom multiple independent chains converge. The CL is the oldest narrator that multiple later students claim to have heard the hadith from.
* **Partial Common Link (PCL):** A student of the Common Link who passes the hadith on to multiple students of their own, creating a "sub-branch" in the transmission tree.
* **Reconstructed earlier form:** A hypothetical wording inferred from agreements and differences across branches. It is an analytical reconstruction, not an attested exact original.

## 3. The ICMA Methodology Step-by-Step

ICMA is data-intensive. Software can reduce the mechanical cost of visualization, comparison, and traceability while leaving historical interpretation explicit.

1. **Corpus Definition and Collection:**
The researcher assembles the relevant versions of a report as completely as feasible and records the searched corpus and known gaps.


2. **Construct the Isnad Bundle (Stemma):**
The researcher maps out every chain of transmission into a massive visual tree (a stemma). This network reveals where the different chains diverge and where they converge.


3. **Identify Common-Link Candidates:**
By analyzing the stemma, the researcher identifies **Common Link (CL)** and **Partial Common Link (PCL)** candidates from the recoverable branching structure. Their historical meaning remains a separate interpretive question.


4. **Synoptic Comparison of the Matn:**
This is the "cum-matn" part. The researcher places the texts of all the variants side-by-side and meticulously highlights additions, omissions, synonymous word swaps, and structural changes.


5. **Correlate Text with Transmission Branches:**
The core analytical step: if the students of PCL "A" share a wording while the students of PCL "B" share a different wording, the clustering supports an inference that the variation arose at or before the recoverable branch point. The correlation does not by itself authenticate the transmission network.


6. **Reconstruct an Earlier Recoverable Form (Dating):**
By comparing agreements and branch-specific variations, the researcher may propose an earlier recoverable form associated with the Common Link horizon. That can support a candidate circulation window within the analyzed evidence; it does not establish the report's ultimate origin or exact wording.


## 4. Interpretation of Results

When an ICMA is completed, the results tell the scholar about the **historical circulation** of the text, not necessarily its ultimate theological truth.

* **Transmission correlation:** Alignment between textual variation and *isnad* branches can strengthen a historical transmission hypothesis, but it does not itself authenticate every edge or narrator.
* **Dating circulation:** A Common Link and correlated branch structure may support an earliest recoverable circulation window within the analyzed corpus. This should not be described as the report's proven ultimate origin.
* **Bypass, dive, and spider patterns:** A chain that bypasses an established branch while sharing branch-specific wording is a structural anomaly that can justify closer historical scrutiny. The pattern is not, by itself, proof of forgery.

## 5. Limitations to Consider for App Development

* **Data Requirements:** Strong CL/PCL inferences require enough independent branching and textual variation. Sparse material should remain explicit as insufficient for that structural inference rather than being forced into a conclusion.
* **Scope of Verification:** ICMA does not definitively prove attribution to the Prophet Muhammad, nor does a Common Link establish the ultimate origin of a report.
* **Labor Intensity:** Synoptic Arabic comparison is labor-intensive and can benefit from software assistance, while historical interpretation remains a scholarly judgment that must retain provenance and uncertainty.

For Riwaq's implementation semantics, use `docs/AGENT-OPERATING-MODEL.md`, `docs/ARCHITECTURE.md`, and the owning source modules rather than this background document.
