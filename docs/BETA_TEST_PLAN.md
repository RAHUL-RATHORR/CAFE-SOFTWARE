# BETA TEST PLAN

## Test Environment
- **Frontend/Backend**: Vercel/Next.js (Staging Environment)
- **Database**: MongoDB Atlas (Beta/Staging Cluster)
- **Storage**: Temporary Local / S3 (Beta Bucket)
- **Notification Providers**: Mock/Sandbox keys for SMS, Email, and WhatsApp to avoid accidental production sends.

## Test Accounts
Do NOT use real production credentials. Test accounts should be created with the following roles:
- `SUPER_ADMIN`
- `RESTAURANT_OWNER` (Tenant A and Tenant B)
- `MANAGER`
- `STAFF`
- `CASHIER`
- `KITCHEN`

## Test Scenarios
### 1. Multi-Tenant Isolation
Verify that Restaurant Owner A cannot access Restaurant B's branches, tables, orders, invoices, or inventory.
### 2. QR Ordering (Public)
Verify that public QR codes can place orders safely but cannot access internal restaurant statistics or staff data.
### 3. POS & Billing workflows
Perform full checkout, split payments, refunds, and void checks.
### 4. Kitchen Display System (KDS)
Confirm real-time WebSockets sync between POS orders and KDS updates.
### 5. Inventory Consumption
Place orders and verify recipe components strictly deduct stock from the specific branch's inventory in an atomic operation.
### 6. Daily Closing
Verify cash reconciliation accurately sums up shift totals and locks historical invoice data.

## Expected Results
- No data bleeds between distinct tenants or branches.
- Real-time updates execute without duplicate events.
- All financial reconciliation metrics strictly match raw database queries.
- Unauthorized access returns standard 401/403 responses instead of sensitive internal error logs.

## Bug Severity Matrix
- **P0 — Critical**: Data leaks, cross-tenant access, unauthorized authentication bypass.
- **P1 — High**: Broken checkout, failure to record payments, incorrect tax calculation.
- **P2 — Medium**: Performance slowdowns, layout bugs on major devices.
- **P3 — Low**: Cosmetic alignment issues, non-critical typography updates.
