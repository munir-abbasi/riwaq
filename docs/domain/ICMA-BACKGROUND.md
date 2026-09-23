> **Domain background.** Not an implementation contract. This document describes hadith-scholarship methodology, not Riwaq runtime behavior. Design suggestions here are proposals, not decisions — see `docs/DECISIONS.md` for the binding decision ledger and `docs/STATUS.md` for the implemented/designed/envisioned triage.

The background of isnad-cum-matn analysis (ICMA) lies in scholarly debates over how the age and transmission history of hadith reports can be investigated from surviving evidence.

> **Scope:** This is methodological background, not a runtime specification for Riwaq. Historical conclusions remain scholarly interpretations of evidence rather than software verdicts.

**1. The Traditional Islamic Methodology**
For centuries, classical Muslim scholars (*muhaddithin*) evaluated hadiths primarily by scrutinizing the *isnad*. They focused on biographical evaluation (*ilm al-rijal*) to ensure that every narrator in the chain was of sound character and memory, and that there were no hidden gaps in the timeline of transmission. While they did evaluate the text (*matn*), the mathematical continuity of the chain was the primary vehicle for authentication.

**2. Early Western Skepticism**
In the late 19th and early-to-mid 20th centuries, Western Orientalists like **Ignaz Goldziher** and **Joseph Schacht** approached hadith literature with intense skepticism. They hypothesized that the vast majority of hadiths were not historically from the Prophet Muhammad. Instead, they argued that scholars in the 2nd and 3rd Islamic centuries fabricated these sayings to justify their own emerging legal and theological doctrines, retroactively inventing clean chains of transmission to give their new rules ancient authority.

**3. The Discovery of the "Common Link"**
A few decades later, scholars like **G.H.A. Juynboll** began mapping out all the different chains for individual hadiths. He noticed a pattern: chains often converged on a single teacher living in the 1st or 2nd Islamic century. Juynboll called this figure the "Common Link." However, operating under the earlier skepticism, Juynboll argued that this Common Link was not just a transmitter, but actually the mastermind who fabricated the hadith and disseminated it to his students.

**4. Motzki and ICMA**
In the 1990s, the German scholar **Harald Motzki** became closely associated with a more systematic combination of chain analysis and close textual comparison. He argued that a Common Link should not automatically be equated with fabrication and that correlated textual variation across branches can preserve evidence relevant to earlier transmission history.

ICMA therefore provides a way to test whether textual variation is structured in relation to transmission branches. Such correlation can support hypotheses of earlier circulation and branch-specific development, but it does not by itself establish that a Common Link was historically reliable, that every transmission edge is genuine, or that the report has been recovered in its exact original form.

For Riwaq, the useful computational role is to expose the relevant evidence structure, preserve provenance, and make competing interpretations auditable. The software should not turn that structure into automatic authenticity or forgery verdicts.
