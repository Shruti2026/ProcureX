# ProcureX

A modern procurement management system built with microservices architecture. Designed to streamline the procurement process, enhance vendor management, and provide analytics for better decision-making.

## 🛠️ Tech Stack

### Backend
- **Java 21**
- **Spring Boot 4.1.0**
- **Spring Cloud 2026.0.0** (Eureka Server, API Gateway, OpenFeign)
- **Spring Data JPA** with Hibernate
- **MySQL** (Database)
- **Flyway** (Database Migrations)
- **Spring Security** with JWT
- **RabbitMQ** (Event Streaming)
- **Swagger/OpenAPI** (API Docs)

### Frontend
- **React.js**
- **Vite**
- **Tailwind CSS**
- **React Router**
- **Axios**
- **React Hook Form**
- **Recharts**
- **Lucide React** (Icons)

## 📁 Project Structure

```
ProcureX/
├── frontend/                     # React.js frontend application
├── backend/                      # Spring Boot microservices
│   ├── docker-compose.yml        # Docker compose for production build
│   ├── docker-compose.dev.yml    # Docker compose override for dev mode (hot-reload)
│   ├── pom.xml                   # Parent POM file
│   ├── start-backend.bat         # Startup script (Windows)
│   ├── eureka-server/            # Service Discovery (port 8761)
│   ├── api-gateway/              # API Gateway (port 8080)
│   ├── identity-service/         # User & Authentication Service (port 8081)
│   ├── vendor-catalog-service/   # Vendor & Product Catalog (port 8082)
│   ├── procurement-service/      # PR, RFQ, Quotation, PO Management (port 8083)
│   ├── inventory-service/        # Warehouse, Stock, GRN (port 8084)
│   ├── finance-service/          # Invoice, Payment, Budget (port 8085)
│   ├── notification-service/     # Email & In-App Notifications (port 8086)
│   └── analytics-service/        # Reporting & Metrics (port 8087)
└── docs/                         # Project Documentation
```

## 🚀 How to Run

### Prerequisites

#### For Docker-based setup:
- [Docker](https://www.docker.com/products/docker-desktop/) (with Docker Compose)
- At least 8GB RAM allocated to Docker

#### For local development:
- Java 21 or later
- Maven 3.8+
- Node.js 18+ & npm/yarn/pnpm
- MySQL 8.0+
- RabbitMQ

---

### Option 1: Run Everything with Docker (Recommended)

This is the simplest way to run the entire backend. Docker Compose will start MySQL, RabbitMQ, and all 9 microservices.

#### Step 1: Build the JARs locally
```bash
cd backend
mvn clean package -DskipTests
```

#### Step 2: Start all services with Docker Compose
```bash
docker compose up -d
```

This will:
1. Build Docker images for each service (copying the pre-built JARs)
2. Start MySQL, RabbitMQ, and all services
3. Wait for dependencies to be healthy before starting dependent services

#### Step 3: Check that everything is running
```bash
docker compose ps
```

#### Step 4: View logs
```bash
docker compose logs -f <service-name>
# Example: docker compose logs -f identity-service
```

#### Step 5: Stop all services
```bash
docker compose down
```

---

### Option 2: Docker Dev Mode with Hot-Reload (Best for Development)

This mode compiles and runs Java code entirely **inside Docker**. When you change code, you can trigger recompilation and Spring Boot DevTools will automatically restart the affected service.

#### Step 1: Start with dev mode override
```bash
cd backend
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This will:
1. Build dev Docker images (using Maven + JDK, not just JRE)
2. Mount your source code as a volume (so changes are reflected immediately)
3. Start each service using `mvn spring-boot:run` (compiles on startup)
4. Enable Spring Boot DevTools for automatic restart on classpath changes

#### Step 2: Make code changes

Edit any Java source file in `backend/<service>/src/`.

#### Step 3: Trigger recompilation

After making changes, run this command to recompile the changed service:

```bash
docker compose exec <service-name> mvn compile -pl <service-name> -am
```

For example:
```bash
docker compose exec identity-service mvn compile -pl identity-service -am
```

Spring Boot DevTools will detect the new class files and restart the application automatically.

#### Or, simply restart the container (simpler but slower):
```bash
docker compose restart <service-name>
```

#### Step 4: View logs with dev mode
```bash
docker compose logs -f <service-name>
```

---

### Option 3: Run Locally (Without Docker)

#### Step 1: Start MySQL & RabbitMQ
- Start your MySQL server (e.g., via XAMPP, Docker, or native install)
- Start your RabbitMQ server

#### Step 2: Use the startup script
```bash
cd backend
.\start-backend.bat
```
Or double-click on `start-backend.bat` in File Explorer.

Select option **2** for local mode.

#### Step 3: Or start services manually in separate terminals

First start Eureka Server:
```bash
cd backend/eureka-server
mvn spring-boot:run
```
Eureka Dashboard will be available at: http://localhost:8761

Then start the other services in separate terminals:
```bash
# API Gateway
cd backend/api-gateway
mvn spring-boot:run

# Identity Service
cd backend/identity-service
mvn spring-boot:run

# Vendor Catalog Service
cd backend/vendor-catalog-service
mvn spring-boot:run

# Procurement Service
cd backend/procurement-service
mvn spring-boot:run

# Inventory Service
cd backend/inventory-service
mvn spring-boot:run

# Finance Service
cd backend/finance-service
mvn spring-boot:run

# Notification Service
cd backend/notification-service
mvn spring-boot:run

# Analytics Service
cd backend/analytics-service
mvn spring-boot:run
```

---

### Frontend Setup

#### Step 1: Install dependencies
```bash
cd frontend
npm install
```

#### Step 2: Run frontend dev server
```bash
npm run dev
```

The frontend will be available at: http://localhost:5173

---

## 📍 Service URLs

| Service | URL |
|---------|-----|
| Eureka Dashboard | http://localhost:8761 |
| API Gateway | http://localhost:8080 |
| Identity Service | http://localhost:8081 |
| Vendor Catalog Service | http://localhost:8082 |
| Procurement Service | http://localhost:8083 |
| Inventory Service | http://localhost:8084 |
| Finance Service | http://localhost:8085 |
| Notification Service | http://localhost:8086 |
| Analytics Service | http://localhost:8087 |
| Swagger UI (API Gateway) | http://localhost:8080/swagger-ui.html |
| RabbitMQ Management | http://localhost:15672 |

## 📝 Notes

- All services register with Eureka Server. The API Gateway routes requests to the appropriate service.
- In Docker mode, services wait for dependencies (MySQL, RabbitMQ, Eureka) to be healthy before starting.
- For production, use the regular Docker Compose (`docker-compose up`). For development, use the dev mode override (`-f docker-compose.dev.yml`).
- The `start-backend.bat` script provides a convenient menu for all startup modes on Windows.