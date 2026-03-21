/**
 * scripts/export-md.js
 *
 * Phase 5 — Markdown Export
 *
 * Transforms a CanonicalReport into a formatted Markdown document.
 * All sections are generated from the canonical report data, ensuring
 * consistency with DOCX and PDF outputs.
 *
 * Public API:
 *   exportMarkdown(canonicalReport, options?) → string
 *   exportMarkdownFromData(reportData, options?) → string
 */
import { CanonicalReport } from './canonical-report.js';

export const MD_SECTION = Object.freeze({
  COVER: 'cover',
  FAMILY_METADATA: 'family_metadata',
  METHODOLOGY: 'methodology',
  CANDIDATES: 'candidates',
  EVIDIDENCE_BINDING: 'evidence_binding',
  NORMALIZED_CHAINS: 'normalized_chains',
  NARRATOR_GRAPH: 'narrator_graph',
  UNCERTAINTY: 'uncertainty',
  ARTIFACTS: 'artifacts',
  FOOTER: 'footer',
});

const DEFAULT_OPTIONS = Object.freeze({
  include_chains: true,
  include_graph: false,
  include_evidence_binding: true,
  include_uncertainty: true,
  include_artifacts: false,
  max_chain_display: 20,
});

export function exportMarkdown(canonicalReport, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (!(canonicalReport instanceof CanonicalReport)) {
    throw new Error('exportMarkdown requires a CanonicalReport instance');
  }
  return _renderMarkdown(canonicalReport.getReportData(), opts);
}

export function exportMarkdownFromData(reportData, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  return _renderMarkdown(reportData, opts);
}

function _renderMarkdown(data, opts) {
  const lines = [];

  lines.push(_renderCover(data));
  lines.push(_renderFamilyMetadata(data));
  lines.push(_renderMethodology(data));
  lines.push(_renderCandidates(data));
  lines.push(_renderEvidenceBinding(data, opts));
  lines.push(_renderNormalizedChains(data, opts));
  lines.push(_renderUncertainty(data, opts));
  lines.push(_renderFooter(data));

  return lines.filter(l => l !== null).join('\n\n');
}

function _renderCover(data) {
  const parts = [
    '# Isnad Analysis Report',
    '',
    `**Generated:** ${_formatDate(data.generated_at)}`,
    `**Schema version:** ${data.schema_version}`,
    '',
    `**Families analyzed:** ${data.batch_metadata?.family_count ?? 0}`,
    `**Analysis profile:** ${data.analysis?.profile ?? 'unknown'}`,
    `**Family status:** ${data.analysis?.family_status ?? 'unknown'}`,
  ];
  return parts.join('\n');
}

function _renderFamilyMetadata(data) {
  const families = data.family_metadata || [];
  if (families.length === 0) return null;

  const rows = families.map(f => {
    const sources = f.sources.slice(0, 3).join(', ');
    return `| ${f.family_id} | ${f.record_count} | ${f.variant_count} | ${f.narrator_count} | ${sources || '—'} |`;
  });

  return [
    '## Family Metadata',
    '',
    '| Family ID | Records | Variants | Narrators | Primary Sources |',
    '|-----------|---------|----------|-----------|-----------------|',
    ...rows,
  ].join('\n');
}

function _renderMethodology(data) {
  const note = data.analysis?.methodology_note;
  if (!note) return null;

  return [
    '## Methodology',
    '',
    note,
  ].join('\n');
}

