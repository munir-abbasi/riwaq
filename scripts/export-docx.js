/**
 * scripts/export-docx.js
 *
 * Phase 5 — DOCX Export via python-docx
 *
 * Generates a valid .docx file from a CanonicalReport by:
 *   1. Generating Markdown via export-md.js
 *   2. Parsing Markdown and creating DOCX via python-docx (available in environment)
 *
 * Falls back to raw OOXML generation if python-docx is unavailable.
 * Uses LibreOffice soffice for PDF conversion.
 *
 * Public API:
 *   exportDOCX(canonicalReport, options?) → Promise<Uint8Array>  (raw DOCX bytes)
 *   exportDOCXToBuffer(canonicalReport, options?) → Promise<Buffer>
 *   saveDOCX(canonicalReport, filePath, options?) → Promise<void>
 */
import { writeFileSync, readFileSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { deflateRawSync } from 'zlib';
import { CanonicalReport } from './canonical-report.js';
import { exportMarkdownFromData } from './export-md.js';

const execFileAsync = promisify(execFile);

const DEFAULT_OPTIONS = Object.freeze({
  title: 'Isnad Analysis Report',
  author: 'Academic Crescent Hadith Chain Builder',
  include_chains: false,
  include_graph: false,
  include_evidence_binding: true,
  include_uncertainty: true,
  max_chain_display: 10,
});

export async function exportDOCX(canonicalReport, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const data = canonicalReport.getReportData();
  const md = exportMarkdownFromData(data, opts);

  try {
    return await _buildViaPythonDocx(md, opts, data);
  } catch (_e) {
    return _buildRawOOXML(md, opts, data);
  }
}

export async function exportDOCXToBuffer(canonicalReport, options = {}) {
  return Buffer.from(await exportDOCX(canonicalReport, options));
}

export async function saveDOCX(canonicalReport, filePath, options = {}) {
  const buf = await exportDOCXToBuffer(canonicalReport, options);
  writeFileSync(filePath, buf);
}

async function _buildViaPythonDocx(markdownText, opts, data) {
  const tmp = tmpdir();
  const mdPath = join(tmp, `isnad-${randomUUID()}.md`);
  const pyPath = join(tmp, `mkdocx-${randomUUID()}.py`);
  const docxPath = join(tmp, `isnad-${randomUUID()}.docx`);

  writeFileSync(mdPath, markdownText, 'utf8');

  const title = opts.title || 'Isnad Analysis Report';
  const generatedAt = _formatDate(data?.generated_at);

  const pyScript = `
import sys
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH

def escape(s):
    if s is None: return ''
    return str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')

with open('${mdPath.replace(/'/g, "\\'")}', 'r', encoding='utf-8') as f:
    lines = f.read().split('\\n')

doc = Document()
doc.core_properties.title = '${title.replace(/'/g, "\\'")}'
doc.core_properties.author = '${(opts.author || '').replace(/'/g, "\\'")}'

def add_heading(doc, text, level):
    h = doc.add_heading(text, level=min(level, 9))
    return h

def add_para(doc, text, bold=False, italic=False, style=None):
    p = doc.add_paragraph(style=style)
    if bold:
        run = p.add_run(text)
        run.bold = True
    elif italic:
        run = p.add_run(text)
        run.italic = True
    else:
        p.add_run(text)
    return p

i = 0
while i < len(lines):
    line = lines[i]
    stripped = line.strip()

    if stripped == '' or stripped == '---':
        i += 1
        continue

    if stripped.startswith('# ') and not stripped.startswith('## '):
        add_heading(doc, stripped[2:], 1)
    elif stripped.startswith('## ') and not stripped.startswith('### '):
        add_heading(doc, stripped[3:], 2)
    elif stripped.startswith('### '):
        add_heading(doc, stripped[4:], 3)
    elif stripped.startswith('| '):
        parts = [p.strip() for p in stripped.split('|')[1:-1]]
        table = doc.add_table(rows=1, cols=len(parts))
        table.style = 'Light Grid Accent 1'
        hdr = table.rows[0].cells
        for j, part in enumerate(parts):
            clean = part.replace('**', '').replace('*', '').replace('_', '')
            hdr[j].text = clean
        i += 1
        while i < len(lines) and lines[i].strip().startswith('|'):
            row_data = [p.strip() for p in lines[i].split('|')[1:-1]]
            row = table.add_row().cells
            for j, val in enumerate(row_data):
                clean = val.replace('**', '').replace('*', '').replace('_', '')
                row[j].text = clean
            i += 1
        continue
    elif stripped.startswith('- **') or stripped.startswith('* **'):
        content = stripped[stripped.index('**')+2:]
        bold_part = content.split('**')[0] if '**' in content else content.split(':')[0]
        rest = content[len(bol):] if (bol := bold_part) else content
        add_para(doc, stripped[2:])
    elif stripped.startswith('> '):
        p = doc.add_paragraph(stripped[2:])
        p_format = p.paragraph_format
        p_format.left_indent = Inches(0.5)
        run = p.runs[0] if p.runs else p.add_run(stripped[2:])
        if run:
            run.italic = True
    else:
        parts = stripped.split('**')
        if len(parts) > 1:
            p = doc.add_paragraph()
            for pi, part in enumerate(parts):
                run = p.add_run(part)
                if pi % 2 == 0:
                    run.bold = False
                else:
                    run.bold = True
        else:
            add_para(doc, stripped)

    i += 1

doc.save('${docxPath.replace(/'/g, "\\'")}')
print('OK:${docxPath}')
`.trim();

  writeFileSync(pyPath, pyScript, 'utf8');

  try {
    const { stdout, stderr } = await execFileAsync('python3', [pyPath], {
      cwd: tmp,
      timeout: 15000,
      maxBuffer: 2 * 1024 * 1024,
    });

    if (!stdout.includes('OK:')) {
      throw new Error(`python-docx failed: ${stderr || stdout}`);
    }

    const docxBuf = readFileSync(docxPath);
    return new Uint8Array(docxBuf);
  } finally {
    try { require('fs').unlinkSync(mdPath); } catch {}
    try { require('fs').unlinkSync(pyPath); } catch {}
    try { require('fs').unlinkSync(docxPath); } catch {}
  }
}

function _buildRawOOXML(markdownText, opts, data) {
  const files = [];
  files.push({ name: '[Content_Types].xml', content: _contentTypes() });
  files.push({ name: '_rels/.rels', content: _rootRels() });
  files.push({ name: 'word/_rels/document.xml.rels', content: _documentRels() });
  files.push({ name: 'word/styles.xml', content: _styles() });
  files.push({ name: 'word/document.xml', content: _document(markdownText, opts, data) });

  return _zipFiles(files);
}

function _zipFiles(files) {
  const entries = [];
  for (const file of files) {
    const raw = typeof file.content === 'string'
      ? new TextEncoder().encode(file.content)
      : file.content;
    const deflated = deflateRawSync(Buffer.from(raw));
    entries.push({ name: file.name, raw: Buffer.from(raw), deflated });
  }

  const cdEntries = [];
  let offset = 0;
  for (const entry of entries) {
    const nameBytes = Buffer.from(new TextEncoder().encode(entry.name));
    const cd = _cdEntry(nameBytes, entry.raw.length, entry.deflated.length, offset);
    cdEntries.push(cd);
    offset += 30 + nameBytes.length + entry.deflated.length;
  }

  const totalCdSize = cdEntries.reduce((s, e) => s + e.length, 0);
  const eocdOffset = offset + totalCdSize;
  const eocd = _zipEOCD(entries.length, totalCdSize, eocdOffset);
  const buf = Buffer.alloc(eocdOffset + eocd.length);

  let pos = 0;
  for (const entry of entries) {
    const rawBuf = Buffer.isBuffer(entry.raw) ? entry.raw : Buffer.from(entry.raw);
    const deflatedBuf = Buffer.isBuffer(entry.deflated) ? entry.deflated : Buffer.from(entry.deflated);
    const nameBytes = Buffer.from(new TextEncoder().encode(entry.name));
    const localHeader = Buffer.alloc(30 + nameBytes.length);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt32LE(0, 10);
    localHeader.writeUInt32LE(crc32(rawBuf), 14);
    localHeader.writeUInt32LE(deflatedBuf.length, 18);
    localHeader.writeUInt32LE(rawBuf.length, 22);
    localHeader.writeUInt16LE(nameBytes.length, 26);
    localHeader.writeUInt16LE(0, 28);
    nameBytes.copy(localHeader, 30);
    localHeader.copy(buf, pos);
    pos += 30 + nameBytes.length;
    deflatedBuf.copy(buf, pos);
    pos += deflatedBuf.length;
  }

  for (const cd of cdEntries) {
    cd.copy(buf, pos);
    pos += cd.length;
  }
  eocd.copy(buf, pos);

  return new Uint8Array(buf);
}

function _cdEntry(nameBytes, rawLen, deflatedLen, offset) {
  const cd = Buffer.alloc(46 + nameBytes.length);
  cd.writeUInt32LE(0x02014b50, 0);
  cd.writeUInt16LE(20, 4);
  cd.writeUInt16LE(20, 6);
  cd.writeUInt16LE(0, 8);
  cd.writeUInt16LE(0, 10);
  cd.writeUInt32LE(0, 12);
  cd.writeUInt32LE(crc32(nameBytes), 16);
  cd.writeUInt32LE(deflatedLen, 20);
  cd.writeUInt32LE(rawLen, 24);
  cd.writeUInt16LE(nameBytes.length, 28);
  cd.writeUInt16LE(0, 30);
  cd.writeUInt16LE(0, 32);
  cd.writeUInt16LE(0, 34);
  cd.writeUInt32LE(0, 36);
  cd.writeUInt32LE(offset, 40);
  nameBytes.copy(cd, 46);
  return cd;
}

function _zipEOCD(numEntries, cdSize, cdOffset) {
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(numEntries, 8);
  eocd.writeUInt16LE(numEntries, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);
  return eocd;
}

function crc32(buf) {
  const table = _crc32Table();
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc = (crc >>> 8) ^ table[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

let _crcTable = null;
function _crc32Table() {
  if (_crcTable) return _crcTable;
  _crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    _crcTable[i] = c >>> 0;
  }
  return _crcTable;
}

function _contentTypes() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function _rootRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
}

function _documentRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`;
}

function _styles() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:styleId="Normal" w:default="1">
    <w:name w:val="Normal"/>
    <w:pPr><w:spacing w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial"/><w:sz w:val="22"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="Heading 1"/>
    <w:pPr><w:spacing w:before="360" w:after="120"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:b="1"/><w:sz w:val="32"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="Heading 2"/>
    <w:pPr><w:spacing w:before="240" w:after="80"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:b="1"/><w:sz w:val="26"/></w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="Heading 3"/>
    <w:pPr><w:spacing w:before="160" w:after="60"/></w:pPr>
    <w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:b="1"/><w:sz w:val="24"/></w:rPr>
  </w:style>
</w:styles>`;
}

