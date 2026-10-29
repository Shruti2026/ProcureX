# =============================================================
# ProcureX — Seed Helper Script
# =============================================================
# Usage: cd D:\Projects\ProcureX\backend && .\seed.ps1
#
# What this does:
#   1. Reads real user UUIDs and org_id from procurex_identity.users
#   2. Patches the SET @ block in seed-test-data.sql
#   3. Clears old seed data (wrong org_id rows)
#   4. Runs the updated seed
#   5. Prints a row-count summary
# =============================================================

$CONTAINER  = "procurex-mysql"
$MYSQL_USER = "root"
$MYSQL_PASS = "root"
$SCRIPT_DIR = $PSScriptRoot

# ------------------------------------------------------------------
# STEP 1 — Read real UUIDs from the database
# ------------------------------------------------------------------
Write-Host "`n[1/4] Reading user UUIDs from procurex_identity.users..." -ForegroundColor Cyan

$queryFile = Join-Path $env:TEMP "px_get_users.sql"
@"
SELECT u.user_id, u.email, u.organization_id, r.role_name
FROM procurex_identity.users u
LEFT JOIN procurex_identity.roles r ON u.role_id = r.role_id
ORDER BY r.role_name, u.email;
"@ | Set-Content $queryFile

docker cp $queryFile "${CONTAINER}:/px_get_users.sql" | Out-Null
$raw = docker exec $CONTAINER bash -c "mysql -u $MYSQL_USER -p$MYSQL_PASS 2>/dev/null < /px_get_users.sql"

if (-not $raw) {
    Write-Host "[ERROR] Could not query users. Is the MySQL container running?" -ForegroundColor Red
    exit 1
}

# Parse tab-separated output into a hashtable: email -> user_id
$users = @{}
$orgId = $null

foreach ($line in ($raw -split "`n")) {
    $parts = $line -split "`t"
    if ($parts.Count -lt 4) { continue }
    $uid   = $parts[0].Trim()
    $email = $parts[1].Trim()
    $org   = $parts[2].Trim()
    $role  = $parts[3].Trim()
    if ($uid -eq "user_id" -or $uid -eq "") { continue }
    $users[$email] = $uid
    if ($role -eq "ADMIN" -and -not $orgId) { $orgId = $org }
}

if (-not $orgId) {
    # Fallback: use org_id from any non-vendor internal user
    foreach ($line in ($raw -split "`n")) {
        $parts = $line -split "`t"
        if ($parts.Count -lt 4) { continue }
        $role = $parts[3].Trim()
        $org  = $parts[2].Trim()
        if ($role -ne "VENDOR" -and $role -ne "role_name" -and $org -ne "" -and $org -ne "organization_id") {
            $orgId = $org; break
        }
    }
}

Write-Host "  org_id     : $orgId"
Write-Host "  Users found: $($users.Count)"
$users.GetEnumerator() | Sort-Object Key | ForEach-Object { Write-Host "    $($_.Key) => $($_.Value)" }

# Map emails to variables (inline if/else — no function needed)
$ADMIN_ID   = if ($users["admin@procurex.com"])             { $users["admin@procurex.com"]             } else { "00000000-0000-0000-0000-000000000001" }
$PM1_ID     = if ($users["sarah.procurement@procurex.com"]) { $users["sarah.procurement@procurex.com"] } else { "00000000-0000-0000-0000-000000000002" }
$PM2_ID     = if ($users["fyodor@procurex.com"])            { $users["fyodor@procurex.com"]            } else { $PM1_ID }
$IM_ID      = if ($users["john.inventory@procurex.com"])    { $users["john.inventory@procurex.com"]    } else { "00000000-0000-0000-0000-000000000003" }
$FM_ID      = if ($users["bruce.finance@procurex.com"])     { $users["bruce.finance@procurex.com"]     } else { "00000000-0000-0000-0000-000000000004" }
$V1_USER_ID = if ($users["sales@acmesupplier.com"])         { $users["sales@acmesupplier.com"]         } else { "00000000-0000-0000-0000-000000000011" }
$V2_USER_ID = if ($users["query@morisakibooks.com"])        { $users["query@morisakibooks.com"]        } else { "00000000-0000-0000-0000-000000000012" }
$V3_USER_ID = if ($users["info@penguin.com"])               { $users["info@penguin.com"]               } else { "00000000-0000-0000-0000-000000000013" }
$V4_USER_ID = if ($users["finance@scale.com"])              { $users["finance@scale.com"]              } else { "00000000-0000-0000-0000-000000000014" }
$V5_USER_ID = if ($users["win@aibounty.com"])               { $users["win@aibounty.com"]               } else { "00000000-0000-0000-0000-000000000015" }
$V6_USER_ID = if ($users["learn@courses.com"])              { $users["learn@courses.com"]              } else { "00000000-0000-0000-0000-000000000016" }

# ------------------------------------------------------------------
# STEP 2 — Patch the SET block in seed-test-data.sql
# ------------------------------------------------------------------
Write-Host "`n[2/4] Patching seed-test-data.sql with real UUIDs..." -ForegroundColor Cyan

$seedFile    = Join-Path $SCRIPT_DIR "seed-test-data.sql"
$seedContent = Get-Content $seedFile -Raw

