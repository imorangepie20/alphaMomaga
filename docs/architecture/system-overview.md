# System Overview

## High-level architecture

- Frontend: Next.js app for admin and manager workflows
- Backend: NestJS API for domain logic and business rules
- Data layer: relational database with explicit domain models
- UI shell: reusable admin dashboard template from `SDTPL_ADM`

## Responsibilities

### Frontend
- dashboard views
- table/list screens
- forms and detail pages
- role-based navigation
- analytics and operational summary cards

### Backend
- auth and access control
- business validation
- CRUD operations for entities
- payment and contract rules
- admin insights and reporting

### Shared concerns
- consistent status naming
- typed APIs and domain objects
- validation close to the input boundary
- traceable actions and audit-friendly records