function _document(markdownText, opts, data) {
  const title = _escapeXml(opts.title || 'Isnad Analysis Report');
  const author = _escapeXml(opts.author || '');
  const generatedAt = _formatDate(data?.generated_at);
  const bodyXml = _markdownToDocxParagraphs(markdownText);

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:pPr><w:pStyle w:val="Heading1"/><w:jc w:val="center"/></w:pPr>
      <w:r><w:rPr><w:b/></w:rPr><w:t>${title}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t xml:space="preserve">Generated: ${_escapeXml(generatedAt)}</w:t></w:r>
    </w:p>
    <w:p><w:pPr><w:jc w:val="center"/></w:pPr>
      <w:r><w:t xml:space="preserve">Author: ${author}</w:t></w:r>
    </w:p>
${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

function _markdownToDocxParagraphs(md) {
  const lines = md.split('\n');
  const paras = [];
  let inCode = false;
  for (const line of lines) {
    if (line.startsWith('```')) { inCode = !inCode; continue; }
    if (line.trim() === '' || line.trim() === '---') continue;
    if (inCode) { paras.push(_codeParagraph(line)); continue; }
    if (line.startsWith('# ')) paras.push(_heading(line.slice(2), 1));
    else if (line.startsWith('## ')) paras.push(_heading(line.slice(3), 2));
    else if (line.startsWith('### ')) paras.push(_heading(line.slice(4), 3));
    else if (line.startsWith('| ')) paras.push(_tableRow(line));
    else if (line.startsWith('- **') || line.startsWith('* **') || line.startsWith('- _')) paras.push(_listItem(line));
    else if (line.startsWith('> ')) paras.push(_blockquote(line.slice(2)));
    else paras.push(_paragraph(line));
  }
  return paras.join('\n');
}

function _paragraph(text) {
  const runs = _parseInlineRuns(text);
  if (runs.length === 0) return '';
  const runXml = runs.map(r => {
    if (r.bold) return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    if (r.italic) return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    return `<w:r><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
  }).join('');
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr>${runXml}</w:p>`;
}

function _heading(text, level) {
  const style = `Heading${level}`;
  const runs = _parseInlineRuns(text);
  const runXml = runs.map(r => {
    if (r.bold) return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    if (r.italic) return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    return `<w:r><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
  }).join('');
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/></w:pPr>${runXml}</w:p>`;
}

function _listItem(line) {
  const text = line.replace(/^[-*]\s*/, '').replace(/^\s+/, '');
  const runs = _parseInlineRuns(text);
  const runXml = runs.map(r => {
    if (r.bold) return `<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    if (r.italic) return `<w:r><w:rPr><w:i/></w:rPr><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
    return `<w:r><w:t xml:space="preserve">${_escapeXml(r.text)}</w:t></w:r>`;
  }).join('');
  return `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr></w:pPr>${runXml}</w:p>`;
}

function _codeParagraph(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/></w:pPr><w:r><w:rPr><w:color w:val="6A6A6A"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">${_escapeXml(text)}</w:t></w:r></w:p>`;
}

function _blockquote(text) {
  return `<w:p><w:pPr><w:pStyle w:val="Normal"/><w:ind w:left="720"/></w:pPr><w:r><w:rPr><w:i/><w:color w:val="555555"/></w:rPr><w:t xml:space="preserve">${_escapeXml(text)}</w:t></w:r></w:p>`;
}

function _tableRow(line) {
  const cells = line.split('|').filter((_, i, a) => i > 0 && i < a.length - 1);
  const cellXml = cells.map(c => {
    const text = c.trim().replace(/\*\*/g, '').replace(/\*/g, '').replace(/_/g, '');
    return `<w:tc><w:p><w:r><w:t xml:space="preserve">${_escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
  }).join('');
  return `<w:p><w:tbl><w:tr>${cellXml}</w:tr></w:tbl></w:p>`;
}

function _parseInlineRuns(text) {
  const runs = [];
  let remaining = text;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/^\*\*(.+?)\*\*/);
    const italicMatch = remaining.match(/^_(.+?)_/);
    if (boldMatch) {
      runs.push({ text: boldMatch[1], bold: true, italic: false });
      remaining = remaining.slice(boldMatch[0].length);
    } else if (italicMatch) {
      runs.push({ text: italicMatch[1], bold: false, italic: true });
      remaining = remaining.slice(italicMatch[0].length);
    } else {
      const next = remaining.search(/\*\*|_[^*]/);
      if (next < 0) { runs.push({ text: remaining, bold: false, italic: false }); remaining = ''; }
      else if (next === 0) { runs.push({ text: remaining[0], bold: false, italic: false }); remaining = remaining.slice(1); }
      else { runs.push({ text: remaining.slice(0, next), bold: false, italic: false }); remaining = remaining.slice(next); }
    }
  }
  return runs;
}

function _escapeXml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function _formatDate(iso) {
  if (!iso) return 'unknown';
  try { return new Date(iso).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' }); }
  catch { return iso; }
}

