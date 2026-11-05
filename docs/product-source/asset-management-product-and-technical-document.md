# Asset Management — Product Document

## 1. Product Overview

### Product Name
**Asset Management**

### Product Category
Enterprise Resource Planning / Business Operating System

### Product Purpose

The Asset Management module enables organizations to **register, track, allocate, maintain, depreciate, transfer, audit, and retire physical and digital assets throughout their entire lifecycle**.

It provides a single source of truth for organizational assets—from acquisition through deployment and maintenance to disposal—while connecting asset records with **procurement, inventory, finance, employees, locations, approvals, documents, and audit trails**.

The module should support organizations ranging from SMEs to large enterprises with multiple branches, departments, locations, subsidiaries, and asset classes.

---

# 2. Problem Statement

Organizations often manage assets using spreadsheets, accounting systems, paper records, or disconnected maintenance applications.

This creates problems such as:

- Unknown asset locations
- Missing or inaccurate asset records
- Difficulty determining who is responsible for an asset
- Uncontrolled asset transfers
- Missed maintenance schedules
- Expired warranties
- Poor visibility into asset condition
- Difficulty calculating depreciation
- Inaccurate asset values
- Duplicate asset purchases
- Lost or stolen assets
- Poor disposal controls
- Weak audit trails
- Difficulty reconciling physical assets with accounting records
- No complete asset lifecycle history
- Limited visibility into maintenance costs
- Difficulty identifying underutilized assets

The Asset Management module solves these problems by creating a **centralized asset register and lifecycle management system**.

---

# 3. Product Vision

> **Give every organization complete visibility and control over every asset it owns, leases, operates, or manages.**

The system should answer, at any point:

- What assets does the organization own?
- Where is each asset?
- Who is responsible for it?
- How much did it cost?
- What is it currently worth?
- When was it acquired?
- How was it acquired?
- What supplier provided it?
- Is it under warranty?
- When was it last serviced?
- When is the next maintenance due?
- How much has been spent maintaining it?
- Has it been transferred?
- Has it been damaged?
- Has it been lost?
- Should it be repaired, replaced, or disposed?
- What happened to it throughout its lifecycle?

---

# 4. Product Objectives

### Primary Objectives

1. Establish a centralized asset register.
2. Track assets throughout their lifecycle.
3. Track asset ownership, custody, location, and responsibility.
4. Automate maintenance management.
5. Manage asset depreciation and valuation.
6. Manage asset transfers and movements.
7. Track warranties and service agreements.
8. Maintain complete asset history.
9. Support physical asset verification.
10. Control asset disposal.
11. Integrate asset acquisition with procurement.
12. Integrate asset accounting with finance.
13. Provide management dashboards and reports.
14. Maintain strong approval and audit controls.

---

# 5. Target Customers

### SMEs

- Offices
- Retail businesses
- Schools
- Hospitals
- Restaurants
- Warehouses
- Professional services companies

### Mid-Market Organizations

- Banks
- Fintechs
- Insurance companies
- Manufacturing companies
- Logistics companies
- Construction companies
- Real estate companies
- Telecom companies
- Healthcare organizations
- Educational institutions

### Enterprise Organizations

Organizations with:

- Multiple subsidiaries
- Multiple branches
- Large asset inventories
- Centralized procurement
- Complex approval structures
- Dedicated finance departments
- Dedicated facilities/maintenance teams

---

# 6. Asset Categories

The system should support configurable asset categories.

### 6.1 IT Assets

Examples:

- Laptops
- Desktop computers
- Servers
- Monitors
- Printers
- Network equipment
- Routers
- Switches
- Access points
- Mobile phones
- Tablets
- Storage devices

### 6.2 Office Assets

- Desks
- Chairs
- Cabinets
- Meeting-room equipment
- Office appliances
- Generators
- Air conditioners

### 6.3 Vehicles

- Cars
- Trucks
- Vans
- Motorcycles
- Buses
- Specialized vehicles

### 6.4 Industrial Equipment

- Manufacturing machines
- Compressors
- Pumps
- Generators
- Motors
- Production equipment

### 6.5 Real Estate / Facilities

- Buildings
- Offices
- Warehouses
- Land
- Facility infrastructure

### 6.6 Medical Equipment

- Scanners
- Diagnostic equipment
- Laboratory equipment
- Medical devices

### 6.7 Digital / Intangible Assets

The system should optionally support:

- Software licenses
- Domain names
- Digital subscriptions
- Intellectual property
- Patents
- Copyrights
- Digital services

### 6.8 Financial Assets

Financial instruments should generally remain under the Finance module rather than Asset Management, but the architecture should allow configurable asset classes if required.

---

# 7. Asset Lifecycle

Every asset follows a controlled lifecycle.

```text
Planned
   ↓
Requested
   ↓
Approved
   ↓
Procured
   ↓
Received
   ↓
Registered
   ↓
Available
   ↓
Assigned / Deployed
   ↓
In Service
   ↓
Maintenance
   ↓
Transferred / Reassigned
   ↓
Retired
   ↓
Disposed
```

Not every asset must follow every stage.

For example:

```text
Purchased
→ Registered
→ Assigned
→ In Service
→ Retired
→ Disposed
```

The lifecycle should be configurable by organization.

---

# 8. Core Product Modules

## 8.1 Asset Register

The Asset Register is the central repository for all organizational assets.

Each asset should have:

- Asset number
- Asset name
- Asset category
- Asset class
- Description
- Status
- Condition
- Serial number
- Manufacturer
- Model
- Purchase date
- Acquisition date
- In-service date
- Purchase cost
- Current value
- Residual value
- Depreciation method
- Useful life
- Supplier
- Purchase order
- Invoice
- Warranty information
- Current location
- Department
- Cost center
- Assigned employee
- Custodian
- Parent asset
- Asset tags
- Documents
- Photos
- Notes

---

# 9. Asset Identification

Each asset should have a unique organizational identity.

### Asset Number

Example:

```text
AST-2026-000001
AST-2026-000002
AST-2026-000003
```

Organizations should be able to configure numbering.

Example:

```text
LAG-IT-000001
LAG-FAC-000001
ABJ-VEH-000001
```

### Identification Methods

The platform should support:

- Asset number
- Barcode
- QR code
- RFID identifier
- Serial number
- Manufacturer number
- Custom identifier

---

# 10. Asset Tagging

Organizations should be able to generate printable asset tags.

An asset tag may contain:

```text
Company Logo

ASSET
AST-2026-000128

Laptop
Dell Latitude 7450

Scan QR Code
```

Scanning the QR code should open the asset's authorized asset profile.

Depending on permissions, users may be able to:

- View asset information
- Confirm asset location
- Report damage
- Request maintenance
- Report missing asset
- Confirm custody

---

# 11. Asset Ownership

The system should distinguish between different ownership models.

### Ownership Types

- Owned
- Leased
- Rented
- Borrowed
- Customer-owned
- Third-party managed
- Government-provided

### Ownership Information

For leased/rented assets:

- Provider
- Contract
- Start date
- End date
- Payment terms
- Monthly cost
- Renewal date
- Return requirements

---

# 12. Asset Assignment

Assets can be assigned to:

- Employee
- Department
- Team
- Branch
- Location
- Project
- Vehicle operator
- Customer
- External party

Example:

