@echo off

start cmd /k "cd eureka-server && mvn spring-boot:run"

timeout /t 8

start cmd /k "cd api-gateway && mvn spring-boot:run"

start cmd /k "cd identity-service && mvn spring-boot:run"

start cmd /k "cd procurement-service && mvn spring-boot:run"

start cmd /k "cd inventory-service && mvn spring-boot:run"

start cmd /k "cd vendor-catalog-service && mvn spring-boot:run"

start cmd /k "cd notification-service && mvn spring-boot:run"

start cmd /k "cd finance-service && mvn spring-boot:run"

start cmd /k "cd analytics-service && mvn spring-boot:run"