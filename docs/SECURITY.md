# Security Notes

## Threat Model (Current Scope)

This project is a static client-side app with no backend authentication, session management, or server-side data store.

Primary risks are:
- Client-side input handling and XSS safety
- Browser storage robustness
- Deployment artifact exposure
- Build/deploy supply-chain hygiene

## Controls in Place

### Output Escaping
- User-provided values rendered via `innerHTML` are escaped through `escapeHtml(...)`.
- Escaper now safely handles non-string values to reduce runtime crash risk from malformed data.

### State Validation
- `localStorage` payload is sanitized during load.
- Malformed narrator records are dropped.
- Date fields are revalidated before age data is trusted.

### Date Integrity
- Gregorian/Hijri month-length validation rejects impossible dates.

### UI Resilience
- Matn diff has size guards to prevent expensive matrix allocation on oversized text.

### CI/CD Hardening
- Pages workflow deploys only `./academic`.
- Actions are pinned to exact commit SHAs.

## Residual Risks

- Data remains browser-local and can be modified by any script in the same origin context.
- Very large but below-threshold matn inputs can still be computationally heavy on low-power devices.
- Duplicate app copies (`index.html` and `academic/index.html`) can drift if not managed carefully.

## Planned Analytical Safety Controls (Roadmap)

For the planned CL/PCL analytics layer in `to-do.md`, the following controls are required:

- Claim-evidence binding: analytical conclusions must link to evidence/provenance records.
- Unsupported-claim handling: unresolved outputs must remain `uncertain`/`unverified_claim`, not factual.
- Contradiction cap: unresolved contradictory evidence limits confidence to `0.70` and outcome to `contested`.
- Explicit analysis state: if analytics is not executed, outputs should record `analysis_not_run`.

These controls are documented design requirements for upcoming phases and should be treated as release gates once analytics is implemented.

## Recommended Ongoing Practices

- Keep dependency-like workflow references pinned and periodically refreshed.
- Add browser smoke tests for critical user flows before release.
- Keep local and deployment HTML copies synchronized in each change set.
- Avoid committing unrelated artifacts to the deploy directory.
