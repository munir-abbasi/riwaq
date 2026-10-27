# Hadith al-Jassāsah: source inventory and Riwaq-ready ICMA notes

**Research date:** 26 October 2026  
**Purpose:** A source-grounded collation of the principal extant transmission and wording variants of the report associated with Tamīm al-Dārī, al-Jassāsah, and the Dajjāl, prepared against Riwaq’s current import model.

## Scope and method

“All variants” cannot be certified without defining a corpus and checking the relevant printed editions or manuscript witnesses. This collation covers the fully readable primary-source witnesses located in the principal hadith collections and selected early musnads/musannafs. It records separately each materially distinct isnād route or matn witness. Later repetitions that reproduce a route are listed as corroborating source locations, not automatically treated as independent transmission evidence. Numbering varies by edition; collection, book/chapter, and stable digital references are supplied where available.

The report is narrated through Fāṭimah bint Qays in the sources collated here. The central long-form family is transmitted from her mainly through ʿĀmir al-Shaʿbī. Other recoverable paths include a brief al-Zuhrī–Abū Salamah version and a path through Yaḥyā ibn Yaʿmar. Tamīm, his cousin, and the unnamed island man are characters/reporters within the **matn**; they are not to be inserted into the formal isnād between Fāṭimah and the Prophet.

## Route inventory

The arrays in the companion JSON are ordered from the earliest narrator in the report toward the compiler, matching Riwaq’s `isnad_chain` convention. In the table below, arrows are written in that same direction. “Collector” names the compiler of the cited witness.