function _renderCandidates(data) {
  const candidates = data.candidates || [];
  if (candidates.length === 0) {
    return [
      '## CL/PCL Candidates',
      '',
      '_No CL/PCL candidates detected for this family._',
    ].join('\n');
  }

  const lines = ['## CL/PCL Candidates', ''];

  for (const c of candidates) {
    const cap = c.contradiction_cap ? ' *(contradiction cap applied)_' : '';
    lines.push(`### ${c.narrator_id} (Rank #${candidates.indexOf(c) + 1})`, '');
    lines.push(`- **Type:** ${_formatType(c.type)}`);
    lines.push(`- **Outcome:** ${_formatOutcome(c.outcome)}`);
    lines.push(`- **Confidence:** ${c.confidence_4dp} (${(c.confidence * 100).toFixed(1)}%)${cap}`);
    lines.push(`- **Profile:** ${c.profile}`);
    lines.push(`- **Structural score:** ${c.structural_score?.toFixed(4) ?? 'n/a'}`);
    if (c.reliability_prior !== null && c.reliability_prior !== undefined) {
      lines.push(`- **Reliability prior:** ${c.reliability_prior.toFixed(4)}`);
    }
    lines.push(`- **Fan-out:** ${c.fan_out ?? 'n/a'}`);
    lines.push(`- **Bundle coverage:** ${_fmtPct(c.bundle_coverage)}`);
    lines.push(`- **Collector diversity:** ${c.collector_diversity ?? 'n/a'}`);
    lines.push(`- **Bypass ratio:** ${_fmtPct(c.bypass_ratio)}`);
    if (c.evidence_ids && c.evidence_ids.length > 0) {
      lines.push(`- **Evidence IDs:** ${c.evidence_ids.join(', ')}`);
    }
    if (c.methodology_note) {
      lines.push(`- **Note:** ${c.methodology_note}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function _renderEvidenceBinding(data, opts) {
  if (!opts.include_evidence_binding) return null;

  const eb = data.evidence_binding || {};
  const bindings = eb.bindings || [];

  const lines = ['## Evidence Binding', ''];
  lines.push(`**Binding valid:** ${eb.valid ? 'Yes' : 'No — blocking violations present'}`);
  lines.push(`**Blocking violations:** ${eb.blocking_violations ?? 0}`);
  lines.push('');

  if (bindings.length === 0) {
    lines.push('_No evidence bindings generated._');
    return lines.join('\n');
  }

  for (const b of bindings) {
    const status = b.is_exempt ? '_(exempt)_' : b.binding_valid ? '✓' : '✗';
    lines.push(`- **${b.narrator_id}** ${status}`);
    lines.push(`  - Category: ${b.claim_category}`);
    if (b.evidence_refs.length > 0) {
      const refs = b.evidence_refs.map(e => `${e.evidence_id}${e.has_provenance ? '' : ' *(missing provenance)*'}`).join(', ');
      lines.push(`  - Evidence: ${refs}`);
    } else {
      lines.push('  - Evidence: _none_');
    }
    for (const v of b.violations) {
      lines.push(`  - **${v.level}:** ${v.code} — ${v.message}`);
    }
  }

  return lines.join('\n');
}

function _renderNormalizedChains(data, opts) {
  if (!opts.include_chains) return null;

  const artifacts = data.all_artifacts;
  if (!artifacts) return null;

  const lines = ['## Normalized Chains', ''];

  for (const [fid, art] of Object.entries(artifacts)) {
    const chains = art?.normalized_chains?.chains || [];
    if (chains.length === 0) continue;

    lines.push(`### Family: ${fid} (${chains.length} chains)`, '');

    for (const chain of chains.slice(0, opts.max_chain_display)) {
      const chainStr = chain.isnad_chain.join(' → ');
      lines.push(`- **${chain.variant_id}** (${chain.record_id}): ${chainStr}`);
      if (chain.matn_raw) {
        lines.push(`  _${chain.matn_raw.slice(0, 80)}${chain.matn_raw.length > 80 ? '…' : ''}_`);
      }
      lines.push(`  Source: _${chain.provenance_ref}_`);
    }

    if (chains.length > opts.max_chain_display) {
      lines.push(`_… and ${chains.length - opts.max_chain_display} more chains_`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function _renderUncertainty(data, opts) {
  if (!opts.include_uncertainty) return null;

  const unc = data.uncertainty || {};
  const excluded = unc.excluded_candidates || [];
  const insufficient = unc.insufficient_data_families || [];
  const unverified = unc.unverified_evidence || [];
  const blocking = unc.blocking_violations || [];

  const lines = ['## Uncertainty and Exclusion', ''];

  if (excluded.length === 0 && insufficient.length === 0 && unverified.length === 0 && blocking.length === 0) {
    lines.push('_No uncertainty flags for this analysis._');
    return lines.join('\n');
  }

  for (const e of excluded) {
    lines.push(`- **Excluded:** ${e.narrator_id} (${e.candidate_type})`);
    lines.push(`  Reason: ${e.reason}${e.detail ? ` — ${e.detail}` : ''}`);
  }

  for (const f of insufficient) {
    lines.push(`- **Insufficient data:** family _${f.family_id}_ — ${f.reason || 'no CL/PCL candidates detected'}`);
  }

  for (const u of unverified) {
    lines.push(`- **Unverified evidence:** ${u.narrator_id} — ${u.reason || 'evidence does not meet provenance requirements'}`);
  }

  for (const b of blocking) {
    lines.push(`- **Blocking:** ${b.code} — ${b.message}`);
  }

  return lines.join('\n');
}

function _renderFooter(data) {
  return [
    '---',
    '*This report was generated by Academic Crescent Hadith Chain Builder.*',
    `*Report schema v${data.schema_version} — ${_formatDate(data.generated_at)}*`,
  ].join('\n');
}

function _formatDate(iso) {
  if (!iso) return 'unknown';
  try {
    return new Date(iso).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' });
  } catch {
    return iso;
  }
}

function _formatType(type) {
  const map = {
    common_link: 'Common Link (CL)',
    partial_common_link: 'Partial Common Link (PCL)',
  };
  return map[type] || type;
}

function _formatOutcome(outcome) {
  const map = {
    supported: '✅ Supported',
    contested: '⚠️ Contested',
    uncertain: '❓ Uncertain',
    likely_weak_in_context: '🔻 Likely Weak',
    insufficient_data: '— Insufficient Data',
    unverified_claim: '— Unverified Claim',
  };
  return map[outcome] || outcome;
}

function _fmtPct(val) {
  if (val === null || val === undefined) return 'n/a';
  return `${(val * 100).toFixed(1)}%`;
}
