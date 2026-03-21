/**
 * scripts/import-errors.js
 *
 * Structured error emitter for JSON import validation.
 * Errors use JSON Pointer (RFC 6901) instance paths and item indices.
 *
 * Error codes:
 *   SCHEMA_VIOLATION  — JSON Schema validation failed
 *   MISSING_REQUIRED  — Required field absent
 *   INVALID_TYPE      — Field has wrong type
 *   INVALID_ENUM      — Value not in allowed enum
 *   INVALID_FORMAT    — Value doesn't match format (e.g., date-time)
 *   INVALID_PATTERN   — String doesn't match regex pattern
 *   OUT_OF_RANGE     — Number outside min/max bounds
 *   EMPTY_ARRAY      — Array must have at least one item
 *   DUPLICATE_ID     — Stable ID already used within same family
 *   UNRESOLVED_REF   — Narrator ID referenced but not defined
 *   MALFORMED_JSON   — Input is not valid JSON
 *   SCHEMA_VERSION   — Unknown or unsupported schema_version
 *
 * Severity levels:
 *   error    — Blocking; import fails
 *   warning  — Non-blocking; import proceeds with degraded data quality
 */
export const SEVERITY = Object.freeze({ ERROR: 'error', WARNING: 'warning' });
export const ERROR_CODE = Object.freeze({
  SCHEMA_VIOLATION: 'SCHEMA_VIOLATION',
  MISSING_REQUIRED: 'MISSING_REQUIRED',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_ENUM: 'INVALID_ENUM',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_PATTERN: 'INVALID_PATTERN',
  OUT_OF_RANGE: 'OUT_OF_RANGE',
  EMPTY_ARRAY: 'EMPTY_ARRAY',
  DUPLICATE_ID: 'DUPLICATE_ID',
  UNRESOLVED_REF: 'UNRESOLVED_REF',
  MALFORMED_JSON: 'MALFORMED_JSON',
  SCHEMA_VERSION: 'SCHEMA_VERSION',
});

function formatPath(path) {
  if (!path || path.length === 0) return '/';
  return '/' + path.map(p => String(p).includes('/') ? p.replace(/~/g, '~0').replace(/\//g, '~1') : p).join('/');
}

export class ImportError extends Error {
  /** @param {{ severity: string, code: string, message: string, instance_path: string, item_index: number|null, field?: string|null }} opts */
  constructor({ severity, code, message, instance_path, item_index, field = null }) {
    super(message);
    this.name = 'ImportError';
    this.severity = severity;
    this.code = code;
    this.instance_path = instance_path;
    this.item_index = item_index;
    this.field = field;
  }

  toJSON() {
    return {
      severity: this.severity,
      code: this.code,
      message: this.message,
      instance_path: this.instance_path,
      item_index: this.item_index,
      field: this.field,
    };
  }
}

export class ImportErrorCollector {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Add an error or warning.
   * @param {string} severity
   * @param {string} code
   * @param {string} message
   * @param {string[]} path - JSON Pointer path segments
   * @param {number|null} itemIndex - 0-based record index, or null for batch-level
   */
  add(severity, code, message, path = [], itemIndex = null) {
    const err = new ImportError({
      severity,
      code,
      message,
      instance_path: formatPath(path),
      item_index: itemIndex,
    });
    if (severity === SEVERITY.ERROR) {
      this.errors.push(err);
    } else {
      this.warnings.push(err);
    }
    return err;
  }

  error(code, message, path = [], itemIndex = null) {
    return this.add(SEVERITY.ERROR, code, message, path, itemIndex);
  }

  warn(code, message, path = [], itemIndex = null) {
    return this.add(SEVERITY.WARNING, code, message, path, itemIndex);
  }

  get errorCount() { return this.errors.length; }
  get warningCount() { return this.warnings.length; }
  get hasErrors() { return this.errorCount > 0; }
  get hasWarnings() { return this.warningCount > 0; }

  toReport() {
    return {
      errors: this.errors.map(e => e.toJSON()),
      warnings: this.warnings.map(e => e.toJSON()),
      summary: {
        error_count: this.errorCount,
        warning_count: this.warningCount,
      },
    };
  }
}