| ID | Source and locator | Complete route (Fāṭimah → compiler) | Witness profile |
|---|---|---|---|
| M-A1 | Ṣaḥīḥ Muslim, Kitāb al-Fitan, bāb Qiṣṣat al-Jassāsah, 2942a | Fāṭimah → ʿĀmir al-Shaʿbī → ʿAbd Allāh ibn Buraydah → al-Ḥusayn ibn Dhakwān (al-Muʿallim) → ʿAbd al-Wārith ibn Saʿīd → ʿAbd al-Ṣamad ibn ʿAbd al-Wārith → ʿAbd al-Wārith ibn ʿAbd al-Ṣamad → Muslim | Long narrative embedded in Fāṭimah’s first-person account; includes her request that al-Shaʿbī report something heard directly from the Prophet. Muslim also names Ḥajjāj ibn al-Shaʿir as a second route into ʿAbd al-Ṣamad; see M-A1b. |
| M-A1b | Same, 2942a | Fāṭimah → ʿĀmir al-Shaʿbī → ʿAbd Allāh ibn Buraydah → al-Ḥusayn ibn Dhakwān → ʿAbd al-Wārith ibn Saʿīd → ʿAbd al-Ṣamad ibn ʿAbd al-Wārith → Ḥajjāj ibn al-Shaʿir → Muslim | Same lower chain and wording as M-A1; distinct compiler-level path, not an independent route below ʿAbd al-Ṣamad. |
| M-B | Ṣaḥīḥ Muslim 2942b | Fāṭimah → ʿĀmir al-Shaʿbī → Sayyār Abū al-Ḥakam → Qurrah ibn Khālid → Khālid ibn al-Ḥārith → Yaḥyā ibn Ḥabīb al-Ḥārithī → Muslim | Long report; the excerpt foregrounds Fāṭimah’s attendance at the sermon and says Tamīm’s “cousins/kinsmen” travelled by sea. |
| M-C1 | Ṣaḥīḥ Muslim 2942c | Fāṭimah → ʿĀmir al-Shaʿbī → Ghaylān ibn Jarīr → Jarīr ibn Ḥāzim → Wahb ibn Jarīr → al-Ḥasan ibn ʿAlī al-Ḥulwānī → Muslim | Abridged opening: Tamīm himself reports that his ship lost its way and he landed on an island; the rest is referred to as the same. |
| M-C2 | Ṣaḥīḥ Muslim 2942c | Fāṭimah → ʿĀmir al-Shaʿbī → Ghaylān ibn Jarīr → Jarīr ibn Ḥāzim → Wahb ibn Jarīr → Aḥmad ibn ʿUthmān al-Nawfalī → Muslim | Same route above Wahb and same textual witness; a second teacher of Muslim through Wahb. |
| M-D | Ṣaḥīḥ Muslim 2942d | Fāṭimah → ʿĀmir al-Shaʿbī → Abū al-Zinād ʿAbd Allāh ibn Dhakwān → al-Mughīrah al-Ḥizāmī → Yaḥyā ibn Bukayr → Abū Bakr ibn Isḥāq → Muslim | Abridged opening attributed to people of Tamīm’s tribe; their boat breaks and some reach the island on a plank. |
| AD-1 | Sunan Abī Dāwūd 4325, Kitāb al-Malāḥim, bāb fī khabar al-Jassāsah | Fāṭimah → Abū Salamah ibn ʿAbd al-Raḥmān → Muḥammad ibn Shihāb al-Zuhrī → Muḥammad ibn ʿAbd al-Raḥmān ibn Abī Dhiʾb → ʿUthmān ibn ʿAbd al-Raḥmān → al-Nufaylī → Abū Dāwūd | Short version: Tamīm relates the incident “from a man” on an island; the text focuses on the Jassāsah, chained Dajjāl, and whether the Prophet has appeared and been obeyed. |
| AD-2 | Sunan Abī Dāwūd 4326 | Fāṭimah → ʿĀmir al-Shaʿbī → ʿAbd Allāh ibn Buraydah → Ḥusayn al-Muʿallim → ʿAbd al-Wārith ibn Saʿīd → ʿAbd al-Ṣamad ibn ʿAbd al-Wārith → Ḥajjāj ibn Abī Yaʿqūb → Abū Dāwūd | Long sermon version; Tamīm travels with thirty men of Lakhm and Judhām; includes the Prophet’s eastward gesture. Same lower transmission branch as Muslim 2942a. |
| AD-3 | Sunan Abī Dāwūd 4327 | Fāṭimah → ʿĀmir al-Shaʿbī → Mujālid ibn Saʿīd → Ismāʿīl ibn Abī Khālid → al-Muʿtamir ibn Sulaymān → Muḥammad ibn Ṣudrān → Abū Dāwūd | Very short notice that the Prophet prayed ẓuhr, ascended the minbar, and then narrated the story. Abū Dāwūd adds that Ibn Ṣudrān was drowned at sea and was the only survivor. |
| AD-4 | Sunan Abī Dāwūd 4328 | Jābir ibn ʿAbd Allāh → Abū Salamah ibn ʿAbd al-Raḥmān → al-Walīd ibn ʿAbd Allāh ibn Jumayʿ → Muḥammad ibn Fuḍayl → Wāṣil ibn ʿAbd al-Aʿlā → Abū Dāwūd | A distinct companion route, not a Fāṭimah route. The matn has people whose food runs out at sea; Abū Salamah explains the Jassāsah; it refers to the preceding story and adds that Jābir testified the Dajjāl was Ibn Ṣayyād. Keep it as a separate record inside the broader narrative family. |
| T | Jāmiʿ al-Tirmidhī 2253, Abwāb al-Fitan, “Hadith of Tamīm al-Dārī about the Dajjāl” | Fāṭimah → ʿĀmir al-Shaʿbī → Qatādah ibn Diʿāmah → Hishām al-Dastawāʾī → Muʿādh ibn Hishām → Muḥammad ibn Bashshār → al-Tirmidhī | Compressed version, explicitly described by al-Tirmidhī as ṣaḥīḥ gharīb by way of Qatādah from al-Shaʿbī; it says people of Palestine sailed, describes a hairy beast and the questions about the spring, lake, Baysan, and the Prophet. |
| IM | Sunan Ibn Mājah 4074, Kitāb al-Fitan | Fāṭimah → ʿĀmir al-Shaʿbī → Mujālid ibn Saʿīd → Ismāʿīl ibn Abī Khālid → ʿAbd Allāh ibn Numayr → Muḥammad ibn ʿAbd Allāh ibn Numayr → Ibn Mājah | Distinctive matn: Tamīm’s **cousin** tells the island story; the beast is described as black and shaggy; the Dajjāl asks about the Arabs’ political/religious condition, Zughar, Baysan, and Tiberias. Sunnah.com labels the report weak in its displayed Darussalam grading; retain the wording as a witness without importing that label as an independent verdict. |
| N | al-Sunan al-Kubrā lil-Nasāʾī 4453 (some takhrīj references number the related route 4258) | Fāṭimah → ʿĀmir al-Shaʿbī → Dāwūd ibn Abī Hind → Ḥammād ibn Salamah → al-Ḥajjāj ibn Muḥammad → Muḥammad ibn al-Muthannā → al-Nasāʾī | Long sermon version; this route also appears in Aḥmad and other collections. It includes the Persia question and reports the Dajjāl’s jump. |
| A | Musnad Aḥmad 27102 in the al-Risālah/takhrīj numbering (older online numbering: 26066) | Fāṭimah → ʿĀmir al-Shaʿbī → Dāwūd ibn Abī Hind → Ḥammād ibn Salamah → ʿAffān ibn Muslim → Aḥmad ibn Ḥanbal | Long version, closely related to the Nasāʾī route; textual differences include the question about Persia and the wording of the Jassāsah and the Dajjāl’s leap. |
| IS | Muṣannaf Ibn Abī Shaybah 40425 | Fāṭimah → ʿĀmir al-Shaʿbī → Mujālid ibn Saʿīd → Ḥammād ibn Usāmah (Abū Usāmah) → Ibn Abī Shaybah | Cousin-of-Tamīm version, closely related to Ibn Mājah 4074, transmitted through a different upper route. |
| H | Ṣaḥīḥ Ibn Ḥibbān 6787 | Fāṭimah → Yaḥyā ibn Yaʿmar → ʿAbd Allāh ibn Buraydah → Kahmas ibn al-Ḥasan → ʿAwn ibn Kahmas → al-Faḍl ibn Mūsā → Hārūn ibn ʿĪsā ibn al-Sikkīn → Ibn Ḥibbān | A distinct route from the long al-Shaʿbī family. It has Tamīm report the voyage with thirty men; the Jassāsah is called a young woman/servant in this wording; the Dajjāl asks about Baysan, Zughar, and the Prophet. |

