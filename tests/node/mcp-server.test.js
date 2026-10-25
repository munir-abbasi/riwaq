import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RiwaqMcpServer, MCP_TOOLS } from '../../scripts/riwaq-mcp.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MockStream {
  constructor() {
    this.lines = [];
  }
  write(chunk) {
    this.lines.push(chunk.trim());
  }
  getLastResponse() {
    if (this.lines.length === 0) return null;
    return JSON.parse(this.lines[this.lines.length - 1]);
  }
}

describe('Milestone 3 — Native Model Context Protocol (MCP) Server', () => {
  const sampleBatchPath = path.join(__dirname, '../../docs/examples/sample-import.json');

  it('performs standard MCP initialize handshake', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2024-11-05', clientInfo: { name: 'test-agent' } },
    }));

    const res = mockOut.getLastResponse();
    expect(res.id).toBe(1);
    expect(res.result.serverInfo.name).toBe('riwaq-mcp');
    expect(res.result.capabilities.tools).toBeDefined();
  });

  it('lists all 7 native Riwaq MCP tools', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    }));

    const res = mockOut.getLastResponse();
    expect(res.id).toBe(2);
    expect(res.result.tools.length).toBe(7);
    const names = res.result.tools.map(t => t.name);
    expect(names).toContain('riwaq_diagnose');
    expect(names).toContain('riwaq_validate');
    expect(names).toContain('riwaq_analyze');
    expect(names).toContain('riwaq_stage_proposal');
    expect(names).toContain('riwaq_commit_proposal');
    expect(names).toContain('riwaq_export');
  });

  it('calls riwaq_diagnose tool over MCP and returns diagnostic packet', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'riwaq_diagnose',
        arguments: { filePath: sampleBatchPath },
      },
    }));

    const res = mockOut.getLastResponse();
    expect(res.id).toBe(3);
    expect(res.result.isError).toBe(false);
    const content = JSON.parse(res.result.content[0].text);
    expect(content.diagnostics.status).toBe('degraded');
    expect(content.diagnostics.can_export).toBe(true);
  });

  it('stages and commits a proposal over MCP tool calls and mints verifiable receipt', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    // Step 1: Stage merge
    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'riwaq_stage_proposal',
        arguments: {
          filePath: sampleBatchPath,
          type: 'PROPOSAL_NARRATOR_MERGE',
          payload: { sourceId: 'aymen-unknown', targetId: 'hisham-ibn-urwah' },
          rationale: 'Autonomous agent resolution via MCP',
          modelMetadata: { model: 'claude-3-5-sonnet', prompt_id: 'mcp-agent-01' },
        },
      },
    }));

    const stageRes = mockOut.getLastResponse();
    expect(stageRes.result.isError).toBe(false);
    const stageContent = JSON.parse(stageRes.result.content[0].text);
    const proposalId = stageContent.proposal.proposal_id;
    expect(proposalId).toBeDefined();

    // Step 2: Commit proposal
    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'riwaq_commit_proposal',
        arguments: {
          filePath: sampleBatchPath,
          proposalId,
          reviewerId: 'reviewer_mcp_qa',
          notes: 'Signed off via MCP integration test',
        },
      },
    }));

    const commitRes = mockOut.getLastResponse();
    expect(commitRes.result.isError).toBe(false);
    const commitContent = JSON.parse(commitRes.result.content[0].text);
    expect(commitContent.receipt.receipt_id).toBeDefined();
    expect(commitContent.receipt.reviewer.reviewer_id).toBe('reviewer_mcp_qa');

    // Save repeatable verifiable transcript artifact
    const transcriptPath = path.join(__dirname, '../fixtures/e2e/m3-mcp-session-transcript.jsonl');
    const lines = mockOut.lines.join('\n');
    fs.writeFileSync(transcriptPath, lines, 'utf8');
    expect(fs.existsSync(transcriptPath)).toBe(true);
  });

  it('failure mode 1: returns standard JSON-RPC parse error on malformed input', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    await server.handleMessage('{"jsonrpc": "2.0", unclosed json');
    const res = mockOut.getLastResponse();
    expect(res.error.code).toBe(-32700);
    expect(res.error.message).toContain('Parse error');
  });

  it('failure mode 2: returns isError: true when calling unknown tool', async () => {
    const mockOut = new MockStream();
    const server = new RiwaqMcpServer({ outStream: mockOut });

    await server.handleMessage(JSON.stringify({
      jsonrpc: '2.0',
      id: 99,
      method: 'tools/call',
      params: { name: 'nonexistent_tool', arguments: {} },
    }));

    const res = mockOut.getLastResponse();
    expect(res.id).toBe(99);
    expect(res.result.isError).toBe(true);
    const content = JSON.parse(res.result.content[0].text);
    expect(content.error).toContain('Unknown tool');
  });
});
