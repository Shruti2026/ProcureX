# ProcureX — Test Data Guide

## Seed Files

| File | Purpose |
|---|---|
| `backend/seed.ps1` | **PowerShell** — reads UUIDs from DB, patches the SQL, clears old data, runs the seed |
| `backend/seed.bat` | **Command Prompt / batch** — same as above, for non-PowerShell terminals |
| `backend/seed-test-data.sql` | The seed SQL — all test data across all 7 databases |
| `backend/clear-seed-data.sql` | Clears previously seeded data (safe — only deletes seed rows by ID) |
| `backend/verify-seed.sql` | Verification query — row counts for all seeded tables |

---

## Pre-requisites

1. All services are running and healthy (Flyway has created all tables).
2. Users have been created via the APIs — see [Users.md](./Users.md) for credentials.

Verify containers:
```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```
All `procurex-*` containers should show `(healthy)`.

---

## How to Run (New Machine)

On a new machine, user UUIDs and org_id will be different every time. Use one of the helper scripts — they do everything automatically:

**PowerShell:**
```powershell
cd D:\Projects\ProcureX\backend
.\seed.ps1
```

**Command Prompt:**
```bat
cd D:\Projects\ProcureX\backend
seed.bat
```

What both scripts do:
1. Query `procurex_identity.users` for real UUIDs and org_id
2. Patch the `SET @...` block in `seed-test-data.sql` with those values
3. Run `clear-seed-data.sql` to remove any stale seed rows
4. Run `seed-test-data.sql` to insert fresh data
5. Print a row-count summary

---

## How to Run Manually

If you prefer to run it yourself after updating UUIDs manually:

```powershell
# 1. Clear old seed data
docker cp "D:\Projects\ProcureX\backend\clear-seed-data.sql" procurex-mysql:/clear-seed-data.sql
docker exec procurex-mysql bash -c "mysql -u root -proot 2>/dev/null < /clear-seed-data.sql"

# 2. Run the seed
docker cp "D:\Projects\ProcureX\backend\seed-test-data.sql" procurex-mysql:/seed-test-data.sql
docker exec procurex-mysql bash -c "mysql -u root -proot 2>/dev/null < /seed-test-data.sql && echo SUCCESS || echo FAILED"
```

---

## Verify the Data Loaded

```powershell
docker cp "D:\Projects\ProcureX\backend\verify-seed.sql" procurex-mysql:/verify-seed.sql
docker exec procurex-mysql bash -c "mysql -u root -proot < /verify-seed.sql 2>/dev/null"
```

Expected output:

| Table | Count |
|---|---|
| vendors | 6+ |
| vendor_products | 25 |
| contracts | 5 |
| purchase_requisitions | 5+ |
| rfqs | 3 |
| quotations | 3 |
| purchase_orders | 5 |
| warehouses | 2 |
| goods_receipt_notes | 2 |
| quality_inspections | 2 |
| budgets | 5 |
| invoices | 2 |
| payments | 1 |
| notification_preferences | 10+ |
| notifications | 8 |
| vendor_rating_cards | 5 |

---

## What Is Seeded

### Databases and coverage

| Database | What's seeded |
|---|---|
| `procurex_identity` | Audit log entries (admin creating employees, approving vendors) |
| `procurex_vendor` | 6 vendors (5 ACTIVE, 1 INACTIVE), 25 vendor-product mappings, 5 contracts |
| `procurex_procurement` | 5 PRs, 3 RFQs with vendor invitations, 3 quotations, 5 POs across all status stages with full history |
| `procurex_inventory` | 2 warehouses, 10 inventory records, 2 GRNs, 2 quality inspections, 9 stock transactions |
| `procurex_finance` | 5 department budgets, 2 invoices with items and history, 1 completed payment |
| `procurex_notification` | Notification preferences per user, 8 in-app notifications |
| `procurex_analytics` | 5 vendor rating cards with realistic scores |

### Full lifecycle covered

```
PR-1 → RFQ-1 → Quotations (Acme Industrial wins, Learning Academy rejected)
     → PO-1 (COMPLETED) → GRN-1 (CLOSED) → Inspection (PASSED)
     → Invoice-1 (APPROVED) → Payment (COMPLETED via WIRE)
```

The remaining POs cover every other status so all UI badges have data:

| PO | Vendor | Status |
|---|---|---|
| PO-2026-00001 | Acme Industrial Supplies | COMPLETED |
| PO-2026-00002 | MoriSaki Bookshop | DELIVERED |
| PO-2026-00003 | Scalin | APPROVED |
| PO-2026-00004 | Penguin House India | ACCEPTED |
| PO-2026-00005 | Learning Academy | CREATED |

### Vendors

| Company | Email | Status |
|---|---|---|
| Acme Industrial Supplies | sales@acmesupplier.com | ACTIVE |
| MoriSaki Bookshop | query@morisakibooks.com | ACTIVE |
| Penguin House India | info@penguin.com | ACTIVE |
| Scalin | finance@scale.com | ACTIVE |
| AI Bounty Corp | win@aibounty.com | INACTIVE |
| Learning Academy | learn@courses.com | ACTIVE |

---

## Important: Organization ID

All seed data is scoped to the `organization_id` of your real admin user. The `seed.ps1` script reads this automatically. If you run `seed-test-data.sql` manually, make sure the `SET @ORG_ID` value at the top of the file matches the org_id in your `procurex_identity.users` table:

```sql
SELECT user_id, email, organization_id FROM procurex_identity.users;
```

A mismatch means all seeded procurement/finance/inventory data will be invisible in the UI (queries filter strictly by org_id from the JWT).

---

## Bugs Fixed During Setup

### 1. `finance-service` and `notification-service` — Flyway never ran

**Root cause:** Both services had `flyway-core` in `pom.xml` instead of `spring-boot-starter-flyway`. Without the starter, Spring Boot's Flyway autoconfiguration never activates.

**Fix:** Replaced `flyway-core` with `spring-boot-starter-flyway`.

Files: `backend/finance-service/pom.xml`, `backend/notification-service/pom.xml`

### 2. Missing `baseline-version: 0` in finance and notification

**Root cause:** Without it, Flyway defaults to baselining at version `1`, marking V1 as already applied — so the migration that creates the tables never runs.

**Fix:** Added `baseline-version: 0` to both `application.yml` files.

Files: `backend/finance-service/src/main/resources/application.yml`, `backend/notification-service/src/main/resources/application.yml`
