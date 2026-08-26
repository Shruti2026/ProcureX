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

## ☁️ Azure VM Deployment

### Prerequisites on the VM
- Ubuntu 22.04/24.04 LTS, minimum **Standard D4s_v3** (4 vCPU / 16 GB RAM)
- Docker Engine + Docker Compose v2 installed
- Inbound NSG rules: port **22** (your IP only), **80**, **443**

### First-time Setup

#### Step 1: Clone the repo on the VM
```bash
git clone https://github.com/<your-org>/ProcureX.git /opt/procurex
cd /opt/procurex
```

#### Step 2: Create the production secrets file
```bash
cp .env.production.example .env.production
nano .env.production   # fill in every value — see comments in the file
```

Key values to set:
- `MYSQL_ROOT_PASSWORD` — strong random password
- `RABBITMQ_USER` / `RABBITMQ_PASSWORD` — strong credentials
- `JWT_SECRET` — 64-char hex string (`openssl rand -hex 32`)
- `MAIL_USERNAME` / `MAIL_PASSWORD` — Gmail address + App Password
- `CORS_ALLOWED_ORIGINS` — your VM's public domain or IP, e.g. `http://procurex.eastus.cloudapp.azure.com`
- `VITE_API_BASE_URL` — bare VM origin, **no `/api` suffix**, e.g. `http://procurex.eastus.cloudapp.azure.com`

#### Step 3: Build backend JARs
```bash
cd /opt/procurex/backend
mvn clean package -DskipTests
```

#### Step 4: Start everything
```bash
cd /opt/procurex
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

Startup takes ~3–5 minutes as health checks cascade:
`MySQL + RabbitMQ` → `Eureka` → `7 microservices` → `API Gateway` → `Frontend`

#### Step 5: Verify
```bash
# All containers healthy
docker compose -f docker-compose.prod.yml ps

# API Gateway responding
curl http://localhost:8080/actuator/health

# Frontend served
curl http://localhost:80
```

---

### Redeployment (manual)

After pushing code changes, SSH into the VM and run:

```bash
cd /opt/procurex
git pull
cd backend && mvn clean package -DskipTests && cd ..
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

To redeploy a single service without touching others:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production \
  up -d --build --no-deps <service-name>
# Example: --no-deps identity-service
```

---

### CI/CD (Automated Deployment)

Two GitHub Actions workflows handle CI and CD separately:

- **`.github/workflows/ci.yml`** — runs on every push and pull request to `azure`
  - Compiles all backend modules and runs the full test suite (`mvn clean verify`)
  - Runs a Vite production build to validate the frontend
  - Uploads compiled JARs as an artifact for the CD pipeline to consume

- **`.github/workflows/cd.yml`** — triggers only after CI passes
  - Downloads the JARs built in CI (no recompile on the VM)
  - SSHes into the VM, rsyncs files, rebuilds Docker images, restarts containers
  - Fails the deployment if the API Gateway does not become healthy within 5 minutes

Required GitHub Secrets (set under **Settings → Secrets and variables → Actions**):

| Secret | Description |
|--------|-------------|
| `VM_HOST` | VM public IP or DNS name |
| `VM_USER` | SSH username (e.g. `azureuser`) |
| `VM_SSH_KEY` | Private SSH key (contents of `~/.ssh/id_rsa`) |

> **Note:** `VITE_API_BASE_URL` in `.env.production` must be the bare VM origin with **no `/api` suffix** — e.g. `http://20.40.50.207`. The service files already prefix every request path with `/api/v1/...`, so including `/api` here causes doubled paths (`/api/api/v1/...`) and 404 errors.

---

### Useful Commands on the VM

```bash
# Live logs for a service
docker logs procurex-identity-service -f --tail 100

# Resource usage
docker stats

# MySQL backup
docker exec procurex-mysql mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" \
  --all-databases > backup_$(date +%Y%m%d_%H%M%S).sql

# RabbitMQ management UI (via SSH tunnel from your machine)
ssh -L 15672:localhost:15672 azureuser@<VM_IP>
# Then open http://localhost:15672 in your browser

# Stop everything
docker compose -f docker-compose.prod.yml down
```

---

## 📝 Notes

- All services register with Eureka Server. The API Gateway routes requests to the appropriate service.
- In Docker mode, services wait for dependencies (MySQL, RabbitMQ, Eureka) to be healthy before starting.
- For production, use the regular Docker Compose (`docker-compose up`). For development, use the dev mode override (`-f docker-compose.dev.yml`).
- The `start-backend.bat` script provides a convenient menu for all startup modes on Windows.