```text
Asset:
AST-2026-00124

Assigned To:
John Doe

Department:
Engineering

Location:
Lagos Office

Custodian:
John Doe

Assigned:
10 March 2026
```

The system should preserve historical assignments.

---

# 13. Asset Custody

Custody is distinct from ownership.

For example:

> The company owns a laptop, but the employee is its custodian.

The system should therefore track:

- Owner
- Custodian
- Assigned user
- Department
- Physical location
- Responsible manager

This is particularly important for:

- IT equipment
- Vehicles
- Tools
- Mobile devices
- Portable equipment

---

# 14. Asset Locations

Organizations should be able to create hierarchical locations.

Example:

```text
Nigeria
 └── Lagos
      └── Head Office
           ├── Floor 1
           ├── Floor 2
           │    ├── Finance
           │    ├── HR
           │    └── Engineering
           └── Server Room
```

Locations may represent:

- Country
- State
- City
- Branch
- Building
- Floor
- Room
- Warehouse
- Yard
- Site

---

# 15. Asset Movement

Assets should be transferable between locations and custodians.

### Example

```text
Lagos Office
        ↓
Abuja Branch
```

The movement should capture:

- Asset
- Previous location
- New location
- Previous custodian
- New custodian
- Reason
- Requested by
- Approved by
- Transfer date
- Effective date
- Supporting document
- Confirmation status

### Transfer Workflow

```text
Transfer Request
       ↓
Approval
       ↓
Dispatch
       ↓
Receipt
       ↓
Asset Location Updated
       ↓
Audit Record Created
```

---

# 16. Asset Condition

Each asset should have a condition state.

Example:

- New
- Excellent
- Good
- Fair
- Poor
- Damaged
- Non-functional
- Beyond repair

Condition changes should be recorded historically.

---

# 17. Asset Maintenance

Maintenance is a major component of Asset Management.

The system should support:

### Preventive Maintenance

Scheduled maintenance based on:

- Date
- Operating hours
- Mileage
- Usage
- Production cycles
- Custom intervals

### Corrective Maintenance

Maintenance triggered by:

- Failure
- Damage
- Fault
- User report
- Inspection

### Emergency Maintenance

Unplanned critical repairs.

---

# 18. Maintenance Schedule

Example:

```text
Asset:
Industrial Generator

Maintenance:
Engine Service

Frequency:
Every 500 operating hours

Last Service:
1,000 hours

Next Service:
1,500 hours
```

The system should generate maintenance reminders automatically.

---

# 19. Maintenance Work Orders

A maintenance work order should include:

- Work order number
- Asset
- Maintenance type
- Problem description
- Priority
- Requested date
- Scheduled date
- Technician
- Internal/external provider
- Estimated cost
- Actual cost
- Parts used
- Labor cost
- Downtime
- Completion notes
- Attachments
- Approval
- Completion status

---

# 20. Maintenance Statuses

Example:

```text
Requested
↓
Approved
↓
Scheduled
↓
Assigned
↓
In Progress
↓
Completed
↓
Verified
↓
Closed
```

---

# 21. Warranty Management

Each eligible asset should support warranty information.

### Warranty Fields

- Warranty provider
- Warranty type
- Start date
- End date
- Coverage
- Warranty number
- Contact information
- Terms
- Documents

The system should notify users before warranty expiry.

Example:

> Dell Latitude 7450 warranty expires in 30 days.

---

# 22. Service Contracts

Assets may have associated service agreements.

Examples:

- Generator maintenance contract
- Elevator maintenance contract
- Vehicle maintenance agreement
- HVAC service contract
- IT hardware support contract

Track:

- Provider
- Contract
- Start date
- End date
- SLA
- Cost
- Renewal
- Covered assets

---

# 23. Asset Acquisition

Asset acquisition should integrate with Procurement.

### Example

```text
Purchase Requisition
        ↓
Approval
        ↓
RFQ
        ↓
Supplier Quote
        ↓
Purchase Order
        ↓
GRN
        ↓
Asset Registration
        ↓
Invoice
        ↓
Payment
```

When an asset is received through procurement, the system should be able to create an asset record automatically.

---

# 24. Asset Capitalization

For assets that qualify as capital assets, the system should support capitalization.

The organization can configure capitalization rules such as:

```text
Capitalization Threshold:
₦500,000
```

Items below the threshold may remain expense items while qualifying purchases become fixed assets.

The exact accounting treatment should remain configurable.

---

# 25. Depreciation

The system should support configurable depreciation.

### Supported Methods

At minimum:

- Straight-line
- Declining balance
- Double declining balance
- Units of production

### Example

```text
Purchase Cost:       ₦5,000,000
Residual Value:      ₦500,000
Useful Life:         5 years

Depreciable Amount:
₦4,500,000
```

The system should generate depreciation schedules automatically.

---

# 26. Asset Valuation

The system should maintain:

- Acquisition cost
- Capitalized cost
- Accumulated depreciation
- Net book value
- Impairment
- Revaluation
- Disposal value

Example:

```text
Acquisition Cost      ₦5,000,000
Accumulated Dep.      ₦1,500,000
Impairment              ₦200,000
-------------------------------
Net Book Value        ₦3,300,000
```

---

# 27. Asset Components

Some assets contain components.

Example:

```text
Server
 ├── CPU
 ├── RAM
 ├── SSD
 ├── RAID Controller
 └── Network Card
```

The system should optionally support:

- Parent asset
- Child asset
- Component
- Subcomponent

This enables organizations to replace individual components without losing the parent asset history.

---

# 28. Asset Bundles

Assets can also be grouped.

Example:

```text
Employee Workstation Package

Laptop
Monitor
Keyboard
Mouse
Docking Station
Headset
```

The bundle can be assigned together while preserving individual asset identities.

---

# 29. Asset Inspection

The system should support periodic physical inspections.

Inspection may verify:

- Asset exists
- Location is correct
- Custodian is correct
- Serial number matches
- Condition
- Functionality
- Tag exists
- Photos
- Missing/damaged status

---

# 30. Physical Asset Verification

Organizations should be able to conduct asset counts.

Example:

```text
2026 Annual Asset Verification

Location:
Lagos Head Office

Expected:
1,250 assets

Verified:
1,197

Missing:
32

Moved:
15

Damaged:
6
```

The system should create reconciliation tasks for exceptions.

---

# 31. Asset Disposal

Assets reaching the end of their useful life can be disposed.

### Disposal Reasons

- End of useful life
- Beyond repair
- Obsolete
- Lost
- Damaged
- Sold
- Donated
- Scrapped
- Replaced

### Disposal Workflow

```text
Disposal Request
       ↓
Inspection
       ↓
Approval
       ↓
Disposal Method
       ↓
Execution
       ↓
Financial Adjustment
       ↓
Asset Retired
```

---

# 32. Disposal Methods

Support:

- Sale
- Scrap
- Donation
- Return to supplier
- Lease return
- Destruction
- Internal transfer
- Write-off

The system should preserve disposal evidence.

---

# 33. Lost and Stolen Assets

An authorized user should be able to report an asset as missing.

The system should record:

- Asset
- Last known location
- Last custodian
- Date reported
- Incident description
- Incident reference
- Investigation
- Resolution
- Financial treatment

Asset status could become:

```text
Missing
```

until resolved.

---

# 34. Asset Damage

