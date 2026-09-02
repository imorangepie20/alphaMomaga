# Project Documentation Access Order

Use this order whenever you need to understand the project before implementing or debugging.

## 1. Project overview

- README.md
- docs/overview/
- product goals and current status notes

## 2. Architecture overview

- architecture diagrams
- system boundaries
- frontend/backend/database interactions
- deployment and tooling notes

## 3. Business domain model

- property management domain
- tenant, contract, payment, maintenance, admin flows
- business rules and status transitions

## 4. Current implementation status

- current features implemented
- pending tasks
- known risks or open issues

## 5. Relevant feature docs or bug notes

- specific feature docs
- discovered root causes
- prior fixes or known caveats

## 6. Implementation files

- target modules
- files directly related to the task
- tests or adjacent modules that may be impacted

## 7. Make the change

- apply the minimal fix or feature work
- verify behavior with focused checks

## 8. Document the result

- update the relevant docs
- record decisions, findings, and changed behavior

This order is mandatory to avoid blind changes and unnecessary exploration.
