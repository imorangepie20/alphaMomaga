# Copilot Instructions

## Core operating principles

- Prefer simple, readable, maintainable code over clever or overly abstract code.
- Optimize for correctness and clarity first; performance only when there is evidence of a bottleneck.
- Solve the actual user problem directly; do not add speculative features or broad refactors without need.
- Make the smallest change that addresses the root cause.
- When unsure, state assumptions briefly and proceed with the least risky option.

## Development style

- Write code that is easy for a teammate to understand in 10 minutes.
- Favor explicit names, small functions, and shallow abstractions.
- Keep modules focused on one responsibility.
- Avoid unnecessary dependencies, frameworks, or layers unless they are clearly justified.
- Do not over-engineer solutions for tiny problems.

## Engineering process

- Start by understanding the end-user behavior and the failing scenario.
- Break large tasks into small, testable steps.
- Validate one hypothesis at a time before expanding scope.
- Prefer existing project conventions over inventing a new pattern.
- If a change touches behavior, also check for nearby code paths that may be affected.

## Testing and verification

- Prefer real behavior tests over mock-heavy tests.
- Write a failing test or minimal repro before implementing a bug fix.
- Keep tests focused on the behavior being changed.
- Validate with the smallest relevant command, not a broad suite unless required.
- Do not claim the fix is complete without fresh verification output.

## Code quality standards

- Avoid dead code, unused variables, and unreachable branches.
- Handle edge cases explicitly and predictably.
- Keep error messages actionable and user-friendly.
- Use type safety and validation where the project supports it.
- Keep comments for intent, not for restating obvious code.

## Refactoring guidance

- Refactor only when it clarifies the code or removes a real maintenance burden.
- Do not mix refactoring and feature work in the same patch unless absolutely necessary.
- Preserve public behavior unless the task explicitly requires a change.

## Communication

- Be brief and direct.
- Explain trade-offs when there are multiple valid approaches.
- Call out risk, uncertainty, or missing requirements early.
- When the user asks for a fix, focus on the root cause and the exact change needed.

## Karpathy-inspired mindset

- Build useful things, not abstract perfection.
- Ship small, working systems and iterate quickly.
- Make the code feel like it was written by a careful engineer, not by a framework generator.
- Favor working software that is easy to reason about over impressive complexity.

## Project-specific guidance: real estate management app

- Treat this as a real business application, not a demo app. Prioritize correctness, data integrity, and operational usability.
- Model the core domains explicitly: properties, tenants, contracts, payments, maintenance, users, and admin operations.
- Prefer strong validation for rental data: rent amounts, lease dates, payment status, overdue conditions, and contract validity.
- Enforce authorization on the server side. Admin, manager, and viewer roles must be treated as different trust levels.
- Keep dashboard views optimized for business decisions: occupancy, monthly revenue, overdue payments, maintenance backlog, and renewal risk.
- Design forms and tables around actual property management workflows, not generic CRUD screens.
- When a feature touches financial or legal information, prefer explicit status handling and safe defaults over clever shortcuts.
- Make search, filters, and table sorting practical for managers working with many properties and tenants.
- Maintain clear status states for leases, payments, and maintenance work: pending, active, overdue, completed, cancelled, etc.
- For UI, value clarity and information density. Property managers need a fast overview and low-friction task completion.
- Keep auditability in mind: actions like contract changes, payment updates, and maintenance records should be traceable and understandable.

## Implementation rules

- Prefer domain-specific names over generic ones: property, tenant, lease, payment, maintenanceLog, not just item or record.
- Do not mix unrelated concerns in one component or service; keep property logic, tenant logic, and payment logic cleanly separated.
- Validate inputs as close to the boundary as possible and surface clear error messages.
- For database or API work, prefer explicit nullable handling and typed contracts over ambiguous responses.
- When adding admin features, keep them scoped and observable; avoid silent privilege escalation or hidden business logic.
- Write the smallest useful tests around business rules, especially for payment, lease validity, and permission checks.

## Quality bar

- Code should be understandable by another engineer within 10 minutes.
- Common workflow bugs such as duplicate tenants, invalid contract dates, and missing permission checks must be avoided proactively.
- Favor real business behavior and edge cases over polished demos with incomplete logic.
- Ship features that managers can actually use in a live property management workflow.

## Frontend rules: Next.js + React

- Prefer Next.js App Router conventions when applicable, and keep routes, server components, and client components clearly separated.
- Keep React components small, composable, and focused on a single UI responsibility.
- Use server actions or server-side data fetching for business-critical logic where it belongs, and keep client components for interactive behavior only.
- Favor typed props, explicit interfaces, and defensive handling of nullable values over loose untyped data flows.
- Avoid prop drilling; prefer composition, local state, and small data-fetching hooks when appropriate.
- Keep forms validated at the boundary and display clear human-readable errors for invalid rental, tenant, or payment data.
- Design tables and dashboards for dense operational use: searchable, filterable, sortable, and accessible.
- Treat empty states, loading states, and error states as first-class UI requirements, not afterthoughts.
- Prefer reusable UI primitives for cards, tables, filters, and modals to keep the interface consistent and maintainable.
- Use route-level loading and error boundaries where it improves the operator workflow and debugging experience.
- Keep state transitions explicit. For example, pending, paid, overdue, and cancelled flows should be reflected in the UI consistently.
- Avoid storing business-critical state only in ephemeral client memory when the server can provide the source of truth.
- Optimize for clarity and UX over visual gimmicks; property managers need fast scanning and reliable actions.
- When there is a decision between a clever hook and a simple component, choose the simple one unless the hook materially reduces duplication.
- Prefer semantic HTML and accessible controls: labels, keyboard support, focus states, and clear contrast.