Users should be able to report damage.

Example:

```text
Asset:
Laptop

Issue:
Screen damaged

Reported By:
Employee

Reported:
12 September

Severity:
Medium
```

The system can then create a maintenance request or incident workflow.

---

# 35. Asset Retirement

Retirement is different from disposal.

An asset may be:

```text
Retired → awaiting disposal
```

This ensures the asset is no longer operational while its final disposal remains subject to approval.

---

# 36. Documents

Assets should support attached documents.

Examples:

- Purchase invoice
- Purchase order
- Warranty certificate
- Maintenance report
- Insurance certificate
- Registration documents
- Lease agreement
- Inspection report
- Disposal certificate
- Photos
- Ownership documents

Documents should be linked to the asset lifecycle.

---

# 37. Asset Insurance

For insurable assets, track:

- Insurance provider
- Policy
- Coverage
- Premium
- Start date
- Expiry date
- Insured value
- Claims
- Documents

The system should provide renewal reminders.

---

# 38. Asset Insurance Claims

A claim should contain:

- Asset
- Policy
- Incident date
- Incident type
- Claim number
- Claim amount
- Insurer
- Status
- Settlement amount
- Documents

---

# 39. Asset Approvals

Asset-related operations should support the organization's Approval Engine.

Examples:

- Asset acquisition
- Asset assignment
- Asset transfer
- Asset write-off
- Asset disposal
- Asset revaluation
- Asset impairment
- Asset adjustment

Approval policies should be configurable.

Example:

```text
Asset Disposal > ₦10m
        ↓
Department Manager
        ↓
Finance
        ↓
Asset Manager
        ↓
Executive Approval
```

---

# 40. Roles

Recommended roles include:

### Asset Administrator

Full asset-management administration.

### Asset Manager

Manages:

- Assets
- Transfers
- Assignments
- Maintenance
- Verification
- Disposal

### Finance Officer

Manages:

- Capitalization
- Depreciation
- Valuation
- Asset accounting

### Maintenance Officer

Manages:

- Maintenance schedules
- Work orders
- Service providers

### Department Manager

Can request, approve, assign, or transfer assets according to permissions.

### Employee / Custodian

Can:

- View assigned assets
- Confirm custody
- Report damage
- Request maintenance
- Report missing assets

### Auditor

Read-only access to:

- Asset history
- Transactions
- Documents
- Approvals
- Audit logs

---

# 41. Permissions

Permissions should be granular.

Examples:

```text
asset.view
asset.create
asset.update
asset.delete

asset.assign
asset.transfer

asset.maintenance.view
asset.maintenance.create
asset.maintenance.approve

asset.disposal.create
asset.disposal.approve

asset.valuation.view
asset.valuation.update

asset.verification.create
asset.verification.complete
```

Permissions should also respect:

- Organization
- Branch
- Department
- Location
- Asset class
- Cost center

---

# 42. Dashboard

The Asset Management dashboard should provide an executive overview.

### KPIs

- Total assets
- Total asset value
- Current net book value
- Assets in service
- Assets under maintenance
- Assets overdue for maintenance
- Assets nearing warranty expiry
- Missing assets
- Damaged assets
- Retired assets
- Assets awaiting disposal
- Assets by location
- Assets by category

---

# 43. Dashboard Example

```text
ASSET MANAGEMENT

Total Assets             18,492
Asset Value              ₦8.7B
Net Book Value           ₦5.9B

In Service               16,840
Under Maintenance           384
Missing                     47
Damaged                     91
Awaiting Disposal           62

Maintenance Due
██████████████ 384

Warranty Expiring
████████ 128
```

---

# 44. Reports

The module should provide reports such as:

### Asset Register Report

All assets and their current status.

### Asset Valuation Report

Asset values and depreciation.

### Depreciation Report

Periodic depreciation.

### Asset Movement Report

Transfers and movements.

### Asset Assignment Report

Assets assigned to employees/departments.

### Maintenance Cost Report

Maintenance expenditure per asset.

### Asset Utilization Report

Asset usage and availability.

### Warranty Expiry Report

Upcoming warranty expirations.

### Disposal Report

Disposed assets.

### Missing Asset Report

Missing and unresolved assets.

### Physical Verification Report

Expected vs verified assets.

### Asset Lifecycle Report

Complete lifecycle history.

---

# 45. Asset Cost Analysis

The system should calculate the **Total Cost of Ownership (TCO)**.

Example:

```text
Purchase Cost          ₦10,000,000
Installation              ₦500,000
Maintenance              ₦2,000,000
Insurance                  ₦400,000
Operating Costs           ₦1,100,000
------------------------------------------------
Total Cost               ₦14,000,000
```

This helps management determine whether assets should be:

- Maintained
- Replaced
- Upgraded
- Outsourced
- Disposed

---

# 46. Asset Utilization

For applicable assets, organizations should be able to track utilization.

Examples:

### Vehicle

- Mileage
- Trips
- Fuel
- Operating hours

### Machine

- Operating hours
- Production units
- Downtime

### Equipment

- Usage hours
- Number of operations

This can support maintenance and replacement decisions.

---

# 47. Asset Downtime

The system should track downtime.

Example:

```text
Asset:
Production Machine A

Available Hours:
720

Downtime:
38 hours

Availability:
94.7%
```

This becomes useful for operational assets.

---

# 48. Replacement Planning

The system should identify assets approaching replacement.

Factors may include:

- Age
- Useful life
- Maintenance cost
- Downtime
- Condition
- Warranty expiry
- Obsolescence
- Current value
- Replacement cost

Example:

> "12 vehicles should be considered for replacement within the next 12 months."

---

# 49. Asset Budgeting

Asset Management should integrate with budgeting.

Organizations can create:

### Capital Expenditure Budget

```text
IT Equipment       ₦100M
Vehicles            ₦80M
Facilities          ₦50M
Machinery           ₦200M
```

Actual acquisition can then be compared with budget.

---

# 50. Procurement Integration

Asset Management should integrate tightly with:

- Purchase Requisition
- RFQ
- Supplier quotation
- Purchase Order
- Goods Received Note
- Supplier Invoice
- Supplier Payment

When an eligible item is received, the system should prompt:

> **Create Asset**

For serialized items, the system should be able to create multiple individual asset records from one receipt.

Example:

```text
PO:
100 laptops

GRN:
100 laptops received

Assets:
AST-000001
AST-000002
...
AST-000100
```

---

# 51. Inventory Integration

Asset Management and Inventory should remain separate but connected.

### Inventory

Tracks consumable/stock items.

### Asset Management

Tracks individually identifiable long-term assets.

Example:

```text
100 USB cables → Inventory

10 laptops → Assets
```

A replacement component may move:

```text
Inventory
   ↓
Maintenance Work Order
   ↓
Asset Component
```

---

# 52. Finance Integration

The module should integrate with:

- General Ledger
- Chart of Accounts
- Accounts Payable
- Budgeting
- Cost Centers
- Fixed Asset Accounting

Financial events may include:

- Acquisition
- Capitalization
- Depreciation
- Impairment
- Revaluation
- Disposal
- Gain/loss on disposal
- Write-off

---

# 53. HR Integration

Asset assignment should integrate with employees.

Example:

```text
Employee
    ↓
Assigned Assets
    ↓
Custody
    ↓
Return on Exit
```

