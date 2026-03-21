/**
 * scripts/export-pdf.js
 *
 * Phase 5 — PDF Export via LibreOffice
 *
 * Converts a CanonicalReport to PDF by:
 *   1. Generating Markdown via export-md.js
 *   2. Converting to DOCX via export-docx.js
 *   3. Converting to PDF via LibreOffice (soffice --headless --convert-to pdf)
 *
 * The DOCX intermediate ensures consistent formatting across MD→PDF.
 *
 * Public API:
 *   exportPDF(canonicalReport, options?) → Promise<Uint8Array>  (raw PDF bytes)
 *   exportPDFToFile(canonicalReport, filePath, options?) → Promise<void>
 *   exportPDFViaMarkdown(markdownText, outputPath) → Promise<void>
 */
import { writeFileSync, unlinkSync, existsSync } from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { exportDOCX } from './export-docx.js';
import { exportMarkdown } from './export-md.js';
import { CanonicalReport } from './canonical-report.js';

const execFileAsync = promisify(execFile);

export async function exportPDF(canonicalReport, options = {}) {
  const tempDir = tmpdir();
  const docxPath = join(tempDir, `isnad-export-${randomUUID()}.docx`);
  const pdfPath = join(tempDir, `isnad-export-${randomUUID()}.pdf`);

  try {
    const docxBytes = await exportDOCX(canonicalReport, options);
    writeFileSync(docxPath, Buffer.from(docxBytes));

    await _convertToPDF(docxPath, pdfPath);

    const { readFileSync } = await import('fs');
    const pdfBytes = readFileSync(pdfPath);
    return new Uint8Array(pdfBytes);
  } finally {
    _safeUnlink(docxPath);
    _safeUnlink(pdfPath);
  }
}

export async function exportPDFToFile(canonicalReport, pdfPath, options = {}) {
  const pdfBytes = await exportPDF(canonicalReport, options);
  writeFileSync(pdfPath, Buffer.from(pdfBytes));
}

export async function exportPDFViaMarkdown(markdownText, outputPath) {
  const tempDir = tmpdir();
  const docxPath = join(tempDir, `isnad-md-${randomUUID()}.docx`);
  const tmpPdfPath = join(tempDir, `isnad-md-${randomUUID()}.pdf`);

  try {
    const docxBytes = await _markdownToMinimalDOCX(markdownText);
    writeFileSync(docxPath, Buffer.from(docxBytes));
    await _convertToPDF(docxPath, tmpPdfPath);
    const { readFileSync } = await import('fs');
    const pdfBytes = readFileSync(tmpPdfPath);
    writeFileSync(outputPath, Buffer.from(pdfBytes));
  } finally {
    _safeUnlink(docxPath);
    _safeUnlink(tmpPdfPath);
  }
}

async function _convertToPDF(docxPath, pdfPath) {
  const libreOfficePath = _findLibreOffice();
  const args = [
    '--headless',
    '--convert-to', 'pdf',
    '--outdir', tmpdir(),
    docxPath,
  ];

  const { stdout, stderr } = await execFileAsync(libreOfficePath, args, {
    timeout: 30000,
    maxBuffer: 10 * 1024 * 1024,
  });

  const expectedPdf = docxPath.replace(/\.docx$/, '.pdf');
  if (!existsSync(expectedPdf) && !existsSync(pdfPath)) {
    throw new Error(`LibreOffice PDF conversion failed. stdout: ${stdout}, stderr: ${stderr}`);
  }

  if (existsSync(expectedPdf) && !existsSync(pdfPath)) {
    const { renameSync } = await import('fs');
    renameSync(expectedPdf, pdfPath);
  }
}

async function _markdownToMinimalDOCX(markdownText) {
  const { _buildDOCX } = await import('./export-docx.js');
  return _buildDOCX(markdownText, { title: 'Isnad Analysis Report' }, {});
}

function _findLibreOffice() {
  const candidates = ['/usr/bin/soffice', '/usr/bin/libreoffice', 'soffice', 'libreoffice'];
  for (const c of candidates) {
    try {
      const { execFileSync } = require('child_process');
      execFileSync(c, ['--version'], { stdio: 'ignore' });
      return c;
    } catch {
      // not found, try next
    }
  }
  return 'soffice';
}

function _safeUnlink(path) {
  try {
    if (existsSync(path)) unlinkSync(path);
  } catch {
    // ignore cleanup errors
  }
}
