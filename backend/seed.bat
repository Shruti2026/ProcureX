@echo off
:: =============================================================
:: ProcureX -- Seed Helper Script (Batch version)
:: =============================================================
:: Usage: cd D:\Projects\ProcureX\backend && seed.bat
::
:: What this does:
::   1. Reads real user UUIDs and org_id from procurex_identity.users
::   2. Patches the SET @ block in seed-test-data.sql
::   3. Clears old seed data
::   4. Runs the updated seed
::   5. Prints a row-count summary
::
:: Requires: Docker Desktop running, procurex-mysql container healthy
:: =============================================================

setlocal enabledelayedexpansion

set CONTAINER=procurex-mysql
set MYSQL_USER=root
set MYSQL_PASS=root
set SCRIPT_DIR=%~dp0

:: Strip trailing backslash from SCRIPT_DIR
if "%SCRIPT_DIR:~-1%"=="\" set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

echo.
echo [1/4] Reading user UUIDs from procurex_identity.users...

:: Write the query to a temp file
set QUERY_FILE=%TEMP%\px_get_users.sql
(
    echo SELECT u.user_id, u.email, u.organization_id, r.role_name
    echo FROM procurex_identity.users u
    echo LEFT JOIN procurex_identity.roles r ON u.role_id = r.role_id
    echo ORDER BY r.role_name, u.email;
) > "%QUERY_FILE%"

docker cp "%QUERY_FILE%" %CONTAINER%:/px_get_users.sql >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Could not reach container %CONTAINER%. Is Docker running?
    exit /b 1
)

:: Run the query and capture output to a temp file
set RESULT_FILE=%TEMP%\px_users_result.txt
docker exec %CONTAINER% bash -c "mysql -u %MYSQL_USER% -p%MYSQL_PASS% 2>/dev/null < /px_get_users.sql" > "%RESULT_FILE%" 2>nul

if not exist "%RESULT_FILE%" (
    echo [ERROR] Query returned no output.
    exit /b 1
)

:: ---------------------------------------------------------------
:: Parse the result file to extract UUIDs by email
:: Each line is: user_id TAB email TAB org_id TAB role_name
:: ---------------------------------------------------------------
set ORG_ID=
set ADMIN_ID=00000000-0000-0000-0000-000000000001
set PM1_ID=00000000-0000-0000-0000-000000000002
set PM2_ID=00000000-0000-0000-0000-000000000002
set IM_ID=00000000-0000-0000-0000-000000000003
set FM_ID=00000000-0000-0000-0000-000000000004
set V1_USER_ID=00000000-0000-0000-0000-000000000011
set V2_USER_ID=00000000-0000-0000-0000-000000000012
set V3_USER_ID=00000000-0000-0000-0000-000000000013
set V4_USER_ID=00000000-0000-0000-0000-000000000014
set V5_USER_ID=00000000-0000-0000-0000-000000000015
set V6_USER_ID=00000000-0000-0000-0000-000000000016

for /f "usebackq tokens=1,2,3,4 delims=	" %%A in ("%RESULT_FILE%") do (
    set uid=%%A
    set email=%%B
    set org=%%C
    set role=%%D

    if "!uid!"=="user_id" goto :continue_loop

    if "!email!"=="admin@procurex.com"             set ADMIN_ID=!uid!
    if "!email!"=="sarah.procurement@procurex.com"  set PM1_ID=!uid!
    if "!email!"=="fyodor@procurex.com"             set PM2_ID=!uid!
    if "!email!"=="john.inventory@procurex.com"     set IM_ID=!uid!
    if "!email!"=="bruce.finance@procurex.com"      set FM_ID=!uid!
    if "!email!"=="sales@acmesupplier.com"          set V1_USER_ID=!uid!
    if "!email!"=="query@morisakibooks.com"         set V2_USER_ID=!uid!
    if "!email!"=="info@penguin.com"                set V3_USER_ID=!uid!
    if "!email!"=="finance@scale.com"               set V4_USER_ID=!uid!
    if "!email!"=="win@aibounty.com"                set V5_USER_ID=!uid!
    if "!email!"=="learn@courses.com"               set V6_USER_ID=!uid!

    :: Capture org_id from admin; fallback to first non-vendor non-header row
    if "!role!"=="ADMIN"                            set ORG_ID=!org!
    if "!ORG_ID!"=="" (
        if not "!role!"=="VENDOR" (
            if not "!role!"=="role_name" (
                if not "!org!"=="" (
                    if not "!org!"=="organization_id" set ORG_ID=!org!
                )
            )
        )
    )

    :continue_loop
)

if "!ORG_ID!"=="" (
    echo [ERROR] Could not determine org_id. Make sure users exist in the database.
    exit /b 1
)

echo   org_id  : !ORG_ID!
echo   ADMIN   : !ADMIN_ID!
echo   PM1     : !PM1_ID!
echo   PM2     : !PM2_ID!
echo   IM      : !IM_ID!
echo   FM      : !FM_ID!
echo   V1      : !V1_USER_ID!
echo   V2      : !V2_USER_ID!
echo   V3      : !V3_USER_ID!
echo   V4      : !V4_USER_ID!
echo   V5      : !V5_USER_ID!
echo   V6      : !V6_USER_ID!

:: ---------------------------------------------------------------
:: STEP 2 -- Patch seed-test-data.sql using PowerShell regex
:: (batch has no built-in regex; we shell out to PowerShell for this)
:: ---------------------------------------------------------------
echo.
echo [2/4] Patching seed-test-data.sql with real UUIDs...