Employee offboarding should trigger an asset-return checklist.

Example:

```text
Employee Exit

☑ Laptop returned
☑ Monitor returned
☑ Access card returned
☐ Mobile phone returned
☑ Vehicle returned
```

---

# 54. Project Integration

Assets can be assigned to projects.

Example:

```text
Project:
Lagos Construction Project

Assets:
- Excavator
- Generator
- Truck
- Survey equipment
```

This enables project-level asset cost tracking.

---

# 55. CRM / Customer Integration

For organizations that provide equipment to customers, assets may be associated with customers.

Examples:

- Telecom equipment
- POS terminals
- Rental equipment
- Installed machines
- Customer premises equipment

---

# 56. Notifications

The system should generate notifications for:

- Warranty expiry
- Insurance expiry
- Maintenance due
- Maintenance overdue
- Asset transfer approval
- Asset disposal approval
- Asset verification
- Missing assets
- Lease expiry
- Service contract expiry
- Asset assignment
- Asset return

Channels can include:

- In-app
- Email
- SMS
- Push
- WebSocket/realtime notifications

---

# 57. Search

Users should be able to search assets using:

- Asset number
- Name
- Serial number
- Barcode
- QR code
- Category
- Employee
- Location
- Department
- Supplier
- Purchase order
- Status

---

# 58. Filtering

Filters should include:

- Asset category
- Status
- Condition
- Location
- Department
- Custodian
- Supplier
- Acquisition date
- Value
- Warranty status
- Maintenance status
- Ownership type

---

# 59. Asset Timeline

Every asset should have a complete timeline.

Example:

```text
10 Jan 2026
Asset purchased

12 Jan 2026
Asset registered

15 Jan 2026
Assigned to John Doe

03 Mar 2026
Transferred to Abuja Branch

18 Apr 2026
Maintenance requested

19 Apr 2026
Maintenance completed

01 Aug 2026
Warranty updated

20 Sep 2026
Physical verification completed
```

This should be immutable from the user's perspective and backed by audit records.

---

# 60. Audit Trail

The system should record:

- Who created the asset
- Who modified it
- What changed
- Previous value
- New value
- Date/time
- IP/device context where applicable
- Related transaction
- Approval
- Reason

Critical operations should never silently overwrite history.

---

# 61. Asset Status Model

Recommended default statuses:

```text
Draft
Pending Approval
Approved
Received
Available
Assigned
In Service
Under Maintenance
Suspended
Missing
Damaged
Retired
Awaiting Disposal
Disposed
Written Off
```

Organizations should be able to configure additional statuses.

---

# 62. Asset Condition vs Status

The product should keep these concepts separate.

### Status

What is happening to the asset?

```text
In Service
Under Maintenance
Retired
```

### Condition

What physical/operational state is the asset in?

```text
Excellent
Good
Fair
Poor
Damaged
```

This prevents confusing operational state with physical condition.

---

# 63. Bulk Operations

Enterprise customers should be able to:

- Import assets
- Export assets
- Bulk assign
- Bulk transfer
- Bulk update categories
- Bulk tag
- Bulk verify
- Bulk retire

Bulk actions should respect permissions and approval rules.

---

# 64. Asset Import

Support CSV/Excel imports with validation.

Example columns:

```text
Asset Name
Category
Serial Number
Purchase Date
Purchase Cost
Supplier
Location
Department
Custodian
Warranty Expiry
```

The system should validate records before committing them.

---

# 65. Asset Verification via Mobile

A future mobile experience should allow users to:

1. Scan asset QR code.
2. View asset.
3. Confirm location.
4. Confirm custodian.
5. Confirm condition.
6. Take photograph.
7. Submit verification.

This can dramatically simplify annual asset counts.

---

# 66. Enterprise Multi-Tenancy

The module should operate within the platform's multi-tenant architecture.

Every asset should belong to an organization/tenant.

Asset data should respect:

- Organization
- Branch
- Location
- Department
- Cost center
- User permissions

Cross-tenant access must never occur.

---

# 67. Localization

The product should support organization-specific:

- Currency
- Date formats
- Number formats
- Fiscal year
- Depreciation rules
- Tax rules
- Asset numbering
- Approval policies
- Locations
- Measurement units

For the Nigerian market, NGN should be a first-class currency while supporting multi-currency organizations.

---

# 68. Business Rules

Examples:

### Rule 1 — Asset Number

Every active asset must have a unique asset number.

### Rule 2 — Serial Number

Serialized assets should not allow duplicate serial numbers within the organization.

### Rule 3 — Assignment

An asset marked `Disposed` cannot be assigned.

### Rule 4 — Maintenance

An asset under maintenance cannot be transferred unless authorized.

### Rule 5 — Disposal

Disposed assets cannot return to active service without an authorized reinstatement process.

### Rule 6 — Custody

An employee cannot be assigned an asset outside their permitted organization scope.

### Rule 7 — Verification

A verification exercise cannot be closed until unresolved exceptions are handled or explicitly approved.

---

# 69. Key User Journeys

## Journey 1 — New Laptop

```text
Purchase Laptop
      ↓
Receive Laptop
      ↓
Create Asset
      ↓
Generate Asset Tag
      ↓
Assign to Employee
      ↓
Employee Confirms Custody
      ↓
Asset In Service
```

## Journey 2 — Asset Transfer

```text
Employee Requests Transfer
          ↓
Manager Approval
          ↓
Asset Dispatched
          ↓
New Location Confirms Receipt
          ↓
Custodian Updated
          ↓
Audit Trail Updated
```

## Journey 3 — Maintenance

```text
Maintenance Due
       ↓
Notification
       ↓
Work Order
       ↓
Technician Assigned
       ↓
Repair
       ↓
Cost Recorded
       ↓
Asset Returned to Service
```

## Journey 4 — Disposal

```text
Asset Reaches End of Life
          ↓
Disposal Request
          ↓
Inspection
          ↓
Approval
          ↓
Disposal
          ↓
Financial Adjustment
          ↓
Asset Disposed
```

---

# 70. MVP Scope

The first release should focus on the core lifecycle.

### MVP Features

**Asset Register**
- Create asset
- Update asset
- View asset
- Search/filter
- Asset categories
- Asset numbering

**Assignment**
- Employee assignment
- Department
- Location
- Custodian

**Movement**
- Asset transfers
- Transfer history

**Lifecycle**
- Status
- Condition
- Retirement

**Maintenance**
- Maintenance records
- Maintenance schedules
- Work orders

**Warranty**
- Warranty dates
- Expiry notifications

**Documents**
- Asset documents

**Audit**
- Asset history
- Audit trail

**Reports**
- Asset register
- Asset assignment
- Asset movement
- Maintenance
- Warranty

---

# 71. Phase 2

Add:

- Depreciation
- Asset valuation
- Capitalization
- Disposal
- Physical verification
- QR codes
- Asset tagging
- Insurance
- Service contracts
- Budget integration
- Procurement integration
- Finance integration

---

# 72. Phase 3

Add advanced enterprise capabilities:

- Mobile asset verification
- RFID
- IoT telemetry
- Predictive maintenance
- Asset utilization analytics
- Replacement forecasting
- Total cost of ownership
- Advanced fleet management
- AI-powered asset insights
- Automated anomaly detection
- Computer-vision-assisted asset verification

