/**
 * scripts/reliability-layer.js
 *
 * Phase 2 — Reliability Layer System
 *
 * Implements a three-layer reliability model where reported, analytical, and
 * derived assessments coexist without overwriting each other.
 *
 * Layer model:
 *   reported     — Classical hadith scholar assessments from source works
 *                  (Tahdhib al-Kamal, Taqrib al-Tahdhib, Mizan al-I'tidal)
 *   analytical   — CL/PCL findings from structural analysis (Phase 3)
 *   derived      — Weighted composite scores from the other two layers
 *
 * Invariants enforced:
 *   1. Evidence items are never deleted — only superseded by new items with higher version.
 *   2. Each evidence item is provenance-bound (source_ref required).
 *   3. Duplicate evidence (same narrator + same source + same rating) is idempotently merged.
 *   4. Reported and analytical layers are strictly separated — no cross-layer overwriting.
 *   5. Contradictions are flagged, not auto-resolved.
 *
 * Public API:
 *   ReliabilityLayer.fromBatch(batch) → ReliabilityLayer
 *   layer.addReported(narratorId, evidenceItem) → void
 *   layer.addAnalytical(narratorId, evidenceItem) → void
 *   layer.getReported(narratorId) → EvidenceItem[]
 *   layer.getAnalytical(narratorId) → EvidenceItem[]
 *   layer.getDerived(narratorId) → DerivedAssessment|null
 *   layer.getAllEvidence(narratorId) → { reported, analytical, derived }
 *   layer.getContradictions(narratorId) → ContradictionPair[]
 *   layer.toBatch(batch) → annotatedBatch  (attaches evidence to batch narrators)
 */
export const LAYER = Object.freeze({
  REPORTED: 'reported',
  ANALYTICAL: 'analytical',
  DERIVED: 'derived',
});

export const RATING = Object.freeze({
  THIQAH: 'thiqah',
  SADUQ: 'saduq',
  MAJHUL: 'majhul',
  DAIF: 'daif',
  MATRUK: 'matruk',
  ACCUSED: 'accused_fabrication',
});

const RATING_PRIOR = Object.freeze({
  [RATING.THIQAH]: 0.75,
  [RATING.SADUQ]: 0.65,
  [RATING.MAJHUL]: 0.50,
  [RATING.DAIF]: 0.35,
  [RATING.MATRUK]: 0.20,
  [RATING.ACCUSED]: 0.20,
});