$seedContent = $seedContent -replace "(?m)^SET @ORG_ID\s+=\s+'[^']+';",          "SET @ORG_ID          = '$orgId';"
$seedContent = $seedContent -replace "(?m)^SET @ADMIN_ID\s+=\s+'[^']+'[^\n]*",   "SET @ADMIN_ID        = '$ADMIN_ID'; -- admin@procurex.com"
$seedContent = $seedContent -replace "(?m)^SET @PM_ALICE_ID\s+=\s+'[^']+'[^\n]*","SET @PM_ALICE_ID     = '$PM1_ID'; -- sarah.procurement@procurex.com"
$seedContent = $seedContent -replace "(?m)^SET @PM_BOB_ID\s+=\s+'[^']+'[^\n]*",  "SET @PM_BOB_ID       = '$PM2_ID'; -- fyodor@procurex.com"
$seedContent = $seedContent -replace "(?m)^SET @PM_CAROL_ID\s+=\s+'[^']+'[^\n]*","SET @PM_CAROL_ID     = '$PM1_ID'; -- sarah.procurement@procurex.com (reused)"
$seedContent = $seedContent -replace "(?m)^SET @IM_DAN_ID\s+=\s+'[^']+'[^\n]*",  "SET @IM_DAN_ID       = '$IM_ID'; -- john.inventory@procurex.com"
$seedContent = $seedContent -replace "(?m)^SET @IM_EVE_ID\s+=\s+'[^']+'[^\n]*",  "SET @IM_EVE_ID       = '$IM_ID'; -- john.inventory@procurex.com (reused)"
$seedContent = $seedContent -replace "(?m)^SET @FM_FRANK_ID\s+=\s+'[^']+'[^\n]*","SET @FM_FRANK_ID     = '$FM_ID'; -- bruce.finance@procurex.com"
$seedContent = $seedContent -replace "(?m)^SET @FM_GRACE_ID\s+=\s+'[^']+'[^\n]*","SET @FM_GRACE_ID     = '$FM_ID'; -- bruce.finance@procurex.com (reused)"
$seedContent = $seedContent -replace "(?m)^SET @V1_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V1_USER_ID      = '$V1_USER_ID'; -- sales@acmesupplier.com"
$seedContent = $seedContent -replace "(?m)^SET @V2_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V2_USER_ID      = '$V2_USER_ID'; -- query@morisakibooks.com"
$seedContent = $seedContent -replace "(?m)^SET @V3_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V3_USER_ID      = '$V3_USER_ID'; -- info@penguin.com"
$seedContent = $seedContent -replace "(?m)^SET @V4_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V4_USER_ID      = '$V4_USER_ID'; -- finance@scale.com"
$seedContent = $seedContent -replace "(?m)^SET @V5_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V5_USER_ID      = '$V5_USER_ID'; -- win@aibounty.com"
$seedContent = $seedContent -replace "(?m)^SET @V6_USER_ID\s+=\s+'[^']+'[^\n]*", "SET @V6_USER_ID      = '$V6_USER_ID'; -- learn@courses.com"

Set-Content $seedFile $seedContent -NoNewline
Write-Host "  seed-test-data.sql patched."

# ------------------------------------------------------------------
# STEP 3 — Clear old seed data
# ------------------------------------------------------------------
Write-Host "`n[3/4] Clearing old seed data..." -ForegroundColor Cyan
$clearFile = Join-Path $SCRIPT_DIR "clear-seed-data.sql"
docker cp $clearFile "${CONTAINER}:/clear-seed-data.sql" | Out-Null
docker exec $CONTAINER bash -c "mysql -u $MYSQL_USER -p$MYSQL_PASS 2>/dev/null < /clear-seed-data.sql" | Out-Null
Write-Host "  Done."

# ------------------------------------------------------------------
# STEP 4 — Run the seed
# ------------------------------------------------------------------
Write-Host "`n[4/4] Running seed-test-data.sql..." -ForegroundColor Cyan
docker cp $seedFile "${CONTAINER}:/seed-test-data.sql" | Out-Null
$seedResult = docker exec $CONTAINER bash -c "mysql -u $MYSQL_USER -p$MYSQL_PASS 2>/dev/null < /seed-test-data.sql && echo SUCCESS || echo FAILED"

if ($seedResult -match "SUCCESS") {
    Write-Host "  Seed completed successfully." -ForegroundColor Green
} else {
    Write-Host "  [ERROR] Seed failed. Run manually for details:" -ForegroundColor Red
    Write-Host "  docker exec $CONTAINER bash -c `"mysql -u $MYSQL_USER -p$MYSQL_PASS < /seed-test-data.sql 2>&1`""
    exit 1
}

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
Write-Host "`n--- Row count summary ---" -ForegroundColor Cyan
$verifyFile = Join-Path $SCRIPT_DIR "verify-seed.sql"
docker cp $verifyFile "${CONTAINER}:/verify-seed.sql" | Out-Null
$summary = docker exec $CONTAINER bash -c "mysql -u $MYSQL_USER -p$MYSQL_PASS < /verify-seed.sql 2>/dev/null"
($summary -split "`n") | Where-Object { $_ -ne "" } | ForEach-Object { Write-Host "  $_" }

Write-Host "`nDone. Open the app and refresh." -ForegroundColor Green
