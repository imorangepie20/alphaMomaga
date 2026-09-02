# Property Management Domain

## Overview

This project models a real-estate management application for property managers and administrators. The business domain is built around operational workflows rather than marketing or sales-only activity.

## Core entities

### Property
- Represents a managed unit, building, office, or residential asset.
- Contains identifying and operational data such as address, type, status, unit count, and assigned manager.
- Supports occupancy and asset-level operational reporting.

### Tenant
- Represents the person or entity occupying or leasing a property.
- Holds contact information, lease-related metadata, and payment behavior.
- Is linked to contracts and payment activity.

### Contract
- Defines the legal rental relationship between a property and a tenant.
- Includes start date, end date, monthly rent, status, and renewal info.
- Must be validated for lease validity and status flows.

### Payment
- Tracks rent collections and overdue conditions.
- Captures monthly payment amount, due date, status, and payment history.
- Supports operational monitoring for overdue or pending items.

### Maintenance
- Tracks inspections, repair requests, and unit work orders.
- Connects to property records and operational workload.
- Helps surface maintenance backlog and asset health trends.

### User / Role
- Represents a manager, admin, or viewer.
- Controls access to sensitive business data and operational actions.
- Enforces permission boundaries on the server side.

## Primary relationships

- Property has many Tenant records
- Property has many Contract records
- Property has many Payment records
- Property has many Maintenance records
- Tenant belongs to one Property
- Contract belongs to one Property and one Tenant
- Payment belongs to one Property and optionally one Contract
- User can manage multiple Properties

## Lifecycle and operational flow

1. Create or import a property.
2. Assign a tenant or mark the property as vacant.
3. Generate or update a contract.
4. Track monthly rent and overdue status.
5. Log maintenance requests and inspections.
6. Review occupancy, overdue units, and renewal risk.
7. Admin reviews portfolio summary and operational health.

## Business rules to preserve

- A tenant must be tied to a valid active or upcoming contract.
- Payment status must distinguish pending, paid, overdue, and cancelled states.
- Maintenance work should be trackable by status and date.
- Contract validity should be checked by lease dates and state.
- Authorization must be enforced for all manager and admin actions.

## Design principle

This domain model should remain clear and explicit so that new features or bug fixes do not break the operational integrity of the property lifecycle.