### Additional source witnesses to collate against print editions

Indexes and takhrīj references also point to Musnad al-Ḥumaydī 372; Musnad Abī Dāwūd al-Ṭayālisī 1756; Musnad Isḥāq ibn Rāhwayh; Musnad Aḥmad; Muṣannaf Ibn Abī Shaybah 38792 and 40425; Ṣaḥīḥ Ibn Ḥibbān 6795–6797; al-Muʿjam al-Kabīr and al-Muʿjam al-Awsaṭ of al-Ṭabarānī; Mustakhraj Abī ʿAwānah; Dalāʾil al-Nubuwwah of al-Bayhaqī; and Sharḥ Mushkil al-Āthār of al-Ṭaḥāwī. Some are repeated transmission paths already represented above; they must be checked individually before being counted as new routes. The present import seed includes only the witnesses for which the displayed chain and text were directly collated here.

## Matn comparison: useful pericopes

Use the following pericopes to align the witnesses. Do not normalize away wording differences before preserving each source transcription.

1. **Report frame:** Fāṭimah’s direct account of the Prophet’s sermon; whether the Prophet delayed prayer, summoned the congregation, or ascended the minbar; whether Tamīm is introduced as a Christian convert.
2. **Voyage and identity of travelers:** thirty men from Lakhm and Judhām; people of Palestine; “people of Tamīm’s tribe”; Tamīm’s cousin; or “a man” from an island. These are not interchangeable claims about who personally saw the events.
3. **Island arrival:** storm at sea for a month, landfall at sunset, lost course, shipwreck and plank, or wind-driven arrival. Some versions omit the voyage mechanics.
4. **Jassāsah description:** a hairy beast, shaggy creature, black shaggy thing, a female figure dragging hair, or a “jāriyah” dragging hair; some versions say its front could not be distinguished from its back.
5. **Dajjāl encounter:** bound/iron shackles; “greatest human” versus old man; chained to a monastery; a question sequence whose order and contents vary.
6. **Questions and answers:** Baysan’s date palms, Lake Tiberias, spring of Zughar, the Prophet’s mission and Arab response; a Persia question occurs in some expanded routes but is absent in others.
7. **Identification and eschatological claims:** “I am the Dajjāl/al-Masīḥ”; permission to emerge; entry into all lands except Mecca/Taybah; angels guarding Medina; and the Prophet’s gesture toward the east. These details are unevenly present.

