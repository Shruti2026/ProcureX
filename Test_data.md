# ProcureX — Test Data Guide

## Seed File

**Location:** `backend/seed-test-data.sql`

Run this once after all services are up to populate all 7 databases with realistic test data covering the full procurement lifecycle.

---

## Pre-requisites

Before running the seed, all services must be running and healthy so Flyway has created all tables. Verify with:

```powershell
docker ps --format "table {{.Names}}\t{{.Status}}"
```

All `procurex-*` containers should show `(healthy)`.

---

## How to Run

MySQL runs inside Docker (`procurex-mysql` container). The only reliable way to run the seed from Windows PowerShell is to copy the file into the container first, then execute it:

```powershell
# 1. Copy the file into the container
docker cp "D:\Projects\ProcureX\backend\seed-test-data.sql" procurex-mysql:/seed-test-data.sql

# 2. Execute it
docker exec procurex-mysql bash -c "mysql -u root -proot 2>/dev/null < /seed-test-data.sql && echo SUCCESS || echo FAILED"
```

The script uses `INSERT IGNORE` throughout — safe to re-run on a machine that already has data, duplicates are silently skipped.

> **Note:** Do NOT use `mysql -u root -p < file.sql` in PowerShell — the `<` operator is not supported for redirection in PowerShell. Always use the `docker cp` + `docker exec` approach above.

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
| notification_preferences | 13 |
| notifications | 8 |
| vendor_rating_cards | 5 |

---

## What Is Seeded

### Databases and coverage

| Database | What's seeded |
|---|---|
| `procurex_identity` | 8 audit log entries (admin approving vendors, creating employees) |
| `procurex_vendor` | 6 vendors (5 ACTIVE, 1 INACTIVE), 25 vendor-product mappings, 5 contracts |
| `procurex_procurement` | 5 PRs, 3 RFQs with vendor invitations, 3 quotations, 5 POs across all status stages with full history |
| `procurex_inventory` | 2 warehouses, 10 inventory records, 2 GRNs, 2 quality inspections, 9 stock transactions |
| `procurex_finance` | 5 department budgets, 2 invoices with items and history, 1 completed payment |
| `procurex_notification` | 13 notification preferences, 8 in-app notifications |
| `procurex_analytics` | 5 vendor rating cards with realistic scores |

### Full lifecycle covered

```
PR-1 → RFQ-1 → Quotations (TechSupply wins, PrintMaster rejected)
     → PO-1 (COMPLETED) → GRN-1 (CLOSED) → Inspection (PASSED)
     → Invoice-1 (APPROVED) → Payment (COMPLETED)
```

The remaining POs cover every other status so all UI badges have data:

| PO | Vendor | Status |
|---|---|---|
| PO-2026-00001 | TechSupply Co. | COMPLETED |
| PO-2026-00002 | OfficeWorld Pvt. Ltd. | DELIVERED |
| PO-2026-00003 | CleanPro Supplies | APPROVED |
| PO-2026-00004 | FurniturePlus India | ACCEPTED |
| PO-2026-00005 | PrintMaster Solutions | CREATED |

### Vendors

| Company | Status | Categories |
|---|---|---|
| TechSupply Co. | ACTIVE | IT Equipment, Printing |
| OfficeWorld Pvt. Ltd. | ACTIVE | Office Supplies, Pantry |
| FurniturePlus India | ACTIVE | Furniture |
| CleanPro Supplies | ACTIVE | Cleaning, Safety |
| SafeGuard Equipment | INACTIVE | Safety |
| PrintMaster Solutions | ACTIVE | Printing, IT Equipment |

---

## Optional: Use Real User UUIDs

The seed ships with placeholder UUIDs for all users (`aaaaaaaa-...`, `bbbbbbbb-...`, `cccccccc-...`). This is fine for testing — the app will work but "created by" fields will show unknown users.

To use real UUIDs after creating users via the API:

1. Get your user IDs:
   ```sql
   -- Run inside the container or via any MySQL client
   SELECT user_id, email FROM procurex_identity.users;
   ```
2. Open `backend/seed-test-data.sql` and update the `SET @...` block at the top of the file with your real UUIDs.
3. Re-run the seed using the `docker cp` + `docker exec` commands above.

---

## Bugs Fixed During Setup

These were discovered during the seed setup process and are now fixed in the codebase:

### 1. `finance-service` and `notification-service` — Flyway never ran

**Root cause:** Both services had `flyway-core` in `pom.xml` instead of `spring-boot-starter-flyway`. Without the starter, Spring Boot's Flyway autoconfiguration never activates regardless of `application.yml` settings.

**Fix:** Replaced `flyway-core` with `spring-boot-starter-flyway` in both `pom.xml` files.

Files changed:
- `backend/finance-service/pom.xml`
- `backend/notification-service/pom.xml`

### 2. Missing `baseline-version: 0` in finance and notification

**Root cause:** Without `baseline-version: 0`, Flyway defaults to baselining at version `1`, which marks V1 as "already applied" on a fresh database — so the actual V1 migration that creates the tables never runs.

**Fix:** Added `baseline-version: 0` to both `application.yml` files.

Files changed:
- `backend/finance-service/src/main/resources/application.yml`
- `backend/notification-service/src/main/resources/application.yml`

---

## Files Added

| File | Purpose |
|---|---|
| `backend/seed-test-data.sql` | Main seed script — inserts all test data across all 7 databases |
| `backend/verify-seed.sql` | Verification query — shows row counts for all seeded tables |
