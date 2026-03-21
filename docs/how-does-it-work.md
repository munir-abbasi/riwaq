# How Does Riwaq Work?

**Formerly: Academic Crescent Hadith Chain Builder**

## What is this app?

This app helps scholars study how Hadith (sayings attributed to the Prophet Muhammad) were passed down through history. Instead of writing chains on paper, you build them visually in the browser.

## How do I use it?

### 1. Build a chain
You add narrators one by one, like a linked list:

```
Prophet Muhammad → Companion → Scholar 1 → Scholar 2 → Collector
```

For each narrator you can optionally add:
- Where they lived (cities/locations)
- When they were born and died (in either the Hijri or Gregorian calendar — the app handles both)
- Custom tags (like "Medinese", "Tabi'un", etc.)
- The text (matn) connected to that narrator

### 2. See it as a map
The app draws a spider diagram of your chain automatically. You can drag each node around to arrange it however you like — the connecting lines redraw in real time.

### 3. Compare text versions (matn alignment)
If you have two versions of the same hadith's wording, the app highlights word-by-word differences: what stayed the same, what was added, and what was removed.

### 4. New feature: Find Common Links
When you import a batch of hadiths that share narrators, the app uses Juynboll's CL/PCL methodology to find the earliest narrator who likely "went public" with the hadith — the point where transmission began branching out to many students.

It gives you a confidence score so you know how strong the evidence is. You can also bind each analytical claim to specific scholarly sources (like classical biographical dictionaries) to make sure nothing unsupported gets exported.

### 5. Export for publication
You can export the analysis as a DOCX or PDF ready for academic papers.

## Do I need to install anything?

No. Just open `index.html` in any modern browser. To serve it locally instead:

```bash
python -m http.server 8000
# Then open http://localhost:8000
```

Your chains are saved automatically in the browser — no account needed, no data leaves your machine.