The most diagnostic textual issue for the present collation is the change in **attribution inside the story**: the mainstream long wording reports Tamīm’s own account; Ibn Mājah 4074 and Ibn Abī Shaybah 40425 say a cousin/kinsman of Tamīm reported it; Abū Dāwūd 4325 presents Tamīm as transmitting it “from a man” on an island. Abū Dāwūd 4328 gives a separate Jābir report, then adds a claim identifying the Dajjāl with Ibn Ṣayyād. Riwaq should preserve these formulations as distinct pericope readings and keep Jābir’s companion route visible instead of merging it into Fāṭimah’s formal isnād.

## Preliminary isnād-cum-matn analysis

### Observations

- Most full-form witnesses converge at Fāṭimah → al-Shaʿbī, then branch widely: Ibn Buraydah/Husayn al-Muʿallim; Sayyār/Qurrah; Ghaylān/Jarīr; Abū al-Zinād; Qatādah; Dāwūd ibn Abī Hind; and Mujālid. The chain multiplicity above al-Shaʿbī establishes a substantial **transmission branch** in the surviving record; it does not by itself establish independent eyewitness routes for the island encounter.
- A smaller, highly compressed report reaches Fāṭimah through Abū Salamah → al-Zuhrī. It does not preserve the long question sequence. Its text itself inserts an unnamed intermediary (“a man” on an island), a meaningful difference from the direct-Tamīm framing in the long report.
- Ibn Ḥibbān 6787 preserves a route through Yaḥyā ibn Yaʿmar and ʿAbd Allāh ibn Buraydah rather than al-Shaʿbī. It is a valuable route-level comparison, but it is a single collected witness in this collation and its exact textual relationship to the long al-Shaʿbī family needs closer edition-level comparison.
- The “cousin of Tamīm” wording occurs with the Mujālid route in Ibn Mājah and Ibn Abī Shaybah. Because the same unusual attribution appears on that branch, it may be branch-associated rather than a random difference between compilers. This remains a hypothesis until all copies and routes are collated.
- Several narrators are repeated across collections because compilers transmit the same lower isnād through different teachers. For example, Abū Dāwūd 4326 and Muslim 2942a share the ʿAbd al-Ṣamad → ʿAbd al-Wārith → Ḥusayn → Ibn Buraydah → al-Shaʿbī stretch. Counting those as wholly independent supports would inflate apparent route diversity.

### Inference, with limits

On a graph built from the witnesses above, al-Shaʿbī is a strong **structural common-link candidate for the widely branching long-form family**. Fāṭimah is the shared source node for all included paths; the report is not “single-strand” after her in this dataset. The Abū Salamah and Yaḥyā ibn Yaʿmar paths complicate any claim that al-Shaʿbī is the sole transmitter of every form. Riwaq’s CL/PCL score should therefore be reported as a property of this corpus and these encoding decisions, not as a direct measure of historical authenticity or the date when the narrative originated.

Matn comparison suggests that the long form has at least two distinguishable subfamilies: (a) the direct-Tamīm, sermon-framed form with extensive regional questions and Medina protection; (b) the Mujālid form with the cousin attribution and the question about the Arabs’ religious/political condition. A short Abū Salamah–al-Zuhrī form is another compressed line. These are working groupings for testing, not final reconstructions.

### Questions for the next pass

1. Does the Ibn Ḥibbān/Yaḥyā ibn Yaʿmar witness contain wording shared uniquely with one al-Shaʿbī sub-branch?
2. Is the cousin attribution confined to Mujālid in the earliest accessible witnesses, or does it appear elsewhere?
3. Which question order is stable across branches: Baysan → Tiberias → Zughar, or other arrangements? Where do Persia and “Arab unity” enter?
4. How do the printed editions and manuscript apparatuses treat the Abū Salamah wording and the “man on an island” clause?
5. Are routes in al-Ṭayālisī, al-Ḥumaydī, Isḥāq ibn Rāhwayh, al-Ṭabarānī, Abū ʿAwānah, and al-Bayhaqī genuinely additional edges, or repetitions of already represented lines?

