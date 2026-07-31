@echo off
echo ============================================
echo  ProcureX Backend - Development Mode
echo ============================================
echo.
echo Select an option:
echo  1 - Start via Docker (docker-compose up)
echo  2 - Start locally (mvn spring-boot:run in separate windows)
echo  3 - Start via Docker in dev mode (with hot-reload)
echo.
set /p choice="Enter choice (1/2/3): "

if "%choice%"=="1" (
    echo Starting all services via Docker...
    docker-compose up -d
    goto :end
)

if "%choice%"=="3" (
    echo Starting all services via Docker in DEV mode (hot-reload enabled)...
    echo Source code changes will trigger recompilation inside containers.
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
    goto :end
)

if "%choice%"=="2" (
    echo Starting all services locally...
    goto :local
)

echo Invalid choice. Starting locally by default...
:local

start cmd /k "cd eureka-server && mvn spring-boot:run"

timeout /t 20

start cmd /k "cd api-gateway && mvn spring-boot:run"

start cmd /k "cd identity-service && mvn spring-boot:run"

start cmd /k "cd procurement-service && mvn spring-boot:run"

start cmd /k "cd inventory-service && mvn spring-boot:run"

start cmd /k "cd vendor-catalog-service && mvn spring-boot:run"

start cmd /k "cd notification-service && mvn spring-boot:run"

start cmd /k "cd finance-service && mvn spring-boot:run"

start cmd /k "cd analytics-service && mvn spring-boot:run"

:end
echo.
echo Done!