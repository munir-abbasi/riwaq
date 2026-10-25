#!/usr/bin/env node
/**
 * scripts/riwaq-mcp.mjs
 *
 * Model Context Protocol (MCP) Stdio Server for Riwaq (D025)
 *
 * Exposes Riwaq's analytical and agent-control capabilities over JSON-RPC 2.0 stdio
 * transport, enabling autonomous agents (Claude, Gemini, Cursor, Antigravity) to
 * inspect, diagnose, and drive isnad-cum-matn analysis as first-class tool calls.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { getCapabilityManifest, buildAgentDiagnostics, buildAgentStateSnapshot } from './agent-control.js';
import { validateBatch } from './json-validator.js';
import { AntiHallucinationValidator } from './anti-hallucination.js';
import { CanonicalReport } from './canonical-report.js';
import { exportMarkdown } from './export-md.js';
import { ProposalStore, PROPOSAL_TYPE } from './proposal-store.js';

export const MCP_SERVER_INFO = Object.freeze({
  name: 'riwaq-mcp',
  version: '1.2.0',
  protocolVersion: '2024-11-05',
});

export const MCP_TOOLS = Object.freeze([
  {
    name: 'riwaq_manifest',
    description: 'Inspect machine-readable capability/contract manifest across the Riwaq Abstraction Tower (L0-L9)',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'riwaq_diagnose',
    description: 'Automated cross-layer diagnosis evaluating health across L1-L8 and emitting actionable remediation packets',
    inputSchema: {
      type: 'object',
      required: ['filePath'],
      properties: {
        filePath: { type: 'string', description: 'Path to canonical or imported JSON batch' },
        profile: { type: 'string', enum: ['structural_only', 'reliability_weighted'], default: 'structural_only' },
        withReliability: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'riwaq_validate',
    description: 'Validate batch schema structure, provenance fields, and strict anti-hallucination invariants',
    inputSchema: {
      type: 'object',
      required: ['filePath'],
      properties: {
        filePath: { type: 'string', description: 'Path to batch JSON file' },
      },
    },
  },
  {
    name: 'riwaq_analyze',
    description: 'Run CL/PCL topological analysis over hadith families in a batch',
    inputSchema: {
      type: 'object',
      required: ['filePath'],
      properties: {
        filePath: { type: 'string', description: 'Path to validated batch JSON' },
        profile: { type: 'string', enum: ['structural_only', 'reliability_weighted'], default: 'structural_only' },
        withReliability: { type: 'boolean', default: false },
      },
    },
  },
  {
    name: 'riwaq_stage_proposal',
    description: 'Stage an AI extraction proposal (narrator merge, split, or matn segmentation) into the staging buffer',
    inputSchema: {
      type: 'object',
      required: ['filePath', 'type', 'payload'],
      properties: {
        filePath: { type: 'string', description: 'Target batch JSON file' },
        type: { type: 'string', enum: ['PROPOSAL_NARRATOR_MERGE', 'PROPOSAL_NARRATOR_SPLIT', 'PROPOSAL_MATN_SEGMENTATION'] },
        payload: { type: 'object', description: 'Proposal parameters (sourceId, targetId, segments, etc.)' },
        rationale: { type: 'string', description: 'Scholarly reasoning or prompt attribution' },
        modelMetadata: { type: 'object', description: 'Model identifier, prompt ID, and confidence' },
      },
    },
  },
  {
    name: 'riwaq_commit_proposal',
    description: 'Commit an approved proposal from staging into canonical batch state and mint an immutable receipt',
    inputSchema: {
      type: 'object',
      required: ['filePath', 'proposalId'],
      properties: {
        filePath: { type: 'string', description: 'Batch file to commit proposal into' },
        proposalId: { type: 'string', description: 'Proposal identifier returned by riwaq_stage_proposal' },
        reviewerId: { type: 'string', description: 'Identifier of the reviewing researcher' },
        notes: { type: 'string', description: 'Review sign-off comments' },
      },
    },
  },
  {
    name: 'riwaq_export',
    description: 'Generate publishable Markdown projection from canonical analysis (gated by canExport)',
    inputSchema: {
      type: 'object',
      required: ['filePath'],
      properties: {
        filePath: { type: 'string', description: 'Validated batch JSON' },
        profile: { type: 'string', enum: ['structural_only', 'reliability_weighted'], default: 'structural_only' },
      },
    },
  },
]);

// Memory store for active proposal stores by file path
const activeStores = new Map();

function getStoreForFile(resolvedPath) {
  if (!activeStores.has(resolvedPath)) {
    const raw = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const { normalized } = validateBatch(raw);
    activeStores.set(resolvedPath, ProposalStore.fromBatch(normalized || raw));
  }
  return activeStores.get(resolvedPath);
}

export class RiwaqMcpServer {
  constructor(options = {}) {
    this._outStream = options.outStream || process.stdout;
  }

  sendResponse(id, result) {
    const response = {
      jsonrpc: '2.0',
      id,
      result,
    };
    this._outStream.write(`${JSON.stringify(response)}\n`);
  }

  sendError(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id ?? null,
      error: { code, message, ...(data ? { data } : {}) },
    };
    this._outStream.write(`${JSON.stringify(response)}\n`);
  }

  async executeTool(name, args) {
    switch (name) {
      case 'riwaq_manifest': {
        const manifest = getCapabilityManifest();
        return { manifest };
      }

      case 'riwaq_diagnose': {
        const fullPath = path.resolve(args.filePath);
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const { collector, normalized } = validateBatch(raw);
        const diag = buildAgentDiagnostics({
          normalized,
          collector,
          profile: args.profile || 'structural_only',
        });
        return { diagnostics: diag };
      }

      case 'riwaq_validate': {
        const fullPath = path.resolve(args.filePath);
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const { valid, collector, normalized } = validateBatch(raw);
        let ahReport = null;
        if (normalized) {
          ahReport = AntiHallucinationValidator.fromBatch(normalized).validate().toReport();
        }
        return {
          schema_validation: { valid, errors: collector.errors, warnings: collector.warnings },
          anti_hallucination: ahReport,
          can_proceed: valid && (ahReport ? ahReport.can_proceed : false),
        };
      }

      case 'riwaq_analyze': {
        const fullPath = path.resolve(args.filePath);
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const { normalized } = validateBatch(raw);
        if (!normalized) throw new Error('Cannot analyze invalid batch');
        const report = CanonicalReport.fromBatch(normalized, { profile: args.profile || 'structural_only' });
        const data = report.getReportData();
        return {
          can_export: report.canExport(),
          family_count: data.families.length,
          families: data.families.map(f => ({
            family_id: f.family_id,
            status: f.analysis.family_status,
            candidates: f.candidates,
          })),
        };
      }

      case 'riwaq_stage_proposal': {
        const fullPath = path.resolve(args.filePath);
        const store = getStoreForFile(fullPath);
        let prop = null;
        if (args.type === PROPOSAL_TYPE.NARRATOR_MERGE) {
          prop = store.stageMerge({
            sourceId: args.payload.sourceId,
            targetId: args.payload.targetId,
            rationale: args.rationale,
            modelMetadata: args.modelMetadata,
          });
        } else if (args.type === PROPOSAL_TYPE.NARRATOR_SPLIT) {
          prop = store.stageSplit({
            sourceId: args.payload.sourceId,
            targetA: args.payload.targetA,
            targetB: args.payload.targetB,
            evidenceForA: args.payload.evidenceForA,
            evidenceForB: args.payload.evidenceForB,
            rationale: args.rationale,
            modelMetadata: args.modelMetadata,
          });
        } else if (args.type === PROPOSAL_TYPE.MATN_SEGMENTATION) {
          prop = store.stageMatnSegmentation({
            variantId: args.payload.variantId,
            segments: args.payload.segments,
            rationale: args.rationale,
            modelMetadata: args.modelMetadata,
          });
        } else {
          throw new Error(`Unsupported proposal type: ${args.type}`);
        }
        return { proposal: prop };
      }

      case 'riwaq_commit_proposal': {
        const fullPath = path.resolve(args.filePath);
        const store = getStoreForFile(fullPath);
        const receipt = store.commitProposal(args.proposalId, {
          reviewer_id: args.reviewerId,
          notes: args.notes,
        });
        return { receipt, proposal: store.getProposal(args.proposalId) };
      }

      case 'riwaq_export': {
        const fullPath = path.resolve(args.filePath);
        const raw = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const { normalized } = validateBatch(raw);
        const report = CanonicalReport.fromBatch(normalized, { profile: args.profile || 'structural_only' });
        if (!report.canExport()) {
          throw new Error('Publication gate closed: report.canExport() is false');
        }
        const md = exportMarkdown(report);
        return { markdown: md };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  async handleMessage(rawLine) {
    if (!rawLine || rawLine.trim() === '') return;
    let msg;
    try {
      msg = JSON.parse(rawLine);
    } catch {
      this.sendError(null, -32700, 'Parse error: Invalid JSON');
      return;
    }

    const { id, method, params } = msg;

    try {
      switch (method) {
        case 'initialize': {
          this.sendResponse(id, {
            protocolVersion: MCP_SERVER_INFO.protocolVersion,
            capabilities: { tools: {} },
            serverInfo: { name: MCP_SERVER_INFO.name, version: MCP_SERVER_INFO.version },
          });
          break;
        }

        case 'notifications/initialized': {
          // No response for notifications per JSON-RPC / MCP specs
          break;
        }

        case 'tools/list': {
          this.sendResponse(id, { tools: MCP_TOOLS });
          break;
        }

        case 'tools/call': {
          if (!params || !params.name) {
            this.sendError(id, -32602, 'Invalid params: missing tool name');
            return;
          }
          const toolResult = await this.executeTool(params.name, params.arguments || {});
          this.sendResponse(id, {
            content: [
              {
                type: 'text',
                text: JSON.stringify(toolResult, null, 2),
              },
            ],
            isError: false,
          });
          break;
        }

        default: {
          if (id !== undefined) {
            this.sendError(id, -32601, `Method not found: ${method}`);
          }
        }
      }
    } catch (err) {
      if (id !== undefined) {
        this.sendResponse(id, {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: err.message, stack: err.stack }),
            },
          ],
          isError: true,
        });
      }
    }
  }

  listen() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
    rl.on('line', line => this.handleMessage(line));
  }
}

// Run CLI if invoked directly
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const server = new RiwaqMcpServer();
  server.listen();
}
import { fileURLToPath } from 'node:url';
