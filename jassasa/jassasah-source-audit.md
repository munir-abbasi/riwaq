# Al-Jassāsah: source-based isnād-cum-matn audit

Research date: 26 October 2026. Language: English, with diagnostic Arabic. Report identified from the existing `jassasa` files: the island encounter associated with Tamīm al-Dārī, al-Jassāsah, and the Dajjāl.

The most consequential correction to the preliminary study is that **the kinsmen attribution is not exclusive to Mujālid**. It occurs in Muslim’s Sayyār branch and other branches in al-Ṭabarānī. A combination of readings, rather than that single feature, supports a narrower Mujālid grouping. The analysis below concerns the surviving digital texts and reported transmission structures; it does not establish the island encounter as an independently observed historical event.

## 1. Corpus, method, and counting rules

The core audit rechecks every source location represented in `jassasah-riwaq-import.json`: Muslim 2942a–d; Abū Dāwūd 4325–4328; al-Tirmidhī 2253; Ibn Mājah 4074; al-Nasāʾī’s *Kubrā* at Islamweb’s 4453; Aḥmad at Wikisource’s 26066; Ibn Abī Shaybah 40425; and Ibn Ḥibbān 6787. Targeted searches added al-Ṭayālisī 1751 and four selected al-Ṭabarānī attestations, 956, 960, 967, and 968. These additions test the preliminary study’s proposed wording clusters. They do not constitute a complete search of either musnad or muʿjam.

**Coverage is complete only for the 19 listed digital entries as retrieved**, including their displayed abbreviations. It is not exhaustive for any whole collection, the Six Books, early hadith literature, printed editions, or manuscripts. No printed page image or manuscript was inspected. “Verified” below means the Arabic was read at the linked primary-work transcription, not that its agreement with a printed or manuscript exemplar has been certified. Search snippets, modern discussions, and automated narrator/route counts are discovery aids only.

Primary Arabic is retained continuously in [the source-text bundle](jassasah-source-texts.md). The chain appendix below gives its original chain wording and normalized paths. HTML links are removed, but ambiguous names, source conjunctions, internal quotations, and abridgment notices remain. Editorial extraction boundaries do not determine the boundaries of prophetic speech.

Counting units:

- **19 source attestations**: 18 attributed through Fāṭimah and one through Jābir. Two teachers joined in a single source entry do not create two textual attestations.
- **20 unambiguously parsed compiler paths from 18 attestations**: M-A and M-C each have two compiler paths. P-967 is the nineteenth attestation, retained but deferred from linear encoding because its conjunction needs resolution. “Unambiguous” concerns path syntax, not proof of every narrator’s identity or actual hearing.
- **12 lower-branch classes in the encoded graph**: nine named pupil branches after al-Shaʿbī, two other reported approaches to Fāṭimah, and one Jābir branch. These are declared graph equivalence classes, not 12 independent historical sources. Abbreviated identity expansions noted below remain provisional.
- **18 Riwaq records / 20 variants / 71 narrator profiles** in [the audited import](jassasah-audited-import.json). The original files are retained unchanged. Empty reliability evidence means no narrator grades were supplied.

The nine al-Shaʿbī pupil labels are Ibn Buraydah, Sayyār, Ghaylān, Abū al-Zinād, Qatādah, Dāwūd, Mujālid, Muḥammad ibn Ayyūb Abū ʿĀṣim, and al-Shaybānī. P-967 also names Ibrāhīm ibn ʿĀmir, but no additional resolved edge is counted from its ambiguous packet.

## 2. Source inventory and witness table

Every row links the Arabic actually examined. Book/chapter and digital page locators appear again in the chain appendix. Sunnah.com’s letter suffixes are web identifiers, not separate manuscript witnesses. Printed edition metadata is **unverified** for those entries. Islamweb’s displayed volumes/pages and numbers are usable digital locators; publication, editor, and edition identity have not been independently established.

