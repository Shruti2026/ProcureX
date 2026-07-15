Write-Host "=== Starting ProcureX Backend Services ===" -ForegroundColor Cyan

$root = "C:\Users\DELL\Desktop\Projects\ProcureX\backend"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\eureka-server'; mvn spring-boot:run"

Start-Sleep -Seconds 10

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\api-gateway'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\identity-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\vendor-catalog-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\procurement-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\inventory-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\finance-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\notification-service'; mvn spring-boot:run"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\analytics-service'; mvn spring-boot:run"