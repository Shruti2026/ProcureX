# ProcureX Backend Startup Script (Windows PowerShell)
Write-Host "=== Starting ProcureX Backend Services ===" -ForegroundColor Cyan

# Note: This script requires multiple terminals, so you'll need to run each command in separate windows
Write-Host "Please run the following commands in separate PowerShell terminals:" -ForegroundColor Yellow
Write-Host ""

Write-Host "1. Eureka Server (port 8761):" -ForegroundColor Green
Write-Host "   cd backend/eureka-server; mvn spring-boot:run"
Write-Host ""

Write-Host "2. API Gateway (port 8080):" -ForegroundColor Green
Write-Host "   cd backend/api-gateway; mvn spring-boot:run"
Write-Host ""

Write-Host "3. Identity Service (port 8081):" -ForegroundColor Green
Write-Host "   cd backend/identity-service; mvn spring-boot:run"
Write-Host ""

Write-Host "4. Vendor Catalog Service (port 8082):" -ForegroundColor Green
Write-Host "   cd backend/vendor-catalog-service; mvn spring-boot:run"
Write-Host ""

Write-Host "5. Procurement Service (port 8083):" -ForegroundColor Green
Write-Host "   cd backend/procurement-service; mvn spring-boot:run"
Write-Host ""

Write-Host "6. Inventory Service (port 8084):" -ForegroundColor Green
Write-Host "   cd backend/inventory-service; mvn spring-boot:run"
Write-Host ""

Write-Host "7. Finance Service (port 8085):" -ForegroundColor Green
Write-Host "   cd backend/finance-service; mvn spring-boot:run"
Write-Host ""

Write-Host "8. Notification Service (port 8086):" -ForegroundColor Green
Write-Host "   cd backend/notification-service; mvn spring-boot:run"
Write-Host ""

Write-Host "9. Analytics Service (port 8087):" -ForegroundColor Green
Write-Host "   cd backend/analytics-service; mvn spring-boot:run"
Write-Host ""
