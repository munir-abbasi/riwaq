/**
 * scripts/agent-control.js
 *
 * Agent-native observability projections. This module owns no analytical
 * semantics: it describes existing public boundaries and composes current
 * owner outputs into a compact state snapshot (D013).
 */
import { ERROR_CODE } from './import-errors.js';
import { evaluateGates } from './preflight-gates.js';
import { AntiHallucinationValidator } from './anti-hallucination.js';
import { CanonicalReport } from './canonical-report.js';

export const AGENT_CONTROL_MANIFEST_VERSION = 3;
export const AGENT_STATE_SNAPSHOT_VERSION = 1;
export const SEMANTIC_IMPACT_ROUTE_VERSION = 1;
export const AGENT_DIAGNOSTICS_VERSION = 1;

const CLI_VERIFY = 'npx vitest run tests/node/cli.test.js';

const CAPABILITIES = Object.freeze([
  {
    id: 'cli.manifest', layer: 'L9/control-plane', owner: 'scripts/agent-control.js',
    invocation: 'node scripts/riwaq-cli.mjs manifest', inputs: [],
    outputs: ['capability/contract manifest'], preconditions: [], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'docs/AGENT-OPERATING-MODEL.md'],
  },
  {
    id: 'cli.snapshot', layer: 'L9/control-plane', owner: 'scripts/agent-control.js',
    invocation: 'node scripts/riwaq-cli.mjs snapshot <file> [--profile P] [--with-reliability]',
    inputs: ['validated import file', 'optional analysis profile', 'optional reliability-layer opt-in'],
    outputs: ['compact cross-layer state packet'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.publication.can_export', control_type: 'projection',
    gate_scope: 'snapshot execution is observational; publication authority remains CanonicalReport.canExport()',
    verification: CLI_VERIFY, downstream_consumers: ['agents'],
  },
  {
    id: 'cli.diagnose', layer: 'L9/control-plane', owner: 'scripts/agent-control.js',
    invocation: 'node scripts/riwaq-cli.mjs diagnose <file> [--profile P] [--with-reliability]',
    inputs: ['validated import file', 'optional analysis profile', 'optional reliability-layer opt-in'],
    outputs: ['prioritized agent diagnosis and remediation packet'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.can_export and data.primary_blocker', control_type: 'projection',
    gate_scope: 'diagnostic projection; publication authority remains CanonicalReport.canExport()',
    verification: CLI_VERIFY, downstream_consumers: ['agents'],
  },
  {
    id: 'cli.impact', layer: 'L9/control-plane', owner: 'scripts/agent-control.js',
    invocation: 'node scripts/riwaq-cli.mjs impact <capability-id> [capability-id ...]',
    inputs: ['one or more capability IDs from the manifest'], outputs: ['semantic-impact route'],
    preconditions: ['every capability ID must exist in the manifest'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents'],
  },
  {
    id: 'cli.seal', layer: 'L9/security projection', owner: 'scripts/integrity-seal.js',
    invocation: 'node scripts/riwaq-cli.mjs seal <file>', inputs: ['schema-valid import file'],
    outputs: ['deterministic integrity manifest'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'research archives'],
  },
  {
    id: 'cli.verifySeal', layer: 'L9/security observation', owner: 'scripts/integrity-seal.js',
    invocation: 'node scripts/riwaq-cli.mjs verify-seal <file> --manifest <path>',
    inputs: ['schema-valid import file', 'retained integrity manifest'], outputs: ['structured integrity comparison'],
    preconditions: ['schema validation must succeed', 'integrity manifest must be readable'], side_effects: [],
    decision_signal: 'data.valid', control_type: 'observation',
    gate_scope: 'caller-selected tamper check; not schema validity or publication authority',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'research archives'],
  },
  {
    id: 'cli.validate', layer: 'L9→L1', owner: 'scripts/json-validator.js',
    invocation: 'node scripts/riwaq-cli.mjs validate <file>', inputs: ['import file'],
    outputs: ['validation report'], preconditions: [], side_effects: [],
    decision_signal: 'data.valid', control_type: 'blocking_precondition', gate_scope: 'input canonicalization',
    verification: CLI_VERIFY, downstream_consumers: ['cli.gates', 'cli.hallucination', 'cli.analyze', 'cli.report', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'cli.gates', layer: 'L9→L1', owner: 'scripts/preflight-gates.js',
    invocation: 'node scripts/riwaq-cli.mjs gates <file> [--min-score N]', inputs: ['valid normalized batch'],
    outputs: ['quality score and gate observations'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.qualityScore', control_type: 'observation', gate_scope: 'caller-selected quality check; not the publication gate',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'cli.hallucination', layer: 'L9→L1', owner: 'scripts/anti-hallucination.js',
    invocation: 'node scripts/riwaq-cli.mjs hallucination <file>', inputs: ['valid normalized batch'],
    outputs: ['pre-analysis integrity report'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.can_proceed', control_type: 'observation', gate_scope: 'standalone integrity operation; not the publication gate',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'cli.analyze', layer: 'L9→L4/L5', owner: 'scripts/clpcl-analyzer.js',
    invocation: 'node scripts/riwaq-cli.mjs analyze <file> [--profile P] [--with-reliability]', inputs: ['valid normalized batch'],
    outputs: ['family analytical state and candidates with feature-basis metadata'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.family_status and data.candidates[].outcome', control_type: 'analytical_state', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'canonical report'],
  },
  {
    id: 'cli.report', layer: 'L9→L8', owner: 'scripts/canonical-report.js',
    invocation: 'node scripts/riwaq-cli.mjs report <file> [--profile P] [--with-reliability]', inputs: ['valid normalized batch'],
    outputs: ['canonical report summary, ordered family results, and per-family validation state'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: 'data.can_export', control_type: 'publication_gate', gate_scope: 'analytical publication/export',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'exporters'],
  },
  {
    id: 'cli.pipeline', layer: 'L9/orchestration', owner: 'scripts/riwaq-cli.mjs',
    invocation: 'node scripts/riwaq-cli.mjs pipeline <file> [--profile P] [--with-reliability]', inputs: ['import file'],
    outputs: ['validation, quality, integrity, analysis, and publication signals'], preconditions: ['schema validation must succeed before downstream stages'], side_effects: [],
    decision_signal: 'data.report.can_export', control_type: 'projection',
    gate_scope: 'after validation, ok/exit follows CanonicalReport.canExport(); quality/integrity remain observations',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'automation'],
  },
  {
    id: 'cli.artifacts', layer: 'L9', owner: 'scripts/artifacts.js',
    invocation: 'node scripts/riwaq-cli.mjs artifacts <file> [--family ID]', inputs: ['valid normalized batch'],
    outputs: ['machine-readable derived artifact bundle'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents', 'research tooling'],
  },
  {
    id: 'cli.families', layer: 'L9→L3', owner: 'scripts/riwaq-cli.mjs',
    invocation: 'node scripts/riwaq-cli.mjs families <file>', inputs: ['valid normalized batch'],
    outputs: ['family IDs and counts'], preconditions: ['schema validation must succeed'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: CLI_VERIFY, downstream_consumers: ['agents'],
  },
  {
    id: 'cli.export', layer: 'L9', owner: 'scripts/export-*.js',
    invocation: 'node scripts/riwaq-cli.mjs export <file> --format md|docx|pdf [--out PATH] [--profile P] [--with-reliability]',
    inputs: ['valid normalized batch', 'format', 'optional output path'], outputs: ['Markdown on stdout or exported file'],
    preconditions: ['schema validation must succeed', 'CanonicalReport.canExport() must be true'],
    side_effects: ['writes output file when --out is supplied'], decision_signal: 'CanonicalReport.canExport()',
    control_type: 'publication_gate', gate_scope: 'analytical publication/export', verification: CLI_VERIFY,
    downstream_consumers: ['human-readable reports'],
  },
  {
    id: 'module.validateBatch', layer: 'L1', owner: 'scripts/json-validator.js',
    invocation: 'validateBatch(rawJson)', inputs: ['raw JSON string/object'], outputs: ['valid', 'collector', 'normalized'],
    preconditions: [], side_effects: [], decision_signal: 'valid', control_type: 'blocking_precondition', gate_scope: 'input canonicalization',
    verification: 'npx vitest run tests/node/json-validator.test.js', downstream_consumers: ['normalized batch consumers'],
  },
  {
    id: 'module.evaluateGates', layer: 'L1 observation', owner: 'scripts/preflight-gates.js',
    invocation: 'evaluateGates(normalizedBatch, collector?)', inputs: ['normalized batch'], outputs: ['passed', 'qualityScore', 'gateResults'],
    preconditions: ['schema-valid normalized batch'], side_effects: ['appends findings when a collector is supplied'],
    decision_signal: 'qualityScore', control_type: 'observation', gate_scope: 'caller quality check',
    verification: 'npx vitest run tests/node/json-validator.test.js', downstream_consumers: ['agents', 'cli.gates', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'module.antiHallucination', layer: 'L1 observation', owner: 'scripts/anti-hallucination.js',
    invocation: 'AntiHallucinationValidator.fromBatch(batch).validate()', inputs: ['normalized batch'], outputs: ['integrity result/report'],
    preconditions: ['schema-valid normalized batch'], side_effects: [], decision_signal: 'canProceed()/toReport().can_proceed',
    control_type: 'observation', gate_scope: 'standalone integrity operation',
    verification: 'npx vitest run tests/node/phase4.test.js', downstream_consumers: ['agents', 'cli.hallucination', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'module.entityResolver', layer: 'L2', owner: 'scripts/entity-resolution.js',
    invocation: 'EntityResolver seed/merge/split/remap', inputs: ['canonical narrator state', 'identity operation'],
    outputs: ['updated identity state', 'operation log with durable receipts', 'remapped batch'], preconditions: ['valid identity references'],
    side_effects: ['updates resolver state and operation log in memory'], decision_signal: 'operation result/log',
    control_type: 'projection', gate_scope: 'identity invariants; state change is declared under side_effects',
    verification: 'npx vitest run tests/node/entity-resolution.test.js', downstream_consumers: ['canonical batch', 'analysis'],
  },
  {
    id: 'module.reliabilityLayer', layer: 'L5 support', owner: 'scripts/reliability-layer.js',
    invocation: 'new ReliabilityLayer().seedFromBatch(batch)', inputs: ['normalized batch reliability evidence'], outputs: ['derived reliability layer'],
    preconditions: ['explicit caller opt-in'], side_effects: [], decision_signal: null, control_type: 'analytical_state', gate_scope: 'none',
    verification: 'npx vitest run tests/node/reliability-layer.test.js', downstream_consumers: ['analyzeBatch', 'CanonicalReport'],
  },
  {
    id: 'module.analyzeBatch', layer: 'L4/L5', owner: 'scripts/clpcl-analyzer.js',
    invocation: 'analyzeBatch(batch, profile, reliabilityLayer?)', inputs: ['canonical family batch', 'analysis profile', 'optional reliability layer'],
    outputs: ['family_status', 'candidates with feature-basis metadata', 'analysis_snapshot'], preconditions: ['canonical batch'], side_effects: [],
    decision_signal: 'family_status and candidate outcome', control_type: 'analytical_state', gate_scope: 'none',
    verification: 'npx vitest run tests/node/clpcl-analyzer.test.js', downstream_consumers: ['ClaimEvidenceBinder', 'CanonicalReport', 'artifacts'],
  },
  {
    id: 'module.claimEvidenceBinder', layer: 'L6', owner: 'scripts/evidence-binding.js',
    invocation: 'ClaimEvidenceBinder.fromAnalysisResult(result, batch).validate()', inputs: ['analysis result', 'canonical batch with narrator evidence or legacy record fallback'],
    outputs: ['ValidationResult'], preconditions: ['analysis result'], side_effects: [], decision_signal: 'analysis_can_proceed',
    control_type: 'publication_gate', gate_scope: 'family analytical release',
    verification: 'npx vitest run tests/node/phase4.test.js', downstream_consumers: ['CanonicalReport', 'ExplainabilityReport'],
  },
  {
    id: 'module.explainability', layer: 'L7', owner: 'scripts/explainability.js',
    invocation: 'ExplainabilityReport.fromAnalysisResult(result, batch, binding)', inputs: ['analysis result', 'batch', 'binding result'],
    outputs: ['explainability panels', 'audit trail', 'uncertainty'], preconditions: ['analysis result'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: 'npx vitest run tests/node/phase4.test.js', downstream_consumers: ['CanonicalReport'],
  },
  {
    id: 'module.canonicalReport', layer: 'L8', owner: 'scripts/canonical-report.js',
    invocation: 'CanonicalReport.fromBatch(batch, { profile, reliabilityLayer })', inputs: ['canonical batch', 'analysis options'],
    outputs: ['canonical report object with ordered per-family results'], preconditions: ['canonical batch'], side_effects: [], decision_signal: 'canExport()',
    control_type: 'publication_gate', gate_scope: 'analytical publication/export',
    verification: 'npx vitest run tests/node/phase5.test.js', downstream_consumers: ['exporters', 'cli.report', 'cli.pipeline', 'cli.snapshot'],
  },
  {
    id: 'module.emitArtifacts', layer: 'L9', owner: 'scripts/artifacts.js',
    invocation: 'emitArtifacts(batch, analysisResult, familyId)', inputs: ['batch', 'analysis result', 'family ID'],
    outputs: ['normalized chains', 'narrator graph', 'CL candidates', 'analysis snapshot'], preconditions: ['analysis result'], side_effects: [],
    decision_signal: null, control_type: 'projection', gate_scope: 'none',
    verification: 'npx vitest run tests/node/phase5.test.js', downstream_consumers: ['CanonicalReport', 'agents'],
  },
  {
    id: 'module.exporters', layer: 'L9', owner: 'scripts/export-md.js, scripts/export-docx.js, scripts/export-pdf.js',
    invocation: 'exportMarkdown(report) | exportDOCX(report) | exportPDF(report)', inputs: ['CanonicalReport'], outputs: ['Markdown string or document bytes'],
    preconditions: ['caller must enforce CanonicalReport.canExport() for publishable export'], side_effects: [], decision_signal: null,
    control_type: 'projection', gate_scope: 'none', verification: 'npx vitest run tests/node/phase5.test.js tests/node/phase6.test.js',
    downstream_consumers: ['human-readable reports'],
  },
  {
    id: 'module.integritySeal', layer: 'L9/security', owner: 'scripts/integrity-seal.js',
    invocation: 'createIntegrityManifest(batch) | verifyIntegrityManifest(batch, manifest)',
    inputs: ['canonical import batch', 'optional retained integrity manifest'],
    outputs: ['deterministic integrity manifest or comparison report'],
    preconditions: ['canonical batch'], side_effects: [], decision_signal: 'verification result valid',
    control_type: 'observation', gate_scope: 'caller-selected tamper check; not an authenticity or publication gate',
    verification: CLI_VERIFY, downstream_consumers: ['cli.seal', 'cli.verifySeal', 'research archives'],
  },
  {
    id: 'tooling.verifyParity', layer: 'L9/deployment', owner: 'scripts/verify-parity.sh',
    invocation: 'npm run verify:parity', inputs: ['index.html', 'academic/index.html'], outputs: ['pass/fail'], preconditions: [], side_effects: [],
    decision_signal: 'process exit status', control_type: 'blocking_precondition', gate_scope: 'deployment parity',
    verification: 'npm run verify:parity', downstream_consumers: ['CI deployment'],
  },
]);

const DEFAULT_CONTRACT_DOCS = Object.freeze([
  'docs/AGENT-OPERATING-MODEL.md',
  'docs/ARCHITECTURE.md',
]);

const CONTRACT_DOC_OVERRIDES = Object.freeze({
  'module.validateBatch': ['docs/SCHEMA-VERSIONING.md', 'docs/ARCHITECTURE.md'],
  'module.antiHallucination': ['docs/SECURITY.md', 'docs/ARCHITECTURE.md'],
  'cli.seal': ['docs/SECURITY.md', 'docs/AGENT-OPERATING-MODEL.md'],
  'cli.verifySeal': ['docs/SECURITY.md', 'docs/AGENT-OPERATING-MODEL.md'],
  'module.integritySeal': ['docs/SECURITY.md', 'docs/ARCHITECTURE.md'],
  'tooling.verifyParity': ['docs/ARCHITECTURE.md'],
});

function contractDocsFor(capabilityId) {
  return [...(CONTRACT_DOC_OVERRIDES[capabilityId] || DEFAULT_CONTRACT_DOCS)];
}

function copyCapability(capability) {
  return {
    ...capability,
    inputs: [...capability.inputs],
    outputs: [...capability.outputs],
    preconditions: [...capability.preconditions],
    side_effects: [...capability.side_effects],
    downstream_consumers: [...capability.downstream_consumers],
    contract_docs: contractDocsFor(capability.id),
  };
}

export function getCapabilityManifest() {
  return {
    manifest_version: AGENT_CONTROL_MANIFEST_VERSION,
    authority: {
      current_behavior: 'owning source + closest behavioral tests',
      publication: 'CanonicalReport.canExport()',
      numeric_contracts: 'docs/ARCHITECTURE.md#canonical-numeric-and-enum-contracts',
      architecture_decisions: 'docs/DECISIONS.md',
    },
    capabilities: CAPABILITIES.map(copyCapability),
  };
}

function unique(values) {
  return [...new Set(values)];
}

export function buildSemanticImpactRoute(capabilityIds) {
  const requestedIds = unique((Array.isArray(capabilityIds) ? capabilityIds : [capabilityIds]).filter(Boolean));
  const capabilitiesById = new Map(CAPABILITIES.map(capability => [capability.id, capability]));
  const unknownCapabilities = requestedIds.filter(id => !capabilitiesById.has(id));
  if (requestedIds.length === 0 || unknownCapabilities.length > 0) {
    return {
      valid: false,
      unknown_capabilities: unknownCapabilities,
      available_capabilities: CAPABILITIES.map(capability => capability.id),
    };
  }

  const selected = requestedIds.map(id => capabilitiesById.get(id));
  return {
    valid: true,
    impact_version: SEMANTIC_IMPACT_ROUTE_VERSION,
    capability_ids: requestedIds,
    layers_changed: unique(selected.map(capability => capability.layer)),
    contracts_changed: selected.map(capability => ({
      capability_id: capability.id,
      owner: capability.owner,
      control_type: capability.control_type,
      decision_signal: capability.decision_signal,
      gate_scope: capability.gate_scope,
    })),
    owners: unique(selected.map(capability => capability.owner)),
    contract_docs: unique(selected.flatMap(capability => contractDocsFor(capability.id))),
    downstream_consumers: unique(selected.flatMap(capability => capability.downstream_consumers)),
    verification: unique(selected.map(capability => capability.verification)),
  };
}

function compactFamilyState(report, familyId) {
  const analysis = report.getAnalysisResult(familyId);
  const validation = report.getValidationResult(familyId);
  const blocking = (validation?.violations || []).filter(v => v.level === 'blocking');
  return {
    family_status: analysis?.family_status || 'unknown',
    candidate_count: analysis?.candidate_count ?? (analysis?.candidates || []).length,
    analysis_can_proceed: validation?.analysis_can_proceed ?? true,
    blocking_violation_count: blocking.length,
    blocking_violation_codes: [...new Set(blocking.map(v => v.code).filter(Boolean))],
  };
}

function applicableSharpEdges({ unresolvedRefs, profile, reliabilityLayerUsed, perFamily }) {
  const ids = ['schemas_are_descriptive_not_runtime'];
  if (unresolvedRefs.length > 0) {
    ids.push('anti_hallucination_is_stricter_for_undeclared_narrators');
  }
  if (profile === 'reliability_weighted' || reliabilityLayerUsed) {
    ids.push('record_level_reliability_evidence_is_binding_only');
  }
  if (Object.values(perFamily).some(state => state.family_status === 'insufficient_data')) {
    ids.push('chain_orientation_affects_cl_detection');
  }
  return ids;
}

export function buildAgentStateSnapshot({ normalized, collector, profile, reliabilityLayer = null, reliabilityLayerUsed = false }) {
  const validationReport = collector.toReport();
  const unresolvedRefs = validationReport.warnings.filter(w => w.code === ERROR_CODE.UNRESOLVED_REF);
  const { passed, qualityScore, gateResults } = evaluateGates(normalized);
  const integrity = AntiHallucinationValidator.fromBatch(normalized).validate().toReport();
  const report = CanonicalReport.fromBatch(normalized, { profile, reliabilityLayer });
  const familyIds = report.getFamilyIds();
  const perFamily = Object.fromEntries(familyIds.map(fid => [fid, compactFamilyState(report, fid)]));

  return {
    snapshot_version: AGENT_STATE_SNAPSHOT_VERSION,
    control_type: 'observation',
    intake: {
      schema_version: normalized.schema_version,
      family_ids: familyIds,
      family_count: familyIds.length,
      record_count: (normalized.records || []).length,
      variant_count: (normalized.records || []).reduce((sum, record) => sum + (record.variants || []).length, 0),
      narrator_count: (normalized.narrators || []).length,
      validation_warning_count: validationReport.summary.warning_count,
      unresolved_references: unresolvedRefs,
    },
    observations: {
      quality: { passed, quality_score: qualityScore, gates: gateResults },
      integrity: {
        valid: integrity.valid,
        can_proceed: integrity.can_proceed,
        violation_count: integrity.violation_count,
        warning_count: integrity.warning_count,
        summary: integrity.summary,
      },
    },
    analysis: {
      profile,
      reliability_layer_used: reliabilityLayerUsed,
      per_family: perFamily,
    },
    publication: {
      authority: 'CanonicalReport.canExport()',
      can_export: report.canExport(),
    },
    sharp_edges: {
      source: 'docs/AGENT-OPERATING-MODEL.md#8-sharp-edges',
      applicable: applicableSharpEdges({ unresolvedRefs, profile, reliabilityLayerUsed, perFamily }),
    },
  };
}

export function buildAgentDiagnostics({ normalized, collector, profile = 'structural_only', reliabilityLayer = null, reliabilityLayerUsed = false }) {
  const blockers = [];
  const warnings = [];

  const validationReport = collector && typeof collector.toReport === 'function'
    ? collector.toReport()
    : { warnings: [], errors: [] };

  for (const e of (validationReport.errors || [])) {
    blockers.push({
      layer: 'L1',
      code: e.code || 'VALIDATION_ERROR',
      entity_id: e.narrator_id || null,
      family_id: e.family_id || null,
      message: e.message || 'Validation error',
      remediation: {
        action: 'FIX_SCHEMA_VALIDATION',
        advice: 'Intake batch violates schema specification; inspect error path and fix fields.',
      },
    });
  }

  for (const w of (validationReport.warnings || [])) {
    warnings.push({
      layer: 'L1',
      code: w.code || 'VALIDATION_WARNING',
      entity_id: w.narrator_id || null,
      family_id: w.family_id || null,
      message: w.message || 'Validation warning',
      remediation: {
        action: w.code === ERROR_CODE.UNRESOLVED_REF ? 'DECLARE_NARRATOR_PROFILE' : 'INSPECT_INTAKE',
        advice: w.code === ERROR_CODE.UNRESOLVED_REF
          ? `Add a top-level narrator profile in narrators[] for '${w.narrator_id || 'unresolved'}' to ensure biographical and AH compliance.`
          : 'Review intake batch against schema-version 1.',
      },
    });
  }

  if (!normalized) {
    return {
      diagnostics_version: AGENT_DIAGNOSTICS_VERSION,
      status: 'blocked',
      can_export: false,
      primary_blocker: blockers.length > 0 ? blockers[0].code : 'INVALID_INPUT',
      summary: {
        blocker_count: blockers.length,
        warning_count: warnings.length,
        family_count: 0,
        can_export: false,
      },
      blockers,
      warnings,
      recommended_next_action: 'Fix schema validation errors before running analysis.',
    };
  }

  const { qualityScore } = evaluateGates(normalized);
  if (qualityScore < 20) {
    blockers.push({
      layer: 'L1',
      code: 'CRITICAL_DATA_QUALITY',
      family_id: null,
      entity_id: null,
      message: `Preflight quality score ${qualityScore}/100 is below critical threshold 20.`,
      remediation: {
        action: 'ENRICH_DATA_QUALITY',
        advice: 'Enrich provenance, variant diversity, and narrator metadata before proceeding.',
      },
    });
  } else if (qualityScore < 50) {
    warnings.push({
      layer: 'L1',
      code: 'DEGRADED_DATA_QUALITY',
      family_id: null,
      entity_id: null,
      message: `Preflight quality score ${qualityScore}/100 is in degraded band (20-49).`,
      remediation: {
        action: 'OBSERVE_QUALITY_WARNING',
        advice: 'Review quality metrics; analysis may proceed but results may reflect sparse evidence.',
      },
    });
  }

  const integrity = AntiHallucinationValidator.fromBatch(normalized).validate().toReport();
  for (const v of (integrity.violations || [])) {
    blockers.push({
      layer: 'L1',
      code: v.code || 'INTEGRITY_VIOLATION',
      family_id: v.family_id || v.detail?.family_id || null,
      entity_id: v.narrator_id || v.evidence_id || v.detail?.narrator_id || v.detail?.evidence_id || null,
      message: v.message,
      remediation: {
        action: 'FIX_INTEGRITY_VIOLATION',
        advice: 'Anti-hallucination sweep blocks on undeclared chain narrators, synthetic IDs, and unverifiable source types.',
      },
    });
  }
  for (const w of (integrity.warnings || [])) {
    warnings.push({
      layer: 'L1',
      code: w.code || 'INTEGRITY_WARNING',
      family_id: w.family_id || w.detail?.family_id || null,
      entity_id: w.narrator_id || w.evidence_id || w.detail?.narrator_id || w.detail?.evidence_id || null,
      message: w.message,
      remediation: {
        action: 'REVIEW_INTEGRITY_WARNING',
        advice: 'Review provenance completeness and verify source citations.',
      },
    });
  }

  const report = CanonicalReport.fromBatch(normalized, { profile, reliabilityLayer });
  const familyIds = report.getFamilyIds();
  const canExport = report.canExport();

  for (const fid of familyIds) {
    const vResult = report.getValidationResult(fid);
    const analysis = report.getAnalysisResult(fid);

    if (analysis?.family_status === 'insufficient_data') {
      warnings.push({
        layer: 'L4',
        code: 'INSUFFICIENT_DATA_FAMILY',
        family_id: fid,
        entity_id: null,
        message: `Family '${fid}' yielded insufficient data (no Common Link candidate detected).`,
        remediation: {
          action: 'VERIFY_CHAIN_ORIENTATION',
          advice: 'Verify that chain arrays run companion -> collector (fan-out must be downstream).',
        },
      });
    }

    if (vResult && !vResult.analysis_can_proceed) {
      for (const viol of (vResult.violations || []).filter(v => v.level === 'blocking')) {
        blockers.push({
          layer: 'L6',
          code: viol.code || 'BLOCKING_EVIDENCE_VIOLATION',
          family_id: fid,
          entity_id: viol.narrator_id || viol.evidence_id || viol.detail?.narrator_id || viol.detail?.evidence_id || null,
          message: viol.message,
          remediation: {
            action: profile === 'reliability_weighted' ? 'ATTACH_NARRATOR_EVIDENCE' : 'INSPECT_EVIDENCE_BINDING',
            advice: profile === 'reliability_weighted'
              ? `Attach valid ReliabilityEvidence to narrator '${viol.narrator_id || viol.detail?.narrator_id || 'target'}' or switch to --profile structural_only.`
              : 'Ensure all referenced evidence IDs exist and have valid provenance.',
          },
        });
      }
    }
  }

  const status = blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'degraded' : 'healthy';

  return {
    diagnostics_version: AGENT_DIAGNOSTICS_VERSION,
    status,
    can_export: canExport,
    primary_blocker: blockers.length > 0 ? blockers[0].code : null,
    summary: {
      blocker_count: blockers.length,
      warning_count: warnings.length,
      family_count: familyIds.length,
      can_export: canExport,
    },
    blockers,
    warnings,
    recommended_next_action: blockers.length > 0
      ? 'Inspect data.blockers[0].remediation.advice and resolve the earliest owning layer.'
      : 'node scripts/riwaq-cli.mjs export <file> --format md',
  };
}
