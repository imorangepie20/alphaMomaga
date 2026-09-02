# Core Principles for This Project

This document is the mandatory reminder for all work on this project.

## 1. Record every change in documentation

- Every meaningful change must be captured in a relevant document under the docs folder.
- Any action that affects architecture, workflow, decisions, or implementation should be documented for the next session.
- If a fix is made, write down what broke, why it broke, and what was changed.
- Use structured docs, not loose notes scattered across the repo.

## 2. Do not postpone the task that must be done now

- If a task is required to keep progress correct, do it immediately.
- Do not defer essential work for later “when time allows.”
- Deferred critical work usually creates larger problems and rework.

## 3. Maintain a documented project understanding flow

- Before touching code, identify the relevant documentation first.
- The reading order should be:
  1. project overview / goals
  2. architecture and domain model
  3. business logic and workflows
  4. current implementation status
  5. relevant feature docs or bug notes
  6. implementation files directly related to the task
- This prevents blind code changes and unnecessary exploration.

## 4. Keep all documentation inside the docs folder

- Documentation must live under docs with a clear structure.
- Avoid ad hoc notes outside the docs folder.
- Use a predictable organization such as:
  - docs/overview/
  - docs/architecture/
  - docs/business-logic/
  - docs/decisions/
  - docs/changes/
  - docs/project-rules/

## 5. Fix root causes, not symptoms

- When something breaks, trace to the underlying cause.
- Do not patch around symptoms when the true cause is still unresolved.
- Time spent validating the root cause is always cheaper than repeated quick fixes.

## 6. Map business logic relationships before changing behavior

- For each major business area, maintain a relationship map.
- Examples: property -> tenant -> contract -> payment -> maintenance.
- Understand how entities connect before adding features or making changes.
- This prevents accidental breakage of the whole workflow.

## 7. Work steadily and verify each step

- Do not rush for speed alone.
- Solve one issue at a time and confirm it is correct before continuing.
- Incremental proof is more reliable than fast but fragile progress.

## 8. Always keep the end-to-end flow in view

- Do not get trapped in a local optimization or a single component detail.
- Think in terms of the overall user workflow and business process.
- Components, data, and logic should support the whole system, not isolated fragments.

## Required reminder cadence

- Review this file at the start of each session.
- Re-check before starting a non-trivial change.
- Update docs when a milestone is reached or a problem is resolved.

This is a project rule, not an optional preference.