## Riwaq import notes

The companion JSON targets the repository’s current `schemas/import-batch.json` and `schemas/hadith-record.json` contracts: schema version 1; one family; stable narrator IDs; source provenance; ordered `isnad_chain`; source-form `isnad_raw`; and per-witness `matn_raw`. Riwaq’s chain orientation is source narrator → later transmitters → compiler. The Prophet is not inserted as a narrator node in `isnad_chain`; the isnād ends at Fāṭimah, while the prophetic attribution belongs in the matn.

The JSON is a **structural seed**. It does not add rijāl ratings, reliability evidence, disputed dates, or machine-generated narrator identities. These should be added only after separately sourced biographical work. Likewise, the source reports’ collected grading labels are recorded in this document but not converted into a reliability prior. Pericope-level segmentation is described above for a later Riwaq matn-apparatus pass; the import seed preserves each reading in `matn_raw` and avoids unsupported schema extensions. It contains 16 source-path witnesses across two records (15 Fāṭimah paths and one Jābir path), 60 narrator profiles, and representative Arabic matn excerpts; ellipses indicate that `matn_raw` is not a full diplomatic transcription. The source inventory above names additional collections whose witnesses still need route-by-route collation before “all variants” can be claimed in an edition-level sense.

When analyzing in Riwaq:

- Start with `structural_only` and inspect the full chain graph and each source record.
- Keep the source-level duplicate routes visible, but remember that repeated lower isnāds do not equal independent transmission lines.
- Compare scores after grouping duplicate collection attestations or testing one representative per distinct route; report sensitivity to that choice.
- Do not interpret a high CL score as proof of fabrication, and do not interpret a higher branch count as proof of authenticity.
- Use a separate reliability-weighted profile only after attaching sourced, narrator-specific reliability evidence.

## Primary text links and source references

- [Ṣaḥīḥ Muslim 2942a](https://sunnah.com/muslim:2942a), [2942b](https://sunnah.com/muslim:2942b), [2942c](https://sunnah.com/muslim:2942c), [2942d](https://sunnah.com/muslim:2942d)
- [Sunan Abī Dāwūd 4325](https://sunnah.com/abudawud:4325), [4326](https://sunnah.com/abudawud:4326)
- [Sunan Abī Dāwūd 4327](https://sunnah.com/abudawud:4327), [4328](https://sunnah.com/abudawud:4328)
- [Jāmiʿ al-Tirmidhī 2253](https://sunnah.com/tirmidhi:2253)
- [Sunan Ibn Mājah 4074](https://sunnah.com/ibnmajah/36)
- [al-Sunan al-Kubrā lil-Nasāʾī 4453](https://www.islamweb.net/ar/library/content/406/4489/دور-مكة)
- [Musnad Aḥmad 26066 in the older online numbering](https://ar.wikisource.org/wiki/مسند_أحمد_بن_حنبل/مسند_القبائل/6) and [27102 in the al-Risālah/takhrīj numbering](https://dorar.net/h/1NZ7DS1X?osoul=1)
- [Muṣannaf Ibn Abī Shaybah 40425](https://islamicurdubooks.com/hadith/hadith-.php?bookid=33&hadith_number=40425)
- [Ṣaḥīḥ Ibn Ḥibbān 6787](https://www.islamweb.net/ar/library/content/314/6795/ذكر-الإخبار-عن-وصف-العلامتين-اللتين-تظهران-عند-خروج-المسيح-الدجال-من-وثاقه)
- Riwaq implementation references: [README](https://github.com/munir-abbasi/riwaq/blob/main/README.md), [HadithRecord schema](https://github.com/munir-abbasi/riwaq/blob/main/schemas/hadith-record.json), [ImportBatch schema](https://github.com/munir-abbasi/riwaq/blob/main/schemas/import-batch.json), and [ICMA core methodology](https://github.com/munir-abbasi/riwaq/blob/main/docs/domain/ICMA-CORE-METHODOLOGY.md).

**Reference caution:** Sunnah.com and other digital repositories are finding aids and text witnesses, not manuscript-critical editions. Verify punctuation, exact isnād phrasing, edition numbering, and variant readings against the edition you intend to cite in publication.