---

# 73. AI Capabilities

AI should enhance the module rather than replace deterministic business rules.

Potential capabilities:

### Maintenance Prediction

Predict likely equipment failures using historical maintenance and operational data.

### Replacement Recommendation

Identify assets that are becoming uneconomical to maintain.

### Document Extraction

Extract asset information from:

- Invoices
- Warranty documents
- Purchase orders
- Registration documents

### Anomaly Detection

Identify:

- Unusual maintenance costs
- Frequent transfers
- Duplicate assets
- Suspicious disposal activity
- Unexpected asset movements

### Natural Language Queries

Example:

> "Show me all laptops in Lagos that are more than four years old."

Or:

> "Which machines had the highest maintenance cost this year?"

---

# 74. Success Metrics

Product success should be measured using:

### Adoption

- % of organizational assets registered
- Monthly active asset users
- Number of asset transactions

### Accuracy

- Asset register accuracy
- Physical verification match rate
- Duplicate asset rate

### Operational Efficiency

- Asset assignment time
- Transfer processing time
- Maintenance response time
- Maintenance completion time

### Financial

- Asset utilization
- Maintenance cost
- Depreciation accuracy
- Disposal recovery value

### Compliance

- Verification completion rate
- Overdue maintenance
- Expired warranties
- Unresolved asset exceptions

---

# 75. Key Product KPIs

The executive dashboard should prioritize:

| KPI | Purpose |
|---|---|
| Total Asset Value | Understand asset base |
| Net Book Value | Financial position |
| Asset Count | Asset inventory |
| Assets in Service | Operational capacity |
| Maintenance Cost | Cost efficiency |
| Asset Downtime | Operational reliability |
| Warranty Expiring | Risk management |
| Missing Assets | Loss control |
| Disposal Pipeline | Lifecycle management |
| Verification Accuracy | Data integrity |
| Utilization | Operational efficiency |
| TCO | Investment decisions |

---

# 76. Enterprise Differentiation

The Asset Management module should not simply be a fixed-asset accounting system.

Its differentiation should be:

> **Financial + Operational + Physical Asset Management in one lifecycle platform.**

Traditional accounting systems primarily answer:

> "What is this asset worth?"

This module should answer:

> "What is the asset, where is it, who has it, what condition is it in, what has happened to it, what does it cost us, and what should we do with it next?"

---

# 77. Relationship With the Broader Business Operating System

Asset Management should become a central component of the wider ERP/BOS.

```text
                    ┌──────────────┐
                    │ Procurement  │
                    └──────┬───────┘
                           │
                           ▼
┌──────────┐        ┌──────────────┐        ┌──────────┐
│ Inventory│◄──────►│    ASSETS    │◄──────►│ Finance  │
└──────────┘        └──────┬───────┘        └──────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
       HR/People      Maintenance       Locations
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                    Reporting & AI
```

The Asset Management module therefore becomes the **operational bridge between procurement, inventory, finance, HR, maintenance, facilities, and analytics**.

---

# 78. Product Principle

The core product principle should be:

> **Every asset must have an identity, owner, custodian, location, condition, financial value, lifecycle state, and complete history.**

That principle should guide the design of every feature in the module.

---

# 79. Final Product Scope

The complete Asset Management product should ultimately cover:

```text
Asset Register
├── Asset Categories
├── Asset Classes
├── Asset Identification
├── Asset Tags
├── Asset Assignment
├── Asset Custody
├── Asset Locations
├── Asset Transfers
├── Asset Components
├── Asset Bundles
├── Asset Condition
├── Asset Maintenance
│   ├── Preventive
│   ├── Corrective
│   └── Emergency
├── Warranty
├── Service Contracts
├── Insurance
├── Asset Verification
├── Asset Valuation
├── Depreciation
├── Capitalization
├── Impairment
├── Revaluation
├── Asset Budgeting
├── Asset Utilization
├── Asset Downtime
├── Asset Replacement
├── Asset Disposal
├── Asset Write-off
├── Asset Documents
├── Asset Audit Trail
├── Notifications
├── Reports
├── Dashboards
├── Procurement Integration
├── Inventory Integration
├── Finance Integration
├── HR Integration
├── Project Integration
└── AI / Analytics
```


---

# Technical Implementation

# Asset Management — Technical Implementation Document

## 1. Technical Objective

Build the Asset Management module as a **production-grade, multi-tenant ERP module** that manages the complete lifecycle of organizational assets:

> **Acquire → Register → Capitalize → Assign → Operate → Maintain → Transfer → Verify → Revalue/Depreciate → Retire → Dispose**

The module must integrate with the wider Business Operating System without becoming tightly coupled to Procurement, Finance, HR, Inventory, or Maintenance.

---

# 2. Architectural Position

The recommended domain boundary is:

```text
                    Asset Management
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
 Procurement            Finance             HR/People
       │                   │                   │
       └──────────────┬────┴────────────┬──────┘
                      │                 │
                      ▼                 ▼
                  Inventory         Maintenance
                      │                 │
                      └────────┬────────┘
                               ▼
                         Asset Management
```

Asset Management **owns asset lifecycle state**.

Other modules own their respective domains.

For example:

- Procurement owns purchase orders.
- Inventory owns stock.
- Finance owns accounting entries.
- HR owns employees.
- Asset Management owns the asset itself.

---

# 3. Recommended Module Structure

Following the established ERP architecture:

```text
Controller
    ↓
Use Case
    ↓
Service
    ↓
Repository
    ↓
Entity
```

With supporting components:

```text
                 Controller
                     │
                  Use Case
                     │
                  Service
             ┌───────┼────────┐
             ▼       ▼        ▼
        Repository  Mapper   Domain Rules
             │
           Entity
```

### Important architectural rules

1. Controllers do not contain business logic.
2. Use cases do not directly access repositories.
3. Use cases do not call other use cases.
4. Services do not call other services.
5. Repository access is encapsulated by services.
6. External modules are accessed through explicit integration ports/interfaces.
7. Mappers handle entity ↔ DTO transformation.
8. Domain events are emitted for significant lifecycle changes.
9. Approval workflows are handled through the central Approval Engine.
10. Audit events are immutable.

---

# 4. Suggested Domain Modules

Rather than one enormous `AssetService`, split the domain logically.

```text
asset/
├── asset
├── asset-category
├── asset-class
├── asset-location
├── asset-assignment
├── asset-transfer
├── asset-maintenance
├── asset-warranty
├── asset-insurance
├── asset-verification
├── asset-valuation
├── asset-depreciation
├── asset-disposal
├── asset-document
├── asset-component
├── asset-bundle
├── asset-event
└── asset-report
```

These can initially live inside one deployable module while maintaining clear domain boundaries.

---

# 5. Core Entities

The first implementation should introduce the following entities.

## 5.1 Asset

The central entity.

```text
Asset
├── id
├── organizationId
├── assetNumber
├── name
├── description
├── categoryId
├── assetClassId
├── parentAssetId
├── status
├── condition
├── ownershipType
├── serialNumber
├── manufacturer
├── model
├── acquisitionDate
├── purchaseDate
├── inServiceDate
├── purchaseCost
├── capitalizedCost
├── residualValue
├── usefulLifeMonths
├── currentValue
├── locationId
├── departmentId
├── costCenterId
├── custodianId
├── supplierId
├── warrantyId
├── depreciationMethod
├── depreciationStartDate
├── retiredAt
├── disposedAt
├── createdAt
├── updatedAt
└── version
```