| ID | Primary-work transcription examined | Paths | Coverage and dependence |
|---|---|---:|---|
| M-A | [Muslim 2942a, al-Fitan, Qiṣṣat al-Jassāsah](https://sunnah.com/muslim:2942a) | 2 | One entry; two teachers into ʿAbd al-Ṣamad; wording assigned to ʿAbd al-Wārith ibn ʿAbd al-Ṣamad |
| M-B | [Muslim 2942b, same chapter](https://sunnah.com/muslim:2942b) | 1 | Sayyār–Qurrah; narrative abbreviated by source |
| M-C | [Muslim 2942c, same chapter](https://sunnah.com/muslim:2942c) | 2 | One entry; two teachers from Wahb; source abbreviates middle |
| M-D | [Muslim 2942d, same chapter](https://sunnah.com/muslim:2942d) | 1 | Abū al-Zinād branch; abbreviated |
| AD-1 | [Abū Dāwūd 4325, al-Malāḥim, Khabar al-Jassāsah](https://sunnah.com/abudawud:4325) | 1 | Abū Salamah–al-Zuhrī approach to Fāṭimah; short continuous account |
| AD-2 | [Abū Dāwūd 4326, same chapter](https://sunnah.com/abudawud:4326) | 1 | Same lower branch as M-A, through ʿAbd al-Ṣamad; explicitly abbreviated |
| AD-3 | [Abū Dāwūd 4327, same chapter](https://sunnah.com/abudawud:4327) | 1 | Mujālid–Ismāʿīl; frame and cross-reference only |
| AD-4 | [Abū Dāwūd 4328, same chapter](https://sunnah.com/abudawud:4328) | 1 | Jābir–Abū Salamah; explanatory dialogue and Ibn Ṣayyād appendix |
| T | [al-Tirmidhī 2253, al-Fitan, Tamīm’s Dajjāl report](https://sunnah.com/tirmidhi:2253) | 1 | Qatādah branch |
| IM | [Ibn Mājah 4074, al-Fitan, Dajjāl/ʿĪsā/Yaʾjūj chapter](https://sunnah.com/ibnmajah:4074) | 1 | Mujālid–Ismāʿīl; shares lower chain with AD-3 |
| N | [al-Nasāʾī, al-Kubrā, displayed 4453, 5:261](https://www.islamweb.net/ar/library/content/406/4489/دور-مكة) | 1 | Dāwūd–Ḥammād branch; website heading “Dūr Makkah” under Manāsik needs edition checking |
| A | [Aḥmad, Fāṭimah section, displayed 26066](https://ar.wikisource.org/wiki/مسند_أحمد_بن_حنبل/مسند_القبائل/6) | 1 | Dāwūd–Ḥammād ibn Salamah, through ʿAffān; 27102 crosswalk not independently verified |
| IS | [Ibn Abī Shaybah, al-Fitan, 40425, displayed pp. 392–393](https://islamicurdubooks.com/hadith/hadith-.php?bookid=33&hadith_number=40425) | 1 | Mujālid–Abū Usāmah; site identifies 40425 as al-Shathrī numbering, crosswalk 38791 as ʿAwwāmah |
| H | [Ibn Ḥibbān, al-Tārīkh, 6787, 15:194–195](https://www.islamweb.net/ar/library/content/314/6795/ذكر-الإخبار-عن-وصف-العلامتين-اللتين-تظهران-عند-خروج-المسيح-الدجال-من-وثاقه) | 1 | Yaḥyā ibn Yaʿmar → Ibn Buraydah; memory qualification retained |
| Y | [al-Ṭayālisī, Fāṭimah section, 1751, 3:216–217](https://www.islamweb.net/ar/library/content/1064/1747/ما-روت-فاطمة-بنت-قيس) | 1 | Same Sayyār–Qurrah lower route as M-B; fuller text. [Index crosswalk](https://hdith.com/encyclopedia/book/b-21/h/181958) labels 1756, with Dār Hajr 1751 |
| P-956 | [al-Ṭabarānī, al-Kabīr, Fāṭimah/al-Shaʿbī section, 956, 24:385–386](https://www.islamweb.net/ar/library/content/84/20558/عامر-الشعبي-عن-فاطمة-بنت-قيس) | 1 | Muḥammad ibn Ayyūb Abū ʿĀṣim branch |
| P-960 | [Same section, 960, 24:392–393](https://www.islamweb.net/ar/library/content/84/20562/عامر-الشعبي-عن-فاطمة-بنت-قيس) | 1 | al-Shaybānī branch; embedded corroboration notices distinguished from main chain |
| P-967 | [Same section, 967, 24:399–400](https://www.islamweb.net/ar/library/content/84/20569/عامر-الشعبي-عن-فاطمة-بنت-قيس) | deferred | Qatādah / Ibrāhīm ibn ʿĀmir conjunction preserved; no silently resolved path |
| P-968 | [Same section, 968, 24:401](https://www.islamweb.net/ar/library/content/84/20570/عامر-الشعبي-عن-فاطمة-بنت-قيس) | 1 | Sayyār–Qurrah again, through Ḥammād ibn Masʿadah |

An additional compiler attestation can preserve useful wording while offering no new lower branch. Shared lower isnāds demonstrate genealogical dependence in the reported transmission, but do not by themselves prove one compiler copied another’s book. No such literary copying is asserted here.

## 3. Matn alignment

Symbols: **R** = source refers to a fuller narrative without reproducing it; **ND** = not displayed in this text; **ND is not proof of absence from the transmitted narrative**. B = Baysan palms; L = lake explicitly named Ṭabariyyah unless stated otherwise; Z = Zughar spring; P = prophet/Arab-response questions; F = Persia. Lists record the displayed order, not a reconstructed archetype. Primary citations are the linked witness IDs in §2 and in the chain appendix.

| Witness | Frame and travelers | First encounter / captive | Displayed question order | Ending or distinctive apparatus |
|---|---|---|---|---|
| M-A | Fāṭimah’s marital/residence account; prayer then smiling sermon; Tamīm’s conversion; Tamīm + thirty of Lakhm/Judhām | Hairy beast; front/back indistinguishable; huge man tightly bound | B → L → Z → P | Forty nights; Mecca and Ṭaybah barred; angels; eastward gesture threefold wording |
| M-B | Dates/barley visit and divorce question; sermon; Tamīm’s kinsmen | R | R | Rod directed toward ground: “هذه طيبة” |
| M-C | Tamīm’s ship loses course; seeks water | “إنسانا يجر شعره”; middle R | R | All lands except Ṭaybah; Tamīm brought before people |
| M-D | Sermon; people of Tamīm’s group; broken ship/plank | R | R | R |
| AD-1 | Delayed late evening prayer; Tamīm “عن رجل” on an island | Woman dragging hair; castle; man dragging hair, chained and leaping | P | “أنا الدجال” precedes P; obedience is better for them |
| AD-2 | Prayer/sermon; Tamīm’s conversion; thirty; month at sea | Hairy beast; huge bound man | B → Z → P in abbreviated summary | R within body; eastward wording twice; no inference that L was absent in transmission |
| AD-3 | Ẓuhr; unusual ascent outside Friday | R | R | Compiler’s separate notice about Ibn Ṣudrān |
| AD-4 | Sermon; unnamed travelers run out of food and seek bread | Jassāsah; Abū Salamah’s explanation calls it a woman; castle | B → Z in abbreviated summary | Memory notice; Jābir/Ibn Ṣayyād identification and objections appended |
| T | Smiling sermon; people of Palestine | Hair-clad beast; far end of settlement; chained man | Z → unnamed lake → B → P | Leap; Dajjāl identification; Ṭaybah exception |
| IM | Unusual sermon; joy prevents siesta; “ابن عم لتميم” | Black shaggy thing; distressed old man | P → Z → B → L | Arabs united in god/religion; three sighs; Ṭaybah; armed angels until resurrection |
| N | Urgent ascent and public summons; people of Palestine | Beast, sex obscured by hair; “رجل ضرير” in iron | P → F → Z → L → B | Leap feared to overturn him; Mecca/Ṭaybah exceptions |
| A | Same broad frame and Palestine group as N | Beast, sex obscured; “رجل ضرير ومصفد” | P → F → Z → L → B | Leap thought likely to free him; Mecca/Ṭaybah; reassurance to Muslims |
| IS | Midday prayer/sermon; joy prevents siesta; group of Tamīm’s kinsmen | Black hairy thing; sex uncertain; distressed old man; greeting exchanged | P → Z → B → L | Arab unity; three sighs; alternative release wording; Ṭaybah; armed angels |
| H | Direct-hearing request to Fāṭimah; summons/sermon; Tamīm + thirty of Lakhm/Judhām; month | “جارية تجر شعرها”; huge bound man | B → Z → P | “إنه صادق فاتبعوه”; Kahmas explicitly cannot remember part; forty mornings |
| Y | Dates/barley/divorce frame; Tamīm’s kinsmen | Beast concealed by hair; iron-bound man | P → B → L → Z | Mecca/Ṭaybah; rod gesture; “ومكة مكة” |
| P-956 | Dates/drink visit; unusual midday sermon; kinsmen | Sex obscured; iron-bound man against mountain slope | P → B → Z → L | Three movements/falls with sigh; Mecca/Ṭaybah; repeated gesture toward Iraq |
| P-960 | Ẓuhr and public alarm; kinsmen | Hair-obscured human; bound, groaning man; travelers identify with Palestine/Arabia | P → L → Z → B | Ṭaybah/angels; al-Shaʿbī’s subsequent corroboration dialogues |
| P-967 | Al-Shaʿbī’s Medina visit; sermon; kinsmen trading by sea | Hair-obscured being calls itself “الجساس”; iron-burdened man | P → L → B → Z | Questions about follower status, growth, and return; Ṭaybah; Iraq gesture |
| P-968 | Dates/barley visit; summons; kinsmen | Beast concealed by hair; iron-bound human | P → L → B → Z | Mecca/Ṭaybah; gesture toward Medina |

### Diagnostic readings and their significance

**The introductory circumstances also require comparison.** M-A says “نَكَحْتُ ابْنَ الْمُغِيرَةِ”, followed by “فَأُصِيبَ فِي أَوَّلِ الْجِهَادِ” and “فَلَمَّا تَأَيَّمْتُ”; M-B instead has “طَلَّقَنِي بَعْلِي ثَلاَثًا”. These are different descriptions of the transition into Fāṭimah’s waiting-period/residence narrative, not interchangeable wording. The precise force of *uṣība* and its relationship to the divorce account need separate historical/commentarial checking; this audit does not resolve them through the English translation. AD-1 places the announcement after a delayed late evening prayer, AD-3 explicitly names ẓuhr, and IM connects the joy to a missed siesta. Such settings could reflect reframing or more than one telling, but the sources examined do not decide between those explanations. [M-A](https://sunnah.com/muslim:2942a), [M-B](https://sunnah.com/muslim:2942b), [AD-1](https://sunnah.com/abudawud:4325), [AD-3](https://sunnah.com/abudawud:4327), [IM](https://sunnah.com/ibnmajah:4074).

**Attribution within the narrative varies substantively.** M-A reads “حَدَّثَنِي أَنَّهُ رَكِبَ” with thirty men; M-B reads “إِنَّ بَنِي عَمٍّ لِتَمِيمٍ الدَّارِيِّ رَكِبُوا”; IM reads “أَلاَ إِنَّ ابْنَ عَمٍّ لَتَمِيمٍ الدَّارِيِّ أَخْبَرَنِي”; AD-1 reads “تَمِيمٌ الدَّارِيُّ عَنْ رَجُلٍ كَانَ فِي جَزِيرَةٍ”. These respectively present Tamīm’s voyage, his kinsmen’s voyage, a cousin informing the speaker, and a report concerning/from an unnamed island man. The first-person transitions and “عن رجل” require comparison without forcing a single referent. The island man must not automatically be equated with the unnamed intermediary. T’s “نَاسًا مِنْ أَهْلِ فِلَسْطِينَ” also does not explicitly place Tamīm among those travelers. [M-A](https://sunnah.com/muslim:2942a), [M-B](https://sunnah.com/muslim:2942b), [IM](https://sunnah.com/ibnmajah:4074), [AD-1](https://sunnah.com/abudawud:4325), [T](https://sunnah.com/tirmidhi:2253).

**The cousin/kinsmen feature is not branch-exclusive.** Besides Mujālid’s IM/IS, it occurs on Sayyār’s M-B/Y/P-968, Muḥammad ibn Ayyūb’s P-956, and al-Shaybānī’s P-960. Singular/plural is itself a difference: IM has “ابن عم”, whereas IS has “رهطا من بني عمه”. The preliminary seed’s IS excerpt should not erase that distinction. [IS](https://islamicurdubooks.com/hadith/hadith-.php?bookid=33&hadith_number=40425), [Y](https://www.islamweb.net/ar/library/content/1064/1747/ما-روت-فاطمة-بنت-قيس), [P-956](https://www.islamweb.net/ar/library/content/84/20558/عامر-الشعبي-عن-فاطمة-بنت-قيس), [P-960](https://www.islamweb.net/ar/library/content/84/20562/عامر-الشعبي-عن-فاطمة-بنت-قيس).

**The encountered being changes description.** M-A’s “دَابَّةٌ أَهْلَبُ كَثِيرُ الشَّعَرِ” is a heavily hairy beast; AD-1’s “بِامْرَأَةٍ تَجُرُّ شَعْرَهَا” is a woman dragging her hair; H’s “جارية تجر شعرها” uses *jāriyah*. AD-4’s female description answers a transmitter’s question to Abū Salamah, rather than appearing directly inside the initial prophetic quotation. These are differences of both content and attribution level. Grammatical feminine reference to a beast is not, by itself, identification as a woman. [M-A](https://sunnah.com/muslim:2942a), [AD-1](https://sunnah.com/abudawud:4325), [AD-4](https://sunnah.com/abudawud:4328), [H](https://www.islamweb.net/ar/library/content/314/6795/ذكر-الإخبار-عن-وصف-العلامتين-اللتين-تظهران-عند-خروج-المسيح-الدجال-من-وثاقه).

**Persia is an observed Dāwūd–Ḥammād cluster in this sample.** N has “ما فعلت فارس؟ ... لم يظهر عليها بعد ... أما إنه سيظهر عليها”, before Z → L → B. A has the same position and broad exchange. This is more discriminating than merely sharing Palestinian geography. T has Z → lake → B → P and no Persia question displayed. The combined Persia-plus-order agreement is evidence of a textual relationship within the Dāwūd branch; it does not prove Ḥammād created the detail or date its composition after a conquest. [N](https://www.islamweb.net/ar/library/content/406/4489/دور-مكة), [A](https://ar.wikisource.org/wiki/مسند_أحمد_بن_حنبل/مسند_القبائل/6), [T](https://sunnah.com/tirmidhi:2253).

**A multi-feature Mujālid cluster is better supported than a cousin-only cluster.** IM combines “بِشَيْخٍ مُوثَقٍ ... يُظْهِرُ الْحُزْنَ شَدِيدِ التَّشَكِّي”, “إِلَهُهُمْ وَاحِدٌ وَدِينُهُمْ وَاحِدٌ”, and “فَزَفَرَ ثَلاَثَ زَفَرَاتٍ”, with P → Z → B → L. IS shares the distressed old man, Arab unity, repeated sighing, and question order, through Abū Usāmah rather than Ismāʿīl. AD-3 preserves the unusual prayer/sermon frame on the Mujālid–Ismāʿīl line but abbreviates the story; it cannot independently confirm all those motifs. P-956 and P-960 share some, but not all, features, limiting any claim of exclusivity. [IM](https://sunnah.com/ibnmajah:4074), [IS](https://islamicurdubooks.com/hadith/hadith-.php?bookid=33&hadith_number=40425), [AD-3](https://sunnah.com/abudawud:4327), [P-956](https://www.islamweb.net/ar/library/content/84/20558/عامر-الشعبي-عن-فاطمة-بنت-قيس), [P-960](https://www.islamweb.net/ar/library/content/84/20562/عامر-الشعبي-عن-فاطمة-بنت-قيس).

**Question order varies within a shared lower branch.** Y has P → B → L → Z, whereas P-968 has P → L → B → Z; both pass through Sayyār and Qurrah. M-B gives only the opening and a reference. Thus neither one fixed question order nor a reconstructed full M-B text can be assigned to that branch. The lack of a stable order also warns against treating every reordering as a different report. [Y](https://www.islamweb.net/ar/library/content/1064/1747/ما-روت-فاطمة-بنت-قيس), [P-968](https://www.islamweb.net/ar/library/content/84/20570/عامر-الشعبي-عن-فاطمة-بنت-قيس), [M-B](https://sunnah.com/muslim:2942b).

**Memory qualifications and abbreviations constrain negative comparisons.** H states “قال كهمس: فذكر ابن بريدة شيئا لم أحفظه”; AD-4 has “إن في هذا الحديث شيئا ما حفظته”. M-B/M-D have “وساق الحديث”, M-C “واقتص الحديث”, AD-2 “فذكر الحديث”, and AD-3 “ثم ذكر هذه القصة”. These expressions license neither insertion of another witness’s words nor an inference that every undisplayed episode was absent. By contrast, the distinct traveler attribution, human/beast description, Persia question, question sequence, and speaker changes are positive observed differences. [H](https://www.islamweb.net/ar/library/content/314/6795/ذكر-الإخبار-عن-وصف-العلامتين-اللتين-تظهران-عند-خروج-المسيح-الدجال-من-وثاقه), [AD-4](https://sunnah.com/abudawud:4328), [Muslim’s chapter](https://sunnah.com/muslim:2942b), [AD-2](https://sunnah.com/abudawud:4326), [AD-3](https://sunnah.com/abudawud:4327).

## 4. Transmission graph and joint interpretation

Direction throughout the normalized graph is **earliest named source narrator → later transmitters → compiler**. Fāṭimah’s/Jābir’s prophetic attribution remains in the quoted text; Tamīm and travelers within the sermon are not silently spliced into the formal collector-to-companion isnād. This keeps the nested information chain visible without representing it as independently collected eyewitness transmission.

```text
Fāṭimah
 ├─ al-Shaʿbī
 │   ├─ Ibn Buraydah ─ Ḥusayn ─ ʿAbd al-Wārith ─ ʿAbd al-Ṣamad
 │   │                                          ├─ [two teachers] ─ Muslim M-A
 │   │                                          └─ Ḥajjāj ibn Abī Yaʿqūb ─ Abū Dāwūd AD-2
 │   ├─ Sayyār ─ Qurrah
 │   │             ├─ Khālid ─ Yaḥyā ─ Muslim M-B
 │   │             ├─ al-Ṭayālisī Y
 │   │             └─ Ḥammād ibn Masʿadah ─ ... ─ al-Ṭabarānī P-968
 │   ├─ Ghaylān ─ Jarīr ─ Wahb ─ [two teachers] ─ Muslim M-C
 │   ├─ Abū al-Zinād ─ al-Mughīrah ─ ... ─ Muslim M-D
 │   ├─ Qatādah ─ Hishām ─ Muʿādh ─ ... ─ al-Tirmidhī T
 │   ├─ Dāwūd ─ Ḥammād [N provisionally identified with ibn Salamah]
 │   │              ├─ ʿAffān ─ Aḥmad A
 │   │              └─ al-Ḥajjāj ─ Ibn al-Muthannā ─ al-Nasāʾī N
 │   ├─ Mujālid
 │   │    ├─ Ismāʿīl ─ al-Muʿtamir ─ Ibn Ṣudrān ─ Abū Dāwūd AD-3
 │   │    │           └─ Ibn Numayr ─ his son ─ Ibn Mājah IM
 │   │    └─ Abū Usāmah ─ Ibn Abī Shaybah IS
 │   ├─ Muḥammad ibn Ayyūb Abū ʿĀṣim ─ ... ─ al-Ṭabarānī P-956
 │   └─ al-Shaybānī ─ Ibn Fuḍayl ─ ... ─ al-Ṭabarānī P-960
 ├─ Abū Salamah ─ al-Zuhrī ─ Ibn Abī Dhiʾb ─ ... ─ Abū Dāwūd AD-1
 └─ Yaḥyā ibn Yaʿmar ─ Ibn Buraydah ─ Kahmas ─ ʿAwn ─ ... ─ Ibn Ḥibbān H

Jābir ─ Abū Salamah ─ al-Walīd ibn ʿAbd Allāh ibn Jumayʿ ─ ... ─ Abū Dāwūd AD-4

P-967: Qatādah / Ibrāhīm ibn ʿĀmir packet: retained in source form; attachment unresolved.
```

Ellipses in this overview abbreviate **known chains supplied completely in the appendix**, not missing persons reconstructed by the analyst. P-967’s unresolved attachment is a different case.

**Al-Shaʿbī is the principal observed common-link candidate for the Fāṭimah subcorpus.** Nine named pupil branches follow him in the encoded data. This is a structural observation. The Abū Salamah and Yaḥyā ibn Yaʿmar lines prevent calling him the only reported transmitter of every version. Ibn Buraydah occurs in both the al-Shaʿbī and Yaḥyā approaches, so H is not entirely disjoint transmission after Fāṭimah. Its thirty travelers/month-long voyage agrees with M-A, while its *jāriyah* description resembles human descriptions elsewhere. Shared wording could reflect inherited material, convergence, or transmission interaction; the single H attestation does not discriminate between them.

**Possible partial common links require attention to where branching actually occurs.** Qurrah has three distinct onward pupils in this sample: Khālid, al-Ṭayālisī, and Ḥammād ibn Masʿadah. Mujālid branches to Ismāʿīl and Abū Usāmah, while Ismāʿīl branches to al-Muʿtamir and Ibn Numayr. The Dāwūd–Ḥammād pair reaches A/N through two onward pupils, conditionally on the abbreviated-name identification in N. In M-A/AD-2, branching at ʿAbd al-Ṣamad is compiler-side multiplicity, not additional pupils directly from al-Shaʿbī. These nodes are candidates for structural subdivision, not automatically historical promulgators. No numerical Riwaq CL score or authenticity verdict is claimed.

**The Jābir witness remains a comparator.** Its famine/bread opening, narrator-level female explanation, and Ibn Ṣayyād discussion distinguish it from a second direct copy of Fāṭimah’s long sermon. It shares the island/Jassāsah/captive motif and two place questions. The appended “شهد جابر أنه هو ابن صياد” is testimony attributed to Jābir within this transmission, not a conclusion reached by combining the island narrative with biographical knowledge. A broad comparison family accommodates it; a sensitivity analysis of Fāṭimah’s CL pattern should also exclude AD-4. [AD-4](https://sunnah.com/abudawud:4328).

**Source chronology gives constraints, not an origin date.** Al-Ṭayālisī’s biographical tradition places his death in 203 or 204 AH; its disagreement is explicit in [al-Mizzī, Tahdhīb al-Kamāl 11:408](https://islamweb.net/ar/library/content/1001/2704/سليمان-بن-داود-أبو-داود-الطيالسي). Y therefore represents a collection tradition attributed to an earlier transmitter than the canonical compilations used here. That is not the date of the surviving copy or proof of the exact text’s circulation by a particular year. [Al-Dhahabī’s al-Shaʿbī biography](https://islamweb.net/ar/library/content/60/564/الشعبي) preserves death estimates of 103–106 AH, rather than one indisputable date. The graph’s attribution to him and the later preservation of divergent wordings cannot establish which form existed in his lifetime. In particular, neither the Persia prediction nor Arab-unity wording is independently datable from this dataset.

## 5. Rijāl, hearing claims, and unresolved identities

The chain appendix normalizes source labels for comparison. Full names inherited from the seed are operational labels, not newly verified biographical findings. Where the report prints only a name, patronymic, kunya, or “my father”, the original remains available. IDs are stable keys, not evidence that every homonym has been resolved.

The material displays direct-hearing claims at several relevant links: M-B’s “حدثنا الشعبي” and visit to Fāṭimah; M-A’s Ibn Buraydah/al-Shaʿbī exchange and question to Fāṭimah; AD-3’s “حدثتني فاطمة”; and H’s request to Fāṭimah. Other links use “عن”. These establish what the text claims about hearing, not a completed chronological verification of every link. No discontinuity is declared solely from the spelling of an isnād, and no universal continuity finding is made without narrator-by-narrator date/meeting work.

One rijāl case is directly checked because it affects how strongly to weight the proposed Mujālid cluster: [al-Mizzī, Tahdhīb al-Kamāl, entry 5780, 27:220–225](https://islamweb.net/ar/library/content/1001/7003/مجالد-بن-سعيد-بن-عمير-بن-بسطام). It identifies Mujālid, lists al-Shaʿbī among his teachers and Ismāʿīl/Abū Usāmah among his pupils, reports adverse evaluations from several critics, and transmits both a positive and a negative evaluation from al-Nasāʾī. It also records Ibn Mahdī’s distinction concerning later pupils, including Abū Usāmah, and gives 144 AH for Mujālid’s death. This supplies a traceable reason for caution about treating IM/IS agreement as two reliable independent controls on al-Shaʿbī’s wording. It does not establish which particular reading is erroneous. The structural comparison remains useful even where a transmitter is criticized.

Al-Tirmidhī himself calls his Qatādah route “صحيح غريب” and says more than one person transmitted the report from al-Shaʿbī. That is the compiler’s assessment as preserved in [T](https://sunnah.com/tirmidhi:2253), distinguished from this study’s structural findings. Modern site grading badges are not converted into narrator reliability priors. No unsourced ratings or death dates are encoded.

| Uncertainty | Treatment and verification needed |
|---|---|
| P-967: “عن قتادة، عن الشعبي، وإبراهيم بن عامر، عن الشعبي” | Original syntax retained. Plausibly two parallel approaches to al-Shaʿbī, but the second’s attachment to an upstream transmitter is not established here. Normalized partial expression in appendix; omitted from machine import and complete-path count |
| N: bare “الحجاج” and “حماد” | Seed IDs expand these to al-Ḥajjāj ibn Muḥammad / Ḥammād ibn Salamah. Retained provisionally, explicitly labeled; compare identified edition and rijāl before identity-sensitive scoring |
| H: “الفضل بن موسى مولى بني هاشم” | Preserve qualification; no equation with al-Faḍl al-Sīnānī. Bare seed ID is not sufficient identity evidence |
| H: “هارون بن عيسى بن السكين” | Preserve Arabic. Legacy ID ending `sikkim` is an opaque key, not an alternative reading or a silently corrected identity |
| P-956: Abū Nuʿaym / ʿAlī ibn ʿAbd al-ʿAzīz; P-960: al-Shaybānī / al-Ḥusayn ibn Isḥāq | Source-form IDs used; fuller identifications not asserted |
| M-D: al-Mughīrah “يعني الحزامي”; Abū Bakr ibn Isḥāq | Source qualification retained; fuller personal identification deferred |
| IS: Mujālid / Mujāhid | Edited base names Mujālid; site apparatus reports “مجاهد” in [س]. Sigla not independently resolved; no extra narrator or transmission route inferred |
| N/A: “ضرير”; H: “موثق إلى حبل بالحديد”; P-967: “الجساس” | Preserve displayed readings without emending them into another version; lexicographic/manuscript checking remains open |
| AD-4: “ابن أبي سلمة” and dialogue speakers | Retain in narrative apparatus; do not silently identify the son or splice him into the main isnād |
| P-960’s Abū Hurayrah / ʿĀʾishah notices | Al-Shaʿbī reports subsequent discussions with Muḥarrar and ʿAbd Allāh ibn Abī Bakr. Preserve embedded corroboration; not independent source attestations or automatically new companion-route counts |
| IS Urdu translation’s extra corroboration paragraph | Not present in the displayed Arabic 40425 main text; excluded from this Arabic witness rather than reverse-translated |
| Edition/number crosswalks | Do not conflate URL object 6795 with Ibn Ḥibbān’s displayed report 6787; do not assume every 1756/1751, 27102/26066, or Nasāʾī crosswalk without evidence |

## 6. Search record, excluded material, and access limits

Reproducible starting searches included `حديث الجساسة الحميدي 372 الطيالسي 1756 الشعبي`, `الجساسة النسائي الكبرى "4453"`, `الجساسة "40425"`, `"الجساسة" "الحميدي" "حدثنا سفيان"`, and `site:islamweb.net/ar/library/content/1064 "إِنَّ بَنِي عَمٍّ" "فاطمة"`. Search language was chiefly Arabic; direct report-number lookup supplied the canonical entries. Searches of narrator names led to the primary rijāl text cited above. The supplementary search is targeted discovery, not a systematic all-collection search with a verified negative-result denominator.

The [hdith.com Ṭayālisī entry](https://hdith.com/encyclopedia/book/b-21/h/181958) supplies a takhrīj/index inventory pointing to additional Aḥmad, Ibn Ḥibbān, Ibn Abī Shaybah, al-Ṭabarānī, and al-Ṭaḥāwī locations. Its displayed route totals and numbering are not adopted as research counts. The study records only texts independently opened and read at the listed primary-work transcriptions.

| Material | Access / inclusion status |
|---|---|
| Al-Ḥumaydī | Search located [a chapter-page snippet](https://hadithportal.com/index.php?bab_id=47&book=28&chapter_id=0&e=188&f=1&show=bab) naming Sufyān → Mujālid → al-Shaʿbī, but direct retrieval returned a generic landing page; not collated or counted. Numbers 360/364/368/372 appearing across discovery material are unresolved, not assumed equivalent |
| Other Aḥmad and Ibn Abī Shaybah entries | Not collated; no claim that A and IS exhaust those collections. Adjacent non-island Fāṭimah divorce reports in the opened Aḥmad page excluded as different report content |
| Other Ibn Ḥibbān entries | Located in index/takhrīj references only; not independently collated, not counted |
| Remaining al-Ṭabarānī al-Kabīr / al-Awsaṭ | Only four specified al-Kabīr entries collated. Other index locations remain discovery leads; no whole-section exhaustiveness claim |
| Isḥāq ibn Rāhwayh, Abū ʿAwānah, al-Bayhaqī’s Dalāʾil, al-Ṭaḥāwī’s Mushkil al-Āthār | Leads from the preliminary inventory or later indexes, not full Arabic collations in this pass; no independent routes attributed to them |
| Al-Bukhārī, Mālik, ʿAbd al-Razzāq, al-Dārimī and other unlisted corpora | No complete collection search performed; absence of the report is not established |
| Manuscripts and printed critical apparatuses | No direct inspection. IS site apparatus retained as reported editorial data, not independently read manuscripts |
| Direct terminal download of Sunnah.com | Sandbox DNS failed; permitted external retry returned HTTP 403. Built-in web access and fetch service supplied Arabic; no claim that raw terminal download succeeded |

## 7. Riwaq data handling and audit result

Repository inspection preceded encoding: `AGENTS.md`, `docs/AGENT-OPERATING-MODEL.md`, the runtime schema in `scripts/json-validator.js`, the descriptive `schemas/hadith-record.json` / `schemas/import-batch.json`, and the sample import. The runtime validator owns validity. The application and schema contracts are unchanged.

The new batch keeps the original narrator IDs for existing paths and adds source-form IDs only where needed. It separates attestations at record level; two compiler paths in a single Muslim entry remain variants under that entry. Each variant has source-form chain text, the remaining continuous narrative, and its own provenance URL. The original full continuous text and extraction hash are retained in the source bundle. A checksum here detects changes to this retained extract; it does not authenticate the source text or confer publication permission. P-967 is textually documented but not forced into a linear chain. Rijāl discussion stays in prose; the import supplies no reliability layer.

Both the original seed and new batch pass `node scripts/riwaq-cli.mjs validate <file>` with zero errors/warnings in this environment. **Schema validity does not certify source accuracy, resolved identities, completeness of the corpus, or historical independence.** The accompanying [validation artifact](jassasah-audit-validation.txt) records the actual schema result and count/source-consistency checks. No application code changed, so no browser behavior or code regression claim is made.

Repeat the schema and existing validator checks from the repository root:

```bash
node scripts/riwaq-cli.mjs validate jassasa/jassasah-riwaq-import.json
node scripts/riwaq-cli.mjs validate jassasa/jassasah-audited-import.json
./node_modules/.bin/vitest run tests/node/json-validator.test.js
```

For source checking, compare each appendix chain against the continuous extract under the same witness ID, then follow that entry’s primary URL. Each extract has a SHA-256 baseline; the validation artifact also records the complete deliverable-file hashes. This enables later readers to distinguish a changed local transcription from a changed online reading. A repeat inspection of an online text is not a repeat inspection of its underlying edition or manuscripts.

Skill routing: `research` was selected after inventory searches and inspection of the top three candidates (`research`, `ecc-research`, `claude-scholar`). All three were materialized; verification also found stale snapshots and unrelated unavailable skills in the wider inventory. Instructions were read from the canonical unified tree, not pack snapshots:

- `/home/meer/.agents/skills/cos-skillpack-router/SKILL.md`
- `/home/meer/ai-tools/.unified_skills/deep-research/SKILL.md`
- `/home/meer/ai-tools/.unified_skills/citation-verification/SKILL.md`
- `/home/meer/.codex/plugins/cache/context-mode/context-mode/1.0.169/skills/context-mode/SKILL.md`
- `/home/meer/.agents/skills/verification-before-completion/SKILL.md`

The pack contains general research/citation controls, not a verified specialist hadith methodology. Available web/fetch tools substituted for the Firecrawl/Exa tools named in the general skill. No pack was activated, rebuilt, installed, or modified. The user’s source-transcription and uncertainty requirements governed the historical analysis.

## 8. Complete chain appendix

Raw chains run in the source’s order, **compiler → earlier transmitters**, including the attached book-transmission frame where printed. Normalized chains reverse that direction: **earliest named report transmitter → compiler**. These are label expansions for comparison, not a substitute for rijāl verification. Every omitted overview name is supplied here. Each compiler endpoint is the author of the linked work; compilers do not always name themselves inside their own entries. Original narrative continuations are in the matching section of the source-text bundle.

### M-A: original and normalized isnād

[Sahih Muslim: Kitab al-Fitan wa-ashrat al-saah; Bab Qissat al-Jassasah; 2942a](https://sunnah.com/muslim:2942a)

```text
حَدَّثَنَا عَبْدُ الْوَارِثِ بْنُ عَبْدِ الصَّمَدِ بْنِ عَبْدِ الْوَارِثِ، وَحَجَّاجُ بْنُ الشَّاعِرِ، كِلاَهُمَا
 عَنْ عَبْدِ الصَّمَدِ، - وَاللَّفْظُ لِعَبْدِ الْوَارِثِ بْنِ عَبْدِ الصَّمَدِ - حَدَّثَنَا أَبِي، عَنْ جَدِّي، عَنِ الْحُسَيْنِ،
 بْنِ ذَكْوَانَ حَدَّثَنَا ابْنُ بُرَيْدَةَ، حَدَّثَنِي عَامِرُ بْنُ شَرَاحِيلَ الشَّعْبِيُّ، شَعْبُ هَمْدَانَ أَنَّهُ سَأَلَ فَاطِمَةَ
 بِنْتَ قَيْسٍ أُخْتَ الضَّحَّاكِ بْنِ قَيْسٍ وَكَانَتْ مِنَ الْمُهَاجِرَاتِ الأُوَلِ
```

**Path 1:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Abd Allah ibn Buraydah → Ḥusayn ibn Dhakwān / al-Muʿallim → Abd al-Warith ibn Sa'id → Abd al-Samad ibn Abd al-Warith → Abd al-Warith ibn Abd al-Samad → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → abd-allah-ibn-buraydah → husayn-ibn-dhakwan → abd-al-warith-ibn-said → abd-al-samad-ibn-abd-al-warith → abd-al-warith-ibn-abd-al-samad → muslim-ibn-al-hajjaj`.

**Path 2:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Abd Allah ibn Buraydah → Ḥusayn ibn Dhakwān / al-Muʿallim → Abd al-Warith ibn Sa'id → Abd al-Samad ibn Abd al-Warith → Hajjaj ibn al-Sha'ir → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → abd-allah-ibn-buraydah → husayn-ibn-dhakwan → abd-al-warith-ibn-said → abd-al-samad-ibn-abd-al-warith → hajjaj-ibn-al-shair → muslim-ibn-al-hajjaj`.

Paths A1/A2 share one wording-bearing entry. Both teachers are retained in the raw text; Muslim assigns the wording to ʿAbd al-Wārith ibn ʿAbd al-Ṣamad. The father/grandfather references remain verbatim above; expanded IDs follow the seed and the named ʿAbd al-Wārith/ʿAbd al-Ṣamad family in the cited text.

### M-B: original and normalized isnād

[Sahih Muslim: Same book/chapter; 2942b](https://sunnah.com/muslim:2942b)

```text
حَدَّثَنَا يَحْيَى بْنُ حَبِيبٍ الْحَارِثِيُّ، حَدَّثَنَا خَالِدُ بْنُ الْحَارِثِ الْهُجَيْمِيُّ أَبُو عُثْمَانَ،
 حَدَّثَنَا قُرَّةُ، حَدَّثَنَا سَيَّارٌ أَبُو الْحَكَمِ، حَدَّثَنَا الشَّعْبِيُّ، قَالَ دَخَلْنَا عَلَى فَاطِمَةَ بِنْتِ قَيْسٍ
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Sayyar Abu al-Hakam → Qurrah ibn Khalid → Khalid ibn al-Harith al-Hujaymi → Yahya ibn Habib al-Harithi → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → sayyar-abu-al-hakam → qurra-ibn-khalid → khalid-ibn-al-harith → yahya-ibn-habib-al-harithi → muslim-ibn-al-hajjaj`.

### M-C: original and normalized isnād

[Sahih Muslim: Same book/chapter; 2942c](https://sunnah.com/muslim:2942c)

```text
وَحَدَّثَنَا الْحَسَنُ بْنُ عَلِيٍّ الْحُلْوَانِيُّ، وَأَحْمَدُ بْنُ عُثْمَانَ النَّوْفَلِيُّ، قَالاَ حَدَّثَنَا وَهْبُ،
 بْنُ جَرِيرٍ حَدَّثَنَا أَبِي قَالَ، سَمِعْتُ غَيْلاَنَ بْنَ جَرِيرٍ، يُحَدِّثُ عَنِ الشَّعْبِيِّ، عَنْ فَاطِمَةَ بِنْتِ،
 قَيْسٍ
```

**Path 1:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Ghaylan ibn Jarir → Jarir ibn Hazim → Wahb ibn Jarir → al-Hasan ibn Ali al-Hulwani → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → ghaylan-ibn-jarir → jarir-ibn-hazim → wahb-ibn-jarir → hasan-ibn-ali-al-hulwani → muslim-ibn-al-hajjaj`.

**Path 2:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Ghaylan ibn Jarir → Jarir ibn Hazim → Wahb ibn Jarir → Ahmad ibn Uthman al-Nawfali → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → ghaylan-ibn-jarir → jarir-ibn-hazim → wahb-ibn-jarir → ahmad-ibn-uthman-al-nawfali → muslim-ibn-al-hajjaj`.

The two teachers join at Wahb ibn Jarīr. “My father” is normalized as Jarīr ibn Ḥāzim; the source remains verbatim.

### M-D: original and normalized isnād

[Sahih Muslim: Same book/chapter; 2942d](https://sunnah.com/muslim:2942d)

```text
حَدَّثَنِي أَبُو بَكْرِ بْنُ إِسْحَاقَ، حَدَّثَنَا يَحْيَى بْنُ بُكَيْرٍ، حَدَّثَنَا الْمُغِيرَةُ، - يَعْنِي الْحِزَامِيَّ
 - عَنْ أَبِي الزِّنَادِ، عَنِ الشَّعْبِيِّ، عَنْ فَاطِمَةَ بِنْتِ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Abu al-Zinad Abd Allah ibn Dhakwan → al-Mughīrah (source: al-Ḥizāmī) → Yahya ibn Bukayr → Abu Bakr ibn Ishaq → Muslim ibn al-Hajjaj.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → abu-al-zinad → mughira-al-hizami → yahya-ibn-bukayr → abu-bakr-ibn-ishaq → muslim-ibn-al-hajjaj`.

### AD-1: original and normalized isnād

[Sunan Abi Dawud: Kitab al-Malahim; Bab fi khabar al-Jassasah; 4325](https://sunnah.com/abudawud:4325)

```text
حَدَّثَنَا النُّفَيْلِيُّ، حَدَّثَنَا عُثْمَانُ بْنُ عَبْدِ الرَّحْمَنِ، حَدَّثَنَا ابْنُ أَبِي ذِئْبٍ، عَنِ الزُّهْرِيِّ، عَنْ أَبِي سَلَمَةَ، عَنْ فَاطِمَةَ بِنْتِ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Abu Salamah ibn Abd al-Rahman → Muhammad ibn Shihab al-Zuhri → Muhammad ibn Abd al-Rahman ibn Abi Dhi'b → Uthman ibn Abd al-Rahman → Abd Allah ibn Muhammad al-Nufayli → Abu Dawud Sulayman ibn al-Ash'ath.

**Stable IDs:** `fatimah-bint-qays → abu-salama-ibn-abd-al-rahman → muhammad-al-zuhri → muhammad-ibn-abd-al-rahman-ibn-abi-dhib → uthman-ibn-abd-al-rahman → al-nufayli → abu-dawud`.

### AD-2: original and normalized isnād

[Sunan Abi Dawud: Same book/chapter; 4326](https://sunnah.com/abudawud:4326)

```text
حَدَّثَنَا حَجَّاجُ بْنُ أَبِي يَعْقُوبَ، حَدَّثَنَا عَبْدُ الصَّمَدِ، حَدَّثَنَا أَبِي قَالَ، سَمِعْتُ حُسَيْنًا الْمُعَلِّمَ، حَدَّثَنَا عَبْدُ اللَّهِ بْنُ بُرَيْدَةَ، حَدَّثَنَا عَامِرُ بْنُ شَرَاحِيلَ الشَّعْبِيُّ، عَنْ فَاطِمَةَ بِنْتِ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Abd Allah ibn Buraydah → Ḥusayn ibn Dhakwān / al-Muʿallim → Abd al-Warith ibn Sa'id → Abd al-Samad ibn Abd al-Warith → Hajjaj ibn Abi Ya'qub → Abu Dawud Sulayman ibn al-Ash'ath.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → abd-allah-ibn-buraydah → husayn-ibn-dhakwan → abd-al-warith-ibn-said → abd-al-samad-ibn-abd-al-warith → hajjaj-ibn-abi-yacqub → abu-dawud`.

### AD-3: original and normalized isnād

[Sunan Abi Dawud: Same book/chapter; 4327](https://sunnah.com/abudawud:4327)

```text
حَدَّثَنَا مُحَمَّدُ بْنُ صُدْرَانَ، حَدَّثَنَا الْمُعْتَمِرُ، حَدَّثَنَا إِسْمَاعِيلُ بْنُ أَبِي خَالِدٍ، عَنْ مُجَالِدِ بْنِ سَعِيدٍ، عَنْ عَامِرٍ، قَالَ حَدَّثَتْنِي فَاطِمَةُ بِنْتُ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Mujalid ibn Sa'id → Isma'il ibn Abi Khalid → al-Mu'tamir ibn Sulayman → Muhammad ibn Sudran → Abu Dawud Sulayman ibn al-Ash'ath.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → mujalid-ibn-said → ismail-ibn-abi-khalid → al-mutamir-ibn-sulayman → muhammad-ibn-sudran → abu-dawud`.

### AD-4: original and normalized isnād

[Sunan Abi Dawud: Same book/chapter; 4328](https://sunnah.com/abudawud:4328)

```text
حَدَّثَنَا وَاصِلُ بْنُ عَبْدِ الأَعْلَى، أَخْبَرَنَا ابْنُ فُضَيْلٍ، عَنِ الْوَلِيدِ بْنِ عَبْدِ اللَّهِ بْنِ جُمَيْعٍ، عَنْ أَبِي سَلَمَةَ بْنِ عَبْدِ الرَّحْمَنِ، عَنْ جَابِرٍ،
```

**Normalized path:** Jabir ibn Abd Allah → Abu Salamah ibn Abd al-Rahman → al-Walid ibn Abd Allah ibn Jumay' → Muhammad ibn Fudayl → Wasil ibn Abd al-A'la → Abu Dawud Sulayman ibn al-Ash'ath.

**Stable IDs:** `jabir-ibn-abd-allah → abu-salama-ibn-abd-al-rahman → al-walid-ibn-abd-allah-ibn-jumay → muhammad-ibn-fudayl → wasil-ibn-abd-al-ala → abu-dawud`.

### T: original and normalized isnād

[Jami al-Tirmidhi: Abwab al-Fitan; Hadith Tamim al-Dari fi al-Dajjal; 2253](https://sunnah.com/tirmidhi:2253)

```text
حَدَّثَنَا مُحَمَّدُ بْنُ بَشَّارٍ، حَدَّثَنَا مُعَاذُ بْنُ هِشَامٍ، حَدَّثَنَا أَبِي، عَنْ قَتَادَةَ، عَنِ الشَّعْبِيِّ، عَنْ فَاطِمَةَ بِنْتِ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Qatadah ibn Di'amah → Hisham al-Dastawa'i → Mu'adh ibn Hisham → Muhammad ibn Bashshar → Abu Isa Muhammad al-Tirmidhi.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → qatada-ibn-diamah → hisham-al-dastawai → muadh-ibn-hisham → muhammad-ibn-bashshar → al-tirmidhi`.

### IM: original and normalized isnād

[Sunan Ibn Majah: Kitab al-Fitan; Bab Fitnat al-Dajjal wa-khuruj Isa ibn Maryam wa-khuruj Yajuj wa-Majuj; 4074](https://sunnah.com/ibnmajah:4074)

```text
حَدَّثَنَا مُحَمَّدُ بْنُ عَبْدِ اللَّهِ بْنِ نُمَيْرٍ، حَدَّثَنَا أَبِي، حَدَّثَنَا إِسْمَاعِيلُ بْنُ أَبِي خَالِدٍ، عَنْ مُجَالِدٍ، عَنِ الشَّعْبِيِّ، عَنْ فَاطِمَةَ بِنْتِ قَيْسٍ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Mujalid ibn Sa'id → Isma'il ibn Abi Khalid → Abd Allah ibn Numayr → Muhammad ibn Abd Allah ibn Numayr → Ibn Majah Muhammad ibn Yazid.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → mujalid-ibn-said → ismail-ibn-abi-khalid → abd-allah-ibn-numayr → muhammad-ibn-abd-allah-ibn-numayr → ibn-majah`.

### N: original and normalized isnād

[al-Sunan al-Kubra li-al-Nasai: Islamweb display: Kitab al-Manasik / Dur Makkah; 4453; vol. 5, p. 261 (page break)](https://www.islamweb.net/ar/library/content/406/4489/دور-مكة)

```text
4453 - أخبرنا  محمد بن المثنى ، عن  الحجاج ، قال : حدثنا  حماد ، قال : أخبرنا  داود بن أبي هند ، عن  الشعبي ، عن ،  فاطمة بنت قيس  :
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Dawud ibn Abi Hind → Ḥammād (expanded seed identity provisional) → al-Ḥajjāj (N; expanded seed identity provisional) → Muhammad ibn al-Muthanna → Ahmad ibn Shu'ayb al-Nasa'i.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → dawud-ibn-abi-hind → hammad-ibn-salama → al-hajjaj-ibn-muhammad → muhammad-ibn-al-muthanna → al-nasai`.

The source only prints al-Ḥajjāj and Ḥammād. Expanded seed IDs are provisional, not independently resolved biographies. This qualification applies to graph grouping with A.

### A: original and normalized isnād

[Musnad Ahmad: Musnad al-qabail; min hadith Fatimah bint Qays; Wikisource 26066](https://ar.wikisource.org/wiki/مسند_أحمد_بن_حنبل/مسند_القبائل/6)

```text
26066 حدثنا عفان، حدثنا حماد بن سلمة، قال أخبرنا داود، عن عامر، عن فاطمة بنت قيس،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Dawud ibn Abi Hind → Hammad ibn Salamah → Affan ibn Muslim → Ahmad ibn Hanbal.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → dawud-ibn-abi-hind → hammad-ibn-salama → affan-ibn-muslim → ahmad-ibn-hanbal`.

The legacy variant ID contains 27102; only the linked displayed 26066 is verified here. “Dāwūd” and “ʿĀmir” are normalized consistently with the parallel N source naming Dāwūd ibn Abī Hind and al-Shaʿbī.

### IS: original and normalized isnād

[Musannaf Ibn Abi Shaybah: Kitab al-Fitan; Ma dhukira fi fitnat al-Dajjal; al-Shathri numbering 40425; site crosswalk Awamah 38791; displayed pp. 392-393](https://islamicurdubooks.com/hadith/hadith-.php?bookid=33&hadith_number=40425)

```text
٤٠٤٢٥ - حدثنا ابو اسامة قال: حدثنا (مجالد) (١) قال: (اخبرنا) (٢) عامر قال: اخبرتني فاطمة ابنة قيس
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Mujalid ibn Sa'id → Hammad ibn Usamah Abu Usamah → Ibn Abi Shaybah.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → mujalid-ibn-said → hammad-ibn-usama → ibn-abi-shaybah`.

Abū Usāmah is the source kunya; expanded seed label is retained. Base reading Mujālid, with Mujāhid reported in editorial apparatus [س]. No manuscript identity decision is made.

### H: original and normalized isnād

[Sahih Ibn Hibban: Kitab al-Tarikh; signs at release of al-Dajjal; 6787; vol. 15, pp. 194-195](https://www.islamweb.net/ar/library/content/314/6795/ذكر-الإخبار-عن-وصف-العلامتين-اللتين-تظهران-عند-خروج-المسيح-الدجال-من-وثاقه)

```text
ذكر الإخبار عن وصف العلامتين اللتين تظهران

عند خروج المسيح الدجال من وثاقه

6787 - أخبرنا هارون بن عيسى بن السكين ببلد الموصل ، قال :

[ ص: 194 ] حدثنا الفضل بن موسى مولى بني هاشم قال : حدثنا  عون بن كهمس قال : حدثني  أبي عن  عبد الله بن بريدة عن  يحيى بن يعمر ، أنه ، قال  لفاطمة بنت قيس  :
```

**Normalized path:** Fatimah bint Qays → Yahya ibn Ya'mar → Abd Allah ibn Buraydah → Kahmas ibn al-Hasan → Awn ibn Kahmas → al-Faḍl ibn Mūsā (H: mawlā Banī Hāshim) → Hārūn ibn ʿĪsā ibn al-Sikkīn (as printed) → Ibn Hibban Muhammad ibn Hibban.

**Stable IDs:** `fatimah-bint-qays → yahya-ibn-yamar → abd-allah-ibn-buraydah → kahmas-ibn-al-hasan → awn-ibn-kahmas → al-fadl-ibn-musa → harun-ibn-isa-ibn-al-sikkim → ibn-hibban`.

“My father” is Kahmas in the same report’s closing attribution. The fuller patronymic follows the existing seed; the original formula is preserved. Al-Faḍl is not identified with al-Sīnānī. The ID’s legacy “sikkim” spelling is not a source reading.

### Y: original and normalized isnād

[Musnad Abi Dawud al-Tayalisi: Ma rawat Fatimah bint Qays; Islamweb 1751; vol. 3, pp. 216-217; hdith.com crosswalk 1756](https://www.islamweb.net/ar/library/content/1064/1747/ما-روت-فاطمة-بنت-قيس)

```text
[ ص: 216 ]  1751 - حدثنا  أبو داود ، قال : حدثنا  قرة بن خالد ، حدثنا  سيار أبو الحكم ، عن  الشعبي ، قال : دخلنا على  فاطمة بنت قيس
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Sayyar Abu al-Hakam → Qurrah ibn Khalid → Abu Dawud al-Tayalisi.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → sayyar-abu-al-hakam → qurra-ibn-khalid → abu-dawud-al-tayalisi`.

Opening “ḥaddathanā Abū Dāwūd” is the book transmission frame. The normalized research path stops at al-Ṭayālisī, whose musnad is cited; the unnamed speaker outside that compiler is not invented.

### P-956: original and normalized isnād

[al-Mujam al-Kabir li-al-Tabarani: Musnad al-nisa; Fatimah; Amir al-Shabi an Fatimah; 956; vol. 24, pp. 385-386](https://www.islamweb.net/ar/library/content/84/20558/عامر-الشعبي-عن-فاطمة-بنت-قيس)

```text
( 956 ) حدثنا  علي بن عبد العزيز ، ثنا أبو نعيم ، ثنا  محمد بن أيوب أبو عاصم الثقفي ، ثنا  عامر الشعبي ، قال : انطلقت أنا ورجل حتى دخلنا على  فاطمة بنت قيس أخت  الضحاك بن قيس
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Muhammad ibn Ayyub Abu Asim al-Thaqafi → Abu Nuaym (as named in P-956; further identification pending) → Ali ibn Abd al-Aziz (P-956) → al-Tabarani.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → muhammad-ibn-ayyub-abu-asim-al-thaqafi → abu-nuaym-p956 → ali-ibn-abd-al-aziz-p956 → al-tabarani`.

Abū Nuʿaym and ʿAlī ibn ʿAbd al-ʿAzīz remain source-form identities; no fuller identification is inferred from a familiar kunya.

### P-960: original and normalized isnād

[al-Mujam al-Kabir li-al-Tabarani: Same section; 960; vol. 24, pp. 392-393](https://www.islamweb.net/ar/library/content/84/20562/عامر-الشعبي-عن-فاطمة-بنت-قيس)

```text
( 960 ) حدثنا  الحسين بن إسحاق ، ثنا  عثمان بن أبي شيبة ، ثنا  محمد بن فضيل ، عن الشيباني ، عن  الشعبي ، عن  فاطمة بنت قيس ،
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → al-Shaybani (P-960; further identification pending) → Muhammad ibn Fudayl → Uthman ibn Abi Shaybah → al-Husayn ibn Ishaq (P-960) → al-Tabarani.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → al-shaybani-p960 → muhammad-ibn-fudayl → uthman-ibn-abi-shaybah → al-husayn-ibn-ishaq-p960 → al-tabarani`.

Al-Shaybānī and al-Ḥusayn ibn Isḥāq remain source-form identities. Subsequent corroboration dialogues belong to this witness’s narrative appendix; no additional independently collected companion path is counted.

### P-967: original and normalized isnād

[al-Mujam al-Kabir li-al-Tabarani: Same section; 967; vol. 24, pp. 399-400](https://www.islamweb.net/ar/library/content/84/20569/عامر-الشعبي-عن-فاطمة-بنت-قيس)

```text
( 967 ) حدثنا  الحسن بن علي المعمري ، ثنا  أيوب بن محمد الوراق الرقي ، ثنا  الوليد بن الوليد ، ثنا  سعيد بن بشير ، عن قتادة ، عن  الشعبي ،  وإبراهيم بن عامر ، عن  الشعبي ، قال : دخلت المدينة فجلست عند المنبر فجاء رجل فجلس إلي فقال : هل تدلني على رجل يحدثني عن رسول الله صلى الله عليه وسلم ، فانطلق بي إلى  فاطمة بنت قيس
```

**Normalized partial representation (no complete path asserted):** Fāṭimah → al-Shaʿbī → Qatādah → Saʿīd ibn Bashīr → al-Walīd ibn al-Walīd → Ayyūb ibn Muḥammad al-Warrāq al-Raqqī → al-Ḥasan ibn ʿAlī al-Maʿmarī → al-Ṭabarānī is the explicitly readable first sequence. The source additionally conjoins **Ibrāhīm ibn ʿĀmir → al-Shaʿbī in source order**, which reverses to **al-Shaʿbī → Ibrāhīm ibn ʿĀmir** in the research direction; its onward attachment to the above sequence is unresolved. This first-sequence reading is documented, but the whole packet is withheld from the resolved-path count and import until the conjunction is collated.

In particular, the wording does not authorize silently making Ibrāhīm the pupil of al-Shaʿbī through Qatādah, inserting him serially after Qatādah, or counting two fully verified parallel routes. No identity or reliability assessment of these extra transmitters is supplied.

### P-968: original and normalized isnād

[al-Mujam al-Kabir li-al-Tabarani: Same section; 968; vol. 24, p. 401](https://www.islamweb.net/ar/library/content/84/20570/عامر-الشعبي-عن-فاطمة-بنت-قيس)

```text
( 968 ) حدثنا  أسلم بن سهل الواسطي ، ثنا حبيب بن بشر ، أخو  أبي الوليد الطيالسي لأمه ، حدثنا  حماد بن مسعدة ، ثنا  قرة بن خالد ، عن  سيار أبي الحكم ، عن  الشعبي ، قال : دخلنا على  فاطمة بنت قيس
```

**Normalized path:** Fatimah bint Qays → Amir ibn Sharahil al-Sha'bi → Sayyar Abu al-Hakam → Qurrah ibn Khalid → Hammad ibn Masadah → Habib ibn Bishr (P-968) → Aslam ibn Sahl al-Wasiti → al-Tabarani.

**Stable IDs:** `fatimah-bint-qays → amir-al-shabi → sayyar-abu-al-hakam → qurra-ibn-khalid → hammad-ibn-masadah → habib-ibn-bishr-p968 → aslam-ibn-sahl-al-wasiti → al-tabarani`.

The phrase “brother of Abū al-Walīd al-Ṭayālisī through his mother” qualifies Ḥabīb ibn Bishr. It is not another transmitter between Ḥabīb and Ḥammād.


## Findings

### What the sources directly establish

The 19 examined digital attestations preserve multiple formal paths, differing traveler attributions, human/beast descriptions, question sequences, and endings. Eighteen entries yield 20 complete compiler paths; one conjoined packet remains unresolved. The kinsmen wording extends beyond Mujālid. Repeated collector attestations frequently share lower chains.

### What the isnād-cum-matn pattern suggests

Al-Shaʿbī is the principal structural common-link candidate for the Fāṭimah material in this sample. The Persia-plus-question-order combination clusters on Dāwūd–Ḥammād; a distressed-old-man/Arab-unity/three-sighs combination clusters in the examined Mujālid witnesses. Neither pattern identifies an inventor, proves authenticity/fabrication, or establishes a composition date.

### What remains uncertain or unverified

P-967’s conjunction, several narrator identifications, all-links chronology, some unusual readings, edition crosswalks, and the relationship of the bypass/Jābir material to the long sermon remain open. The displayed texts have not been checked against page images or manuscripts. No reconstructed archetype or independent island eyewitness count is warranted.

### Corpus coverage and limits

This is a bounded audit of 19 named digital entries across ten collection titles, not “all variants” of the report. It exhausts the displayed Arabic of those entries as retrieved, including their own abridgments; other collection entries, inaccessible leads, and manuscript/edition variation remain outside verified coverage.