set SEED_FILE=%SCRIPT_DIR%\seed-test-data.sql

powershell -NoProfile -Command ^
  "$f='%SEED_FILE%';" ^
  "$c=Get-Content $f -Raw;" ^
  "$c=$c -replace '(?m)^SET @ORG_ID\s+=\s+''[^'']+'';','SET @ORG_ID          = ''!ORG_ID!'';';" ^
  "$c=$c -replace '(?m)^SET @ADMIN_ID\s+=\s+''[^'']+''[^\n]*','SET @ADMIN_ID        = ''!ADMIN_ID!''; -- admin@procurex.com';" ^
  "$c=$c -replace '(?m)^SET @PM_ALICE_ID\s+=\s+''[^'']+''[^\n]*','SET @PM_ALICE_ID     = ''!PM1_ID!''; -- sarah.procurement@procurex.com';" ^
  "$c=$c -replace '(?m)^SET @PM_BOB_ID\s+=\s+''[^'']+''[^\n]*','SET @PM_BOB_ID       = ''!PM2_ID!''; -- fyodor@procurex.com';" ^
  "$c=$c -replace '(?m)^SET @PM_CAROL_ID\s+=\s+''[^'']+''[^\n]*','SET @PM_CAROL_ID     = ''!PM1_ID!''; -- sarah.procurement@procurex.com (reused)';" ^
  "$c=$c -replace '(?m)^SET @IM_DAN_ID\s+=\s+''[^'']+''[^\n]*','SET @IM_DAN_ID       = ''!IM_ID!''; -- john.inventory@procurex.com';" ^
  "$c=$c -replace '(?m)^SET @IM_EVE_ID\s+=\s+''[^'']+''[^\n]*','SET @IM_EVE_ID       = ''!IM_ID!''; -- john.inventory@procurex.com (reused)';" ^
  "$c=$c -replace '(?m)^SET @FM_FRANK_ID\s+=\s+''[^'']+''[^\n]*','SET @FM_FRANK_ID     = ''!FM_ID!''; -- bruce.finance@procurex.com';" ^
  "$c=$c -replace '(?m)^SET @FM_GRACE_ID\s+=\s+''[^'']+''[^\n]*','SET @FM_GRACE_ID     = ''!FM_ID!''; -- bruce.finance@procurex.com (reused)';" ^
  "$c=$c -replace '(?m)^SET @V1_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V1_USER_ID      = ''!V1_USER_ID!''; -- sales@acmesupplier.com';" ^
  "$c=$c -replace '(?m)^SET @V2_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V2_USER_ID      = ''!V2_USER_ID!''; -- query@morisakibooks.com';" ^
  "$c=$c -replace '(?m)^SET @V3_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V3_USER_ID      = ''!V3_USER_ID!''; -- info@penguin.com';" ^
  "$c=$c -replace '(?m)^SET @V4_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V4_USER_ID      = ''!V4_USER_ID!''; -- finance@scale.com';" ^
  "$c=$c -replace '(?m)^SET @V5_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V5_USER_ID      = ''!V5_USER_ID!''; -- win@aibounty.com';" ^
  "$c=$c -replace '(?m)^SET @V6_USER_ID\s+=\s+''[^'']+''[^\n]*','SET @V6_USER_ID      = ''!V6_USER_ID!''; -- learn@courses.com';" ^
  "Set-Content $f $c -NoNewline;"

if %ERRORLEVEL% neq 0 (
    echo [ERROR] Patching failed.
    exit /b 1
)
echo   seed-test-data.sql patched.

:: ---------------------------------------------------------------
:: STEP 3 -- Clear old seed data
:: ---------------------------------------------------------------
echo.
echo [3/4] Clearing old seed data...
docker cp "%SCRIPT_DIR%\clear-seed-data.sql" %CONTAINER%:/clear-seed-data.sql >nul
docker exec %CONTAINER% bash -c "mysql -u %MYSQL_USER% -p%MYSQL_PASS% 2>/dev/null < /clear-seed-data.sql" >nul
echo   Done.

:: ---------------------------------------------------------------
:: STEP 4 -- Run the seed
:: ---------------------------------------------------------------
echo.
echo [4/4] Running seed-test-data.sql...
docker cp "%SEED_FILE%" %CONTAINER%:/seed-test-data.sql >nul
docker exec %CONTAINER% bash -c "mysql -u %MYSQL_USER% -p%MYSQL_PASS% 2>/dev/null < /seed-test-data.sql && echo SUCCESS || echo FAILED" > "%TEMP%\px_seed_result.txt" 2>nul

findstr /i "SUCCESS" "%TEMP%\px_seed_result.txt" >nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Seed failed. Run manually for details:
    echo   docker exec %CONTAINER% bash -c "mysql -u %MYSQL_USER% -p%MYSQL_PASS% ^< /seed-test-data.sql"
    exit /b 1
)
echo   Seed completed successfully.

:: ---------------------------------------------------------------
:: Summary
:: ---------------------------------------------------------------
echo.
echo --- Row count summary ---
docker cp "%SCRIPT_DIR%\verify-seed.sql" %CONTAINER%:/verify-seed.sql >nul
docker exec %CONTAINER% bash -c "mysql -u %MYSQL_USER% -p%MYSQL_PASS% < /verify-seed.sql 2>/dev/null"

echo.
echo Done. Open the app and refresh.

endlocal
