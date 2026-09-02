# Business Domain Map

## Core entities

- Property
  - represents an asset or unit managed by a property manager
  - owns metadata such as address, type, status, and supply information
- Tenant
  - occupies or rents a property
  - related to contract, payment behavior, and communication history
- Contract
  - defines rental agreement terms and lease lifecycle
  - connects property and tenant
- Payment
  - tracks rent collection, overdue status, and payment history
- Maintenance
  - tracks repairs, inspections, and service tasks tied to a property
- User
  - admin, manager, or viewer role
  - controls access and business actions

## Relationship map

Property -> Tenant
Property -> Contract
Property -> Payment
Property -> Maintenance
Tenant -> Contract
Tenant -> Payment
Contract -> Payment

## Workflow view

1. Create property
2. Assign tenant or prepare vacancy
3. Create or renew contract
4. Track rental payments
5. Record maintenance and inspections
6. Monitor occupancy, overdue risk, and portfolio status
7. Admin reviews the aggregate dashboard

## Design principle

Keep these relationships explicit to avoid breaking workflow integrity when adding new features or fixing bugs.