`version` is useful for optimistic concurrency.

---

# 6. Asset Category

Represents broad classifications.

Examples:

```text
IT Equipment
Vehicles
Furniture
Machinery
Buildings
Medical Equipment
Software
Tools
```

Fields:

```text
AssetCategory
├── id
├── organizationId
├── name
├── code
├── description
├── parentId
├── active
├── createdAt
└── updatedAt
```

Categories should support hierarchy.

```text
IT Equipment
├── Computers
│   ├── Laptop
│   └── Desktop
├── Networking
└── Printers
```

---

# 7. Asset Class

An Asset Class contains the accounting and operational rules for a category of assets.

Example:

```text
Laptop
├── Useful Life: 36 months
├── Depreciation: Straight Line
├── Residual Value: 5%
├── Capitalization Threshold: ₦500,000
└── Verification Frequency: Annual
```

This prevents users from repeatedly configuring the same rules.

---

# 8. Asset Location

```text
AssetLocation
├── id
├── organizationId
├── parentId
├── code
├── name
├── type
├── address
├── active
├── createdAt
└── updatedAt
```

Location types:

```text
COUNTRY
STATE
CITY
BRANCH
BUILDING
FLOOR
ROOM
WAREHOUSE
SITE
OTHER
```

---

# 9. Asset Assignment

Assignment should be a first-class record rather than simply storing `custodianId` on Asset.

```text
AssetAssignment
├── id
├── organizationId
├── assetId
├── assigneeType
├── assigneeId
├── departmentId
├── locationId
├── assignedAt
├── returnedAt
├── reason
├── notes
├── status
├── assignedBy
└── createdAt
```

This preserves the complete assignment history.

The Asset can maintain the current assignment for efficient reads, while the assignment table remains the source of historical truth.

---

# 10. Asset Transfer

```text
AssetTransfer
├── id
├── organizationId
├── transferNumber
├── assetId
├── fromLocationId
├── toLocationId
├── fromCustodianId
├── toCustodianId
├── requestedBy
├── approvedBy
├── requestedAt
├── approvedAt
├── completedAt
├── reason
├── status
└── notes
```

Statuses:

```text
DRAFT
PENDING_APPROVAL
APPROVED
IN_TRANSIT
RECEIVED
REJECTED
CANCELLED
```

---

# 11. Asset Maintenance

Separate maintenance records from assets.

```text
AssetMaintenance
├── id
├── organizationId
├── assetId
├── maintenanceNumber
├── type
├── priority
├── description
├── scheduledAt
├── startedAt
├── completedAt
├── technicianId
├── providerId
├── estimatedCost
├── actualCost
├── downtimeMinutes
├── status
└── notes
```

Types:

```text
PREVENTIVE
CORRECTIVE
EMERGENCY
INSPECTION
```

---

# 12. Maintenance Schedule

```text
MaintenanceSchedule
├── id
├── organizationId
├── assetId
├── maintenanceType
├── frequencyType
├── frequencyValue
├── nextDueAt
├── lastCompletedAt
├── operatingThreshold
├── active
└── createdAt
```

Frequency could be:

```text
TIME
USAGE
MILEAGE
OPERATING_HOURS
CUSTOM
```

---

# 13. Warranty

```text
AssetWarranty
├── id
├── organizationId
├── assetId
├── providerId
├── warrantyNumber
├── startDate
├── endDate
├── coverage
├── terms
├── status
└── documentId
```

---

# 14. Depreciation

Depreciation should not be calculated ad hoc whenever an asset is displayed.

Create a schedule.

```text
AssetDepreciationSchedule
├── id
├── assetId
├── period
├── openingValue
├── depreciationAmount
├── accumulatedDepreciation
├── closingValue
├── posted
└── postedAt
```

This gives Finance a reliable audit trail.

---

# 15. Asset Valuation

Create explicit valuation records.

```text
AssetValuation
├── id
├── organizationId
├── assetId
├── valuationDate
├── valuationType
├── previousValue
├── newValue
├── reason
├── approvedBy
├── documentId
└── createdAt
```

Types:

```text
INITIAL
REVALUATION
IMPAIRMENT
ADJUSTMENT
DISPOSAL
```

---

# 16. Asset Disposal

```text
AssetDisposal
├── id
├── organizationId
├── disposalNumber
├── assetId
├── reason
├── method
├── bookValue
├── disposalValue
├── gainLoss
├── requestedBy
├── approvedBy
├── approvedAt
├── disposedAt
├── status
└── notes
```

Methods:

```text
SALE
SCRAP
DONATION
RETURN
WRITE_OFF
DESTRUCTION
TRANSFER
```

---

# 17. Asset Verification

```text
AssetVerification
├── id
├── organizationId
├── verificationNumber
├── locationId
├── startedAt
├── completedAt
├── initiatedBy
├── status
└── notes
```

Individual results:

```text
AssetVerificationItem
├── id
├── verificationId
├── assetId
├── expectedLocationId
├── actualLocationId
├── expectedCustodianId
├── actualCustodianId
├── condition
├── result
├── verifiedAt
└── notes
```

Results:

```text
VERIFIED
MISSING
MOVED
DAMAGED
NOT_FOUND
EXCEPTION
```

---

# 18. Asset Component

```text
AssetComponent
├── id
├── organizationId
├── parentAssetId
├── componentAssetId
├── relationshipType
├── installedAt
├── removedAt
└── status
```

This supports:

```text
Server
 ├── RAM
 ├── SSD
 └── Network Card
```

---

# 19. Asset Event

The lifecycle should have a dedicated event/history model.

```text
AssetEvent
├── id
├── organizationId
├── assetId
├── eventType
├── occurredAt
├── actorId
├── referenceType
├── referenceId
├── metadata
└── createdAt
```

Example events:

```text
ASSET_CREATED
ASSET_RECEIVED
ASSET_ASSIGNED
ASSET_TRANSFERRED
ASSET_MAINTENANCE_STARTED
ASSET_MAINTENANCE_COMPLETED
ASSET_VERIFIED
ASSET_MARKED_MISSING
ASSET_RETIRED
ASSET_DISPOSED
```

---

# 20. DTO Architecture

For each resource:

```text
create-asset.dto.ts
update-asset.dto.ts
filter-asset.dto.ts
asset-response.dto.ts
```

Nested response DTOs should be used instead of exposing database IDs unnecessarily.

Example:

```text
AssetResponseDto
├── assetNumber
├── name
├── category
├── status
├── condition
├── location
├── custodian
├── financial
└── warranty
```

---

# 21. Mapper

Follow the established static mapper pattern.

```text
AssetMapper

toDto()
toDtoList()
fromCreateDto()
fromUpdateDto()
```

Where appropriate:

```text
toDto(entity, options)
```

Options can control nested relationships.

---

# 22. Use Cases

The initial application layer should include:

```text
CreateAssetUseCase
FindOneAssetUseCase
FindAllAssetsUseCase
UpdateAssetUseCase
DeleteAssetUseCase

AssignAssetUseCase
ReturnAssetUseCase

CreateAssetTransferUseCase
ApproveAssetTransferUseCase
CompleteAssetTransferUseCase

CreateMaintenanceUseCase
ScheduleMaintenanceUseCase
CompleteMaintenanceUseCase

CreateWarrantyUseCase
UpdateWarrantyUseCase

CreateVerificationUseCase
VerifyAssetUseCase
CompleteVerificationUseCase

CalculateDepreciationUseCase
PostDepreciationUseCase

CreateValuationUseCase
CreateDisposalUseCase
ApproveDisposalUseCase
CompleteDisposalUseCase

RetireAssetUseCase
ReportMissingAssetUseCase
ReportAssetDamageUseCase
```

---

# 23. Controller Design

Example endpoint structure:

```text
/api/v1/assets
```

### Asset

```http
POST   /assets
GET    /assets
GET    /assets/:assetNumber
PATCH  /assets/:assetNumber
DELETE /assets/:assetNumber
```

### Assignment

```http
POST /assets/:assetNumber/assign
POST /assets/:assetNumber/return
GET  /assets/:assetNumber/assignments
```

### Transfer

```http
POST /assets/:assetNumber/transfers
GET  /assets/:assetNumber/transfers
POST /asset-transfers/:transferNumber/approve
POST /asset-transfers/:transferNumber/receive
```

### Maintenance

```http
POST /assets/:assetNumber/maintenance
GET  /assets/:assetNumber/maintenance
POST /maintenance/:maintenanceNumber/complete
```

### Verification

```http
POST /asset-verifications
GET  /asset-verifications
POST /asset-verifications/:verificationNumber/items/:assetNumber/verify
POST /asset-verifications/:verificationNumber/complete
```

### Disposal

```http
POST /assets/:assetNumber/disposal
POST /asset-disposals/:disposalNumber/approve
POST /asset-disposals/:disposalNumber/complete
```

---

# 24. Organization/Tenant Isolation

Every asset-domain table should contain:

```text
organization_id
```

The value comes from the authenticated organization context.

Do not accept `organizationId` from the request body for normal tenant operations.

```text
@CurrentOrganization()
```

should provide the organization context.

---

# 25. Database Strategy

PostgreSQL is recommended for this module because of:

- Strong relational consistency
- JSONB support
- Full-text search
- Partial indexes
- Advanced constraints
- Transaction support
- Row-Level Security
- Good reporting capabilities

Use TypeORM if this module is implemented inside the existing TypeScript ERP services.

---

# 26. Important Database Constraints

### Unique asset number

```text
UNIQUE (organization_id, asset_number)
```

### Serial number

For serialized assets:

```text
UNIQUE (organization_id, serial_number)
```

with appropriate handling for nulls.

### Location hierarchy

```text
organization_id
parent_id
```

### Financial precision

Use PostgreSQL `numeric`, not floating-point values.

Example:

```text
numeric(19,4)
```

for monetary amounts where appropriate.

---

# 27. Indexing Strategy

Important indexes:

```text
organization_id
asset_number
serial_number
category_id
asset_class_id
status
condition
location_id
custodian_id
department_id
supplier_id
acquisition_date
warranty_end_date
next_maintenance_date
```

Composite indexes should be created around common tenant queries:

```text
(organization_id, status)
(organization_id, category_id)
(organization_id, location_id)
(organization_id, custodian_id)
```

---

# 28. Row-Level Security

For enterprise deployments, PostgreSQL RLS should enforce tenant isolation.

Conceptually:

```text
organization_id = current_setting('app.organization_id')
```

Application authorization still remains necessary.

RLS provides a second security boundary.

---

# 29. Transactions

The following operations should execute inside database transactions.

### Asset assignment

```text
Create assignment
↓
Update current asset state
↓
Create asset event
↓
Audit
```

### Transfer completion

```text
Validate transfer
↓
Update location
↓
Update custodian
↓
Close transfer
↓
Create event
↓
Audit
```

### Disposal

```text
Validate approval
↓
Update asset
↓
Create disposal record
↓
Create financial event
↓
Create lifecycle event
```

---

# 30. Concurrency

Asset operations are vulnerable to race conditions.

Example:

Two users try to assign the same laptop simultaneously.

Use:

- Optimistic locking
- Database constraints
- Transactions
- State validation

The asset should have a version field or equivalent concurrency mechanism.

---

# 31. Approval Engine Integration

Do not build a second approval system inside Asset Management.

Use the platform's central Approval Engine.

Example:

```text
Asset Disposal Request
        ↓
Approval Engine
        ↓
Policy Evaluation
        ↓
Approver(s)
        ↓
Approved
        ↓
Asset Disposal Use Case
```

Approval policies can depend on:

- Asset value
- Department
- Asset category
- Disposal method
- Branch
- Requester
- Organization policy

---

# 32. Event Architecture

Important domain events should be published.

Examples:

```text
asset.created
asset.assigned
asset.returned
asset.transferred
asset.maintenance.created
asset.maintenance.completed
asset.warranty.expiring
asset.verified
asset.missing
asset.retired
asset.disposed
asset.depreciation.posted
```

Kafka/Redpanda can be used where the platform requires durable cross-service events.

---

# 33. Queue Processing

BullMQ or an equivalent queue system can handle scheduled jobs.

Examples:

```text
asset-maintenance-reminder
asset-warranty-reminder
asset-insurance-reminder
asset-depreciation
asset-verification-reminder
asset-lease-expiry
asset-report-generation
```

Do not perform large depreciation calculations or bulk report generation synchronously inside HTTP requests.

---

# 34. Scheduled Jobs

Example daily process:

```text
00:00
 ↓
Find maintenance due
 ↓
Generate notifications

Find warranties expiring
 ↓
Generate notifications

Find insurance expiring
 ↓
Generate notifications

Find overdue verification
 ↓
Generate tasks
```

Monthly:

```text
Period Close
   ↓
Calculate depreciation
   ↓
Generate schedules
   ↓
Finance review
   ↓
Post
```

---

# 35. Notification Architecture

Asset Management should publish notification intents rather than directly depending on email/SMS providers.

```text
Asset Management
       ↓
Notification Event
       ↓
Notification Service
       ├── Email
       ├── SMS
       ├── Push
       └── WebSocket
```

This preserves module independence.

---

# 36. Audit Architecture

Critical asset mutations should produce immutable audit records.

Example:

```text
Asset:
AST-2026-00128

Field:
custodianId

Before:
Employee A

After:
Employee B

Actor:
Asset Manager

Reason:
Department transfer

Timestamp:
...
```

Audit records should not be deleted through normal application operations.

---

# 37. QR Code Architecture

Asset QR codes should encode a non-sensitive identifier.

Example:

```text
asset://AST-2026-00128
```

or an application URL.

Do **not** encode sensitive financial or employee information directly into the QR code.

---

# 38. API Security

All asset endpoints should enforce:

```text
Authentication
    ↓
Organization context
    ↓
Permission
    ↓
Resource scope
    ↓
Business rule
```

Example:

```text
Can user update asset?
        ↓
Has asset.update permission?
        ↓
Does asset belong to organization?
        ↓
Does user's scope permit this asset?
        ↓
Execute
```

---

# 39. Reporting Architecture

Simple reports can query PostgreSQL directly.

Complex analytics should eventually use an analytical layer.

Initial:

```text
PostgreSQL
    ↓
Reporting Queries
    ↓
Dashboard
```

