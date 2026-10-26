# Riwaq User Guide: Isnad-cum-Matn Analysis (ICMA)

Welcome to **Riwaq** (رواق). Riwaq is a visual research tool designed for hadith scholars, historians, and researchers conducting **Isnad-cum-Matn Analysis (ICMA)**. 

You do **not** need to know any programming, use terminal commands, or install complicated software to use Riwaq. It runs directly inside your web browser.

---

## Table of Contents

1. [Quick Start: Opening Riwaq](#1-quick-start-opening-riwaq)
2. [What is ICMA and How Does Riwaq Help?](#2-what-is-icma-and-how-does-riwaq-help)
3. [Tour of the Interface](#3-tour-of-the-interface)
4. [Step-by-Step Tutorial: Conducting an ICMA Study](#4-step-by-step-tutorial-conducting-an-icma-study)
   - [Step 1: Gather Your Transmission Paths (Turuq)](#step-1-gather-your-transmission-paths-turuq)
   - [Step 2: Enter Your First Narrator](#step-2-enter-your-first-narrator)
   - [Step 3: Connect the Chain in Sanad Order](#step-3-connect-the-chain-in-sanad-order)
   - [Step 4: Track Dates and Lifespans (Hijri & Gregorian)](#step-4-track-dates-and-lifespans-hijri--gregorian)
   - [Step 5: Record Geographical Cities and Custom Tags](#step-5-record-geographical-cities-and-custom-tags)
   - [Step 6: Enter Hadith Text (Matn) and Compare Variations](#step-6-enter-hadith-text-matn-and-compare-variations)
   - [Step 7: Visualize and Arrange the Spider Chain Map](#step-7-visualize-and-arrange-the-spider-chain-map)
   - [Step 8: Identify the Common Link (CL) and Correlate Text](#step-8-identify-the-common-link-cl-and-correlate-text)
5. [Managing Your Workspace & Data Safety](#5-managing-your-workspace--data-safety)
6. [Troubleshooting & Frequently Asked Questions](#6-troubleshooting--frequently-asked-questions)
7. [Advanced: Automated Batch Analysis (CLI & API)](#7-advanced-automated-batch-analysis-cli--api)

---

## 1. Quick Start: Opening Riwaq

Riwaq is a single-page web application. You can use it in two ways:

* **Online (No installation needed)**:  
  Open your web browser (Chrome, Safari, Firefox, or Edge) and visit:  
  👉 **[https://munir-abbasi.github.io/riwaq](https://munir-abbasi.github.io/riwaq)**

* **Offline on Your Computer**:  
  If you have downloaded the Riwaq repository, double-click the file named `index.html`. It opens immediately in your default browser. You do not need an active internet connection.

> **Privacy Guarantee**: All your entered data stays on your computer inside your web browser. No information is uploaded to an external server or cloud database.

---

## 2. What is ICMA and How Does Riwaq Help?

**Isnad-cum-matn analysis (ICMA)** is a historical-critical method used in Islamic studies to examine how hadith reports were transmitted. Instead of looking *only* at the chain of transmitters (*isnad*) or *only* at the text (*matn*), ICMA correlates the two:

1. **The Isnad Bundle**: When researchers gather all recorded versions (*turuq*) of a report from classical hadith collections, the chains often converge on a key figure called the **Common Link (CL)**, and branch out through **Partial Common Links (PCLs)**.
2. **Textual Variation (Matn)**: Different transmission branches often contain subtle or significant differences in wording (additions, omissions, synonym replacements).
3. **Correlation**: When students of one branch consistently share a specific wording variant that differs from other branches, scholars can deduce at what historical point that variant entered circulation.

**How Riwaq makes this easy:**
* **Visual Spider Map**: Automatically draws transmission links and lets you drag narrator cards around like cards on a whiteboard to reveal branches.
* **Synchronized Matn Alignment**: Compares hadith wordings side-by-side, highlighting matching words, additions, and omissions automatically.
* **Dual Calendar Age Calculator**: Calculates transmitter lifespans across Hijri and Gregorian dates to help assess contemporary overlap (*mu'asarah*).
* **City & Tag Tracking**: Traces regional centers (Medina, Basra, Kufa, Damascus) and historical generations at a glance.

---

## 3. Tour of the Interface

When you open Riwaq, you will see a clean layout divided into three main areas:

```
+-------------------------------------------------------------------------+
| [RIWAQ LOGO]  Riwaq | Hadith Chain Builder       [Load example] [Clear]  |
| 0 Narrators   0 Locations   0 Tags                                      |
+-------------------------------------------------------------------------+
| [ Details & Matn ]  [ Spider Chain Map ]   <--- Workspace Tabs          |
+-------------------------------------------------------------------------+
|                                                                         |
|  [Details & Matn Tab]                      [Spider Chain Map Tab]       |
|  * Add Narrator Form                       * Large visual canvas        |
|  * Chain Summary List                      * Draggable narrator cards   |
|  * Matn Alignment Comparison               * Live connecting lines      |
|                                            * Fullscreen "Max map" mode  |
+-------------------------------------------------------------------------+
```

### The Header
* **Load example**: Click this button anytime to load a pre-built transmission chain. It is the fastest way to see how Riwaq works.
* **Clear chain**: Empties the current workspace so you can begin analyzing a new hadith.
* **Counters**: Displays the total count of narrators, unique cities, and tags currently in your chain.

### The Two Tabs
* **`Details & Matn` tab**: Your data-entry desk. This is where you enter narrator names, dates, cities, tags, biographical status, and hadith texts, and inspect the word-by-word text comparison.
* **`Spider Chain Map` tab**: Your visual canvas. This gives your transmission network a spacious whiteboard where you can drag and position narrators to visualize branches and common links.

---

## 4. Step-by-Step Tutorial: Conducting an ICMA Study

Let's walk through an entire analysis from scratch.

### Step 1: Gather Your Transmission Paths (Turuq)
Before typing into Riwaq, collect the different versions of the hadith report you want to analyze from primary sources (such as *Sahih al-Bukhari*, *Sahih Muslim*, *Sunan Abi Dawud*, *Muwatta Malik*, or *Musannaf 'Abd al-Razzaq*). Note down:
1. The sequence of transmitters for each version.
2. The exact Arabic or translated text (*matn*) of each version.

---

### Step 2: Enter Your First Narrator

1. Go to the **Details & Matn** tab.
2. Find the **Add Narrator** section on the left.
3. In **Narrator name**, type the name of the transmitter (e.g., `Malik ibn Anas`).
4. In **Narrator status** (optional), enter their traditional biographical evaluation (e.g., `Thiqah / Trustworthy`, `Imam`, or `Saduq`).
5. Click the blue **Add narrator to chain** button.

✅ **Checkpoint**: 
* Look at the **Chain Summary** section below the form: your first narrator is now listed!
* Click the **Spider Chain Map** tab: a clean node card for this narrator has appeared on the canvas.

---

### Step 3: Connect the Chain in Sanad Order

Riwaq connects each new narrator to the narrator added immediately before them.

1. Return to the **Details & Matn** tab.
2. Enter the next transmitter in the chain (e.g., `Nafi' mawla Ibn 'Umar`).
3. Click **Add narrator to chain**.
4. Enter the next transmitter (e.g., `'Abdullah ibn 'Umar`).
5. Click **Add narrator to chain**.

✅ **Checkpoint**:
* Switch to the **Spider Chain Map** tab. You will see lines connecting `Malik ibn Anas` ➔ `Nafi'` ➔ `Ibn 'Umar`.

> **Tip on Chain Direction**: You can enter chains either from the latest collector down to the Prophet/Companion, or from the Companion up to the collectors. Choose one convention for your study and maintain it consistently so your arrows and links flow uniformly.

---

### Step 4: Track Dates and Lifespans (Hijri & Gregorian)

Establishing whether two transmitters lived at the same time and could have met (*mu'asarah* and *liqa'*) is essential in hadith criticism. Riwaq includes an automatic dual-calendar age engine:

1. In the **Add Narrator** form, locate the **Age Details** section.
2. Change the dropdown from `No age details` to **`Add birth and death dates`**.
3. For **Birth date**:
   - Choose the calendar: **`Hijri calendar`** or **`Gregorian / normal calendar`**.
   - Enter the **Day**, **Month**, and **Year** (e.g., Day `10`, Month `2`, Year `93` AH).
4. For **Death date**:
   - Choose the calendar and enter the **Day**, **Month**, and **Year** (e.g., Day `14`, Month `3`, Year `179` AH).
5. Watch the preview boxes update in real time:
   - **Solar age**: Displays their age calculated in solar years.
   - **Hijri age**: Displays their age calculated in lunar Hijri years.

> **Did You Know?** You can record a birth date in Hijri and a death date in Gregorian (or vice versa). Riwaq converts and reconciles the dates automatically!

---

### Step 5: Record Geographical Cities and Custom Tags

To analyze the geographic spread and demographic groupings of your transmitters:

#### Adding Cities (Locations)
1. In the **Locations** box, enter a city name (e.g., `Medina`, `Basra`, or `Baghdad`).
2. Click **Add city**. A pill chip with the city name will appear.
3. You can add multiple cities for narrators who traveled for hadith (*rihla*).
4. To remove an accidentally typed city, click the small `×` on its chip.

#### Adding Custom Tags with Visual Badges
Tags let you label narrators by generation, theological affiliation, or study group:
1. In the **Tags** box, type your label (e.g., `Tabi'i`, `Kufan School`, or `Collector`).
2. Choose a badge shape from the dropdown:
   - `⬭ Pill`
   - `▢ Square`
   - `◇ Diamond`
3. Click **Add tag**.

---

### Step 6: Enter Hadith Text (Matn) and Compare Variations

The hallmark of ICMA is the comparison between textual wording variations and transmission branches (*cum matn*).

1. In the **Narrator matn** textarea, paste the text of the hadith report as transmitted through this specific narrator.
2. In the **Extra notes** box (optional), paste citation details (e.g., *Sahih al-Bukhari, Hadith 1; Kitab Bad' al-Wahy*).
3. Click **Add narrator to chain** (or add this text when creating the narrator).

#### Understanding the Matn Alignment System
Look at the right panel on the **Details & Matn** tab labeled **Matn Alignment System**:
* **The Reference Text**: The first narrator in your list who has a matn attached becomes the **Reference Standard**.
* **Synoptic Comparison**: Each subsequent narrator’s text is displayed side-by-side with the reference text, with word-by-word variations highlighted:
  * **Normal Text**: Exact matching words between the reports.
  * **Added / Changed Wording**: Words present in this variant that diverge from the reference text.
  * **Missing Wording**: Words that were present in the reference text but are omitted in this variant.

*(Note: If you paste exceptionally large texts of hundreds of lines, Riwaq will display the full text cleanly without heavy highlighting to keep your browser fast and responsive).*

---

### Step 7: Visualize and Arrange the Spider Chain Map

Once you have added your narrators, click the **Spider Chain Map** tab:

1. **Move Narrators Freely**: Click on any narrator card and drag it with your mouse or trackpad. The connecting lines update smoothly and live as you drag.
2. **Maximize for Large Bundles**: Click the **Max map** button in the top right to expand the canvas across your entire screen. Press the `Esc` key on your keyboard (or click the button again) to return to normal view.
3. **Inspect Transmitter Details on the Map**: Each card shows the narrator's name and status. Click **Show details** on any card to expand it and view their calculated age, cities, tags, and notes without having to leave the map.

---

### Step 8: Identify the Common Link (CL) and Correlate Text

Now you can complete the ICMA interpretation:

```
          [Collector A: Bukhari]      [Collector B: Muslim]      [Collector C: Abu Dawud]
                     \                         |                         /
                      \                        |                        /
               [Student 1: Yahya]     [Student 2: Qutayba]     [Student 3: Musaddad]
                        \                      |                       /
                         \                     |                      /
                          +--------------------+---------------------+
                                               |
                                     [ COMMON LINK: Malik ]
                                               |
                                        [ Teacher: Nafi' ]
                                               |
                                      [ Companion: Ibn 'Umar ]
```

1. **Locate the Common Link (CL)**:
   - Trace the converging lines on your map. 
   - Look for the earliest narrator where multiple independent transmission lines meet (in the diagram above, `Malik`).
   - This narrator is your candidate **Common Link**.
2. **Locate Partial Common Links (PCLs)**:
   - Look below the Common Link for students who themselves transmit to multiple subsequent students. These are **Partial Common Links**.
3. **Correlate with Matn Differences**:
   - Go back to the **Matn Alignment** panel.
   - Does Student 1's branch share an addition that Student 2 and 3 do not have?
   - If two independent students of a Common Link preserve the exact same unique phrasing, this provides evidence that this phrasing existed at the time of the Common Link.

---

## 5. Managing Your Workspace & Data Safety

### Automatic Persistence
Riwaq automatically saves your entire workspace into your browser's private local storage (`localStorage`). If you refresh the page or close your browser tab, your work will still be there when you return.

### Working with Multiple Hadith Studies
Because Riwaq stores the active chain in your browser, here is how to manage multiple studies:
* **To start a new study**: Make sure you have noted or taken a screenshot of your current chain, then click **Clear chain**.
* **To explore without losing work**: If you want to test features, click **Load example**. This loads an authentic reference chain demonstrating dates, cities, tags, and matn diffs.
* **Reset form**: If you are typing details into the narrator form and want to clear only the input fields without touching your chain, click **Reset form**.

### Best Practices for Preserving Your Work
* **Browser Privacy Modes**: If you open Riwaq in an "Incognito" or "Private Browsing" window, your browser will erase your saved work as soon as you close the window. Use a regular browser window for ongoing research.
* **Clearing Browser Cache**: Do not use "Clear browsing data / Clear cookies and site data" while working on an active project, as this clears your browser's local storage.
* **Saving Visuals for Papers & Theses**: Use your computer's screenshot tool (e.g., `Windows + Shift + S` on Windows, or `Cmd + Shift + 4` on macOS) while in **Max map** mode to capture publication-grade diagrams of your isnad bundles.

---

## 6. Troubleshooting & Frequently Asked Questions

| Question / Symptom | Probable Cause | Recommended Action |
|---|---|---|
| **I opened the page and my previous chain is gone.** | You may be in an Incognito window, switched browsers, or cleared your browser site data. | Use the same browser profile and avoid incognito mode for multi-day research. |
| **The age box says "Enter full birth and death dates".** | One or more date fields (day, month, or year) are blank, or the day exceeds the month length (e.g. Day 31 in a 30-day month). | Check that all three fields (Day, Month, Year) are filled in for both birth and death with valid numbers. |
| **The connector lines don't show on the map.** | You only have one narrator, or narrators were cleared. | Add at least two narrators. Lines connect each narrator to the one entered before them. |
| **Why did the colored word highlighting stop appearing on my matn?** | Your hadith text is exceptionally long (hundreds of words). | Riwaq automatically switches very long texts to clean raw text mode to prevent browser slowdowns. |
| **Can I install Riwaq on my phone or tablet?** | Yes, Riwaq is fully responsive. | Open `https://munir-abbasi.github.io/riwaq` in Safari on iPad/iPhone or Chrome on Android. You can drag narrator cards with touch gestures. |
| **How do I cite Riwaq in an academic paper?** | You can cite Riwaq as the analytical visualization software used for your isnad diagrams. | Reference: *Riwaq Hadith Chain Builder, https://munir-abbasi.github.io/riwaq*. |

---

## 7. Advanced: Automated Batch Analysis (CLI & API)

For computational researchers, data scientists, and power users who need to analyze hundreds of hadith chains simultaneously from structured JSON files, Riwaq includes an advanced deterministic command-line interface (CLI) and Node.js analytics engine.

*(If you are using the visual web application, you can safely ignore this section).*

### Option A — The Control CLI (No programming required)

Ensure you have Node.js (v18+) installed. From the Riwaq repository directory, run:

```bash
# Complete end-to-end pipeline: validation -> quality sweep -> canonical report gate
node scripts/riwaq-cli.mjs pipeline docs/examples/sample-import.json

# Step-by-step commands
node scripts/riwaq-cli.mjs validate your-batch.json
node scripts/riwaq-cli.mjs analyze your-batch.json --profile structural_only
node scripts/riwaq-cli.mjs report your-batch.json
node scripts/riwaq-cli.mjs export your-batch.json --format md --out report.md
node scripts/riwaq-cli.mjs export your-batch.json --format docx --out report.docx
node scripts/riwaq-cli.mjs export your-batch.json --format pdf --out report.pdf

# Discover system capabilities, inspect state, and diagnose health
node scripts/riwaq-cli.mjs manifest
node scripts/riwaq-cli.mjs snapshot your-batch.json
node scripts/riwaq-cli.mjs diagnose your-batch.json
```

### Option B — Programmatic JavaScript API

You can import Riwaq's core modules directly into your own Node.js or web projects:

```javascript
import { validateBatch } from './scripts/json-validator.js';
import { analyzeBatch, ANALYSIS_PROFILE } from './scripts/clpcl-analyzer.js';
import { CanonicalReport } from './scripts/canonical-report.js';
import { exportMarkdown } from './scripts/export-md.js';

// 1. Validate and normalize JSON batch
const { valid, collector, normalized } = validateBatch(rawJson);
if (!valid) throw new Error(`${collector.toReport().summary.error_count} validation errors`);

// 2. Run deterministic CL/PCL analysis
const result = analyzeBatch(normalized, ANALYSIS_PROFILE.STRUCTURAL_ONLY);

// 3. Generate canonical academic report and export
const report = CanonicalReport.fromBatch(normalized, { profile: 'structural_only' });
if (report.canExport()) {
  const markdownReport = exportMarkdown(report);
  console.log(markdownReport);
}
```

### Analysis Profiles
* `structural_only`: Analyzes transmission network graph topology without requiring biographical reliability evidence. Ideal for preliminary stemmatic mapping.
* `reliability_weighted`: Incorporates caller-injected biographical evaluation layers and confidence scoring (enabled via `--with-reliability` in the CLI).

For complete technical specifications, numeric contracts, and schema definitions, see `docs/ARCHITECTURE.md` and `docs/AGENT-OPERATING-MODEL.md`.