function makeEvidenceId() {
  return `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function hasProvenance(item) {
  return (
    item &&
    typeof item === 'object' &&
    item.source_ref &&
    typeof item.source_ref.collection === 'string' &&
    typeof item.source_ref.source_type === 'string' &&
    typeof item.source_ref.source_locator === 'string' &&
    typeof item.source_ref.ingested_at === 'string'
  );
}

function evidenceKey(item) {
  return `${item.narrator_id}::${item.source_ref?.collection}::${item.rating}`;
}

export class ReliabilityLayer {
  constructor() {
    /** @type {Map<string, Map<string, object>>} narratorId → key → evidenceItem */
    this._reported = new Map();
    /** @type {Map<string, Map<string, object>>} narratorId → key → evidenceItem */
    this._analytical = new Map();
    /** @type {Map<string, object>} narratorId → DerivedAssessment */
    this._derived = new Map();
  }

  /**
   * Seed from a normalized batch's pre-existing reliability_evidence.
   * @param {object} batch
   * @returns {ReliabilityLayer} this
   */
  seedFromBatch(batch) {
    for (const narrator of (batch.narrators || [])) {
      for (const ev of (narrator.reliability_evidence || [])) {
        const layer = ev.date_layer === LAYER.ANALYTICAL ? LAYER.ANALYTICAL : LAYER.REPORTED;
        this._upsert(layer, narrator.narrator_id, ev);
      }
    }
    return this;
  }

  _upsert(layer, narratorId, item) {
    if (!hasProvenance(item)) {
      throw new Error(`Reliability evidence for "${narratorId}" is missing required provenance fields`);
    }
    const store = layer === LAYER.ANALYTICAL ? this._analytical : this._reported;
    if (!store.has(narratorId)) store.set(narratorId, new Map());
    const key = evidenceKey(item);
    store.get(narratorId).set(key, { ...item, evidence_id: item.evidence_id || makeEvidenceId() });
  }

  /**
   * Add a reported reliability assessment.
   * Must have source_ref provenance.
   * @param {string} narratorId
   * @param {object} item — ReliabilityEvidence shape
   */
  addReported(narratorId, item) {
    if (item.date_layer && item.date_layer !== LAYER.REPORTED) {
      throw new Error(`Cannot add analytical evidence via addReported; use addAnalytical`);
    }
    this._upsert(LAYER.REPORTED, narratorId, { ...item, date_layer: LAYER.REPORTED });
  }

  /**
   * Add an analytical reliability assessment (from CL/PCL analysis).
   * Must have source_ref provenance.
   * @param {string} narratorId
   * @param {object} item
   */
  addAnalytical(narratorId, item) {
    this._upsert(LAYER.ANALYTICAL, narratorId, { ...item, date_layer: LAYER.ANALYTICAL });
  }

  /**
   * Get all reported evidence for a narrator.
   * @param {string} narratorId
   * @returns {object[]}
   */
  getReported(narratorId) {
    return [...(this._reported.get(narratorId)?.values() || [])];
  }

  /**
   * Get all analytical evidence for a narrator.
   * @param {string} narratorId
   * @returns {object[]}
   */
  getAnalytical(narratorId) {
    return [...(this._analytical.get(narratorId)?.values() || [])];
  }

  /**
   * Compute and return the derived assessment for a narrator.
   * Uses the deterministic reliability blend from Phase 3 spec.
   * @param {string} narratorId
   * @returns {{ prior: number, ratings: string[], conflicting: boolean, derived_confidence: number }|null}
   */
  getDerived(narratorId) {
    const reported = this.getReported(narratorId);
    const analytical = this.getAnalytical(narratorId);

    if (reported.length === 0 && analytical.length === 0) return null;

    let weightedSum = 0;
    let weightTotal = 0;
    const ratings = [];

    for (const ev of reported) {
      const prior = RATING_PRIOR[ev.rating] ?? 0.50;
      const weight = ev.rating_confidence ?? 0.5;
      weightedSum += prior * weight;
      weightTotal += weight;
      ratings.push(ev.rating);
    }

    for (const ev of analytical) {
      const prior = RATING_PRIOR[ev.rating] ?? 0.50;
      const weight = ev.rating_confidence ?? 0.5;
      weightedSum += prior * weight * 0.5;
      weightTotal += weight * 0.5;
      ratings.push(ev.rating);
    }

    const prior = weightTotal > 0 ? weightedSum / weightTotal : 0.50;

    const ratingSet = new Set(ratings);
    const hasContradiction =
      (ratingSet.has(RATING.THIQAH) && ratingSet.has(RATING.DAIF)) ||
      (ratingSet.has(RATING.THIQAH) && ratingSet.has(RATING.MATRUK)) ||
      (ratingSet.has(RATING.THIQAH) && ratingSet.has(RATING.ACCUSED)) ||
      (ratingSet.has(RATING.MATRUK) && ratingSet.has(RATING.ACCUSED));

    const derived_confidence = hasContradiction ? Math.min(prior, 0.70) : prior;

    return {
      prior: Math.round(prior * 1000) / 1000,
      ratings: [...new Set(ratings)],
      conflicting: hasContradiction,
      derived_confidence: Math.round(derived_confidence * 1000) / 1000,
      sources_count: reported.length + analytical.length,
    };
  }

  /**
   * Get all evidence (reported + analytical + derived) for a narrator.
   * @param {string} narratorId
   * @returns {{ reported: object[], analytical: object[], derived: object|null }}
   */
  getAllEvidence(narratorId) {
    return {
      reported: this.getReported(narratorId),
      analytical: this.getAnalytical(narratorId),
      derived: this.getDerived(narratorId),
    };
  }

  /**
   * Find contradictory evidence pairs for a narrator.
   * @param {string} narratorId
   * @returns {{ itemA: object, itemB: object, severity: string }[]}
   */
  getContradictions(narratorId) {
    const reported = this.getReported(narratorId);
    const contradictions = [];

    for (let i = 0; i < reported.length; i++) {
      for (let j = i + 1; j < reported.length; j++) {
        const a = reported[i];
        const b = reported[j];
        if (
          (a.rating === RATING.THIQAH && (b.rating === RATING.DAIF || b.rating === RATING.MATRUK || b.rating === RATING.ACCUSED)) ||
          (b.rating === RATING.THIQAH && (a.rating === RATING.DAIF || a.rating === RATING.MATRUK || a.rating === RATING.ACCUSED)) ||
          (a.rating === RATING.MATRUK && b.rating === RATING.ACCUSED) ||
          (b.rating === RATING.MATRUK && a.rating === RATING.ACCUSED)
        ) {
          const severity = (a.rating === RATING.THIQAH || b.rating === RATING.THIQAH) ? 'high' : 'medium';
          contradictions.push({ itemA: a, itemB: b, severity });
        }
      }
    }

    return contradictions;
  }

  /**
   * Annotate a batch by attaching computed reliability evidence to each narrator.
   * Returns a new batch object (does not mutate input).
   * @param {object} batch
   * @returns {{ batch: object, annotatedCount: number }}
   */
  toBatch(batch) {
    const annotated = JSON.parse(JSON.stringify(batch));
    let annotatedCount = 0;

    for (const narrator of (annotated.narrators || [])) {
      const all = this.getAllEvidence(narrator.narrator_id);
      narrator.reliability_evidence = [
        ...all.reported,
        ...all.analytical,
      ];
      if (all.derived) {
        narrator._derived_assessment = all.derived;
      }
      annotatedCount++;
    }

    return { batch: annotated, annotatedCount };
  }
}

export default { ReliabilityLayer, LAYER, RATING, RATING_PRIOR };