Later:

```text
Operational DB
      ↓
Events
      ↓
Analytics Pipeline
      ↓
Data Warehouse
      ↓
BI / AI
```

---

# 40. Search

Start with PostgreSQL.

Use:

- B-tree indexes for identifiers
- `ILIKE` for simple search
- PostgreSQL full-text search for richer text queries

Avoid introducing Elasticsearch/OpenSearch purely for basic asset search.

Introduce a dedicated search engine only when scale or search requirements justify it.

---

# 41. File Storage

Asset documents should not be stored directly in PostgreSQL.

Use object storage:

```text
Asset
  ↓
Document Service
  ↓
Object Storage
```

Potential storage:

- S3
- MinIO
- compatible object storage

Database stores metadata:

```text
documentId
storageKey
fileName
mimeType
size
checksum
```

---

# 42. Observability

Track:

### Metrics

```text
assets_created_total
assets_assigned_total
assets_transferred_total
maintenance_created_total
maintenance_overdue_total
assets_missing_total
assets_disposed_total
verification_completion_rate
```

### Logs

Every critical lifecycle operation should have structured logs.

### Tracing

Distributed tracing should cover:

```text
Asset API
 ↓
Asset Service
 ↓
Approval
 ↓
Event Bus
 ↓
Notification
```

---

# 43. Testing Strategy

## Unit Tests

Test:

- Asset lifecycle rules
- Depreciation calculations
- Status transitions
- Transfer rules
- Disposal rules
- Maintenance scheduling
- Validation

## Integration Tests

Test:

- PostgreSQL repositories
- Transactions
- RLS
- Approval integration
- Event publishing

## API Tests

Use:

- Authentication
- Authorization
- Validation
- CRUD
- lifecycle endpoints

## E2E Tests

Example:

```text
Create asset
→ Assign
→ Transfer
→ Maintenance
→ Verify
→ Retire
→ Dispose
```

---

# 44. Critical Domain Invariants

These should be encoded into the domain/application layer.

### Invariant 1

A disposed asset cannot be assigned.

### Invariant 2

A retired asset cannot enter normal service without an approved reinstatement.

### Invariant 3

An asset can have only one active primary custodian.

### Invariant 4

An asset can have only one active location assignment.

### Invariant 5

A transfer cannot complete without receipt confirmation where two-step transfer is enabled.

### Invariant 6

A disposal cannot complete without required approval.

### Invariant 7

Depreciation cannot be posted twice for the same asset and accounting period.

### Invariant 8

Historical asset events cannot be modified through normal CRUD operations.

---

# 45. Recommended Folder Structure

```text
src/modules/asset-management/

├── asset/
│   ├── controllers/
│   ├── dto/
│   ├── entities/
│   ├── mappers/
│   ├── repositories/
│   ├── services/
│   └── use-cases/
│
├── category/
├── class/
├── location/
├── assignment/
├── transfer/
├── maintenance/
├── warranty/
├── insurance/
├── verification/
├── valuation/
├── depreciation/
├── disposal/
├── component/
├── document/
│
├── events/
├── jobs/
├── subscribers/
├── listeners/
└── reports/
```

---

# 46. Recommended Initial Database Tables

The first migration set should contain approximately:

```text
asset_categories
asset_classes
asset_locations
assets

asset_assignments
asset_transfers

asset_maintenances
asset_maintenance_schedules

asset_warranties
asset_insurances

asset_valuations
asset_depreciation_schedules

asset_verifications
asset_verification_items

asset_components
asset_bundles

asset_disposals
asset_events
```

Plus shared platform tables for:

```text
documents
audit_logs
approvals
notifications
users
organizations
departments
cost_centers
suppliers
```

where those already exist elsewhere in the platform.

---

# 47. MVP API Surface

The first implementation should not expose every future operation.

### Assets

```text
POST   /api/v1/assets
GET    /api/v1/assets
GET    /api/v1/assets/:assetNumber
PATCH  /api/v1/assets/:assetNumber
```

### Assignments

```text
POST /api/v1/assets/:assetNumber/assign
POST /api/v1/assets/:assetNumber/return
GET  /api/v1/assets/:assetNumber/assignments
```

### Transfers

```text
POST /api/v1/assets/:assetNumber/transfers
GET  /api/v1/assets/:assetNumber/transfers
POST /api/v1/asset-transfers/:transferNumber/approve
POST /api/v1/asset-transfers/:transferNumber/receive
```

### Maintenance

```text
POST /api/v1/assets/:assetNumber/maintenance
GET  /api/v1/assets/:assetNumber/maintenance
PATCH /api/v1/maintenance/:maintenanceNumber
```

### Verification

```text
POST /api/v1/asset-verifications
GET  /api/v1/asset-verifications
POST /api/v1/asset-verifications/:verificationNumber/verify
```

---

# 48. Implementation Phases

## Phase 1 — Foundation

Build:

```text
Asset
Category
Asset Class
Location
Assignment
Status
Condition
Audit
```

Deliverable:

> Fully functioning centralized Asset Register.

---

## Phase 2 — Operations

Build:

```text
Transfers
Maintenance
Warranty
Documents
Notifications
QR Codes
```

Deliverable:

> Operational asset lifecycle management.

---

## Phase 3 — Finance

Build:

```text
Capitalization
Depreciation
Valuation
Impairment
Disposal
Finance integration
```

Deliverable:

> Enterprise fixed-asset management.

---

## Phase 4 — Control

Build:

```text
Physical Verification
Insurance
Service Contracts
Budgeting
TCO
Replacement Planning
```

Deliverable:

> Full enterprise asset governance.

---

## Phase 5 — Intelligence

Build:

```text
Utilization Analytics
Predictive Maintenance
Replacement Recommendations
AI Document Extraction
Anomaly Detection
Natural Language Asset Search
```

Deliverable:

> Intelligent Asset Management.

---

# 49. Recommended Development Order

I would implement the actual code in this order:

```text
1. Asset Category
2. Asset Class
3. Asset Location
4. Asset
5. Asset Assignment
6. Asset Event
7. Asset Transfer
8. Maintenance
9. Warranty
10. Verification
11. Depreciation
12. Valuation
13. Disposal
14. Reports
15. Integrations
```

This order minimizes circular dependencies.

---

# 50. What Should Be Built Next

The next artifact should be the **actual implementation blueprint**, not another high-level product document.

I recommend producing these four technical artifacts in sequence:

### A. Database Design

Complete PostgreSQL/TypeORM design:

- Entities
- Columns
- Types
- Relations
- Constraints
- Indexes
- Enums
- RLS considerations
- Migrations

### B. Application/API Design

For every use case:

- Request DTO
- Response DTO
- Controller
- Use case
- Service
- Repository interface
- Repository implementation
- Mapper
- Validation
- Error handling

### C. Workflow/Event Design

Detailed:

- State machines
- Approval workflows
- Domain events
- Kafka/Redpanda topics
- BullMQ jobs
- Notifications
- Audit events

### D. Implementation Roadmap

A development-ready backlog containing:

```text
Epic
 ↓
Feature
 ↓
User Story
 ↓
Acceptance Criteria
 ↓
Technical Tasks
 ↓
Test Cases
```

That will take this from a **product specification** to a document an engineering team can directly use to start implementation.
