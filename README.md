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
│   ├── pom.xml                   # Parent POM file
│   ├── eureka-server/            # Service Discovery
│   ├── api-gateway/              # API Gateway
│   ├── identity-service/         # User & Authentication Service
│   ├── vendor-catalog-service/   # Vendor & Product Catalog
│   ├── procurement-service/      # PR, RFQ, Quotation, PO Management
│   ├── inventory-service/        # Warehouse, Stock, GRN
│   ├── finance-service/          # Invoice, Payment, Budget
│   ├── notification-service/     # Email & In-App Notifications
│   └── analytics-service/        # Reporting & Metrics
└── docs/                         # Project Documentation
```

## 🚀 How to Run

### Prerequisites
- Java 21 or later
- Maven 3.8+
- Node.js 18+ & npm/yarn/pnpm
- MySQL 8.0+
- RabbitMQ
- Redis (optional, for API Gateway caching)

### Backend Setup

#### Prerequisites first:
1. **Start MySQL & RabbitMQ**
   - Start your MySQL server
   - Start your RabbitMQ server

#### Using Maven CLI (Terminal)
1. **Use the startup script (optional)**
   - Inside **backend** folder, run `.\start-backend.bat` or double click on this file.

2. **Start Eureka Server first**
   ```bash
   cd backend/eureka-server
   mvn spring-boot:run
   ```
   Eureka Dashboard will be available at: http://localhost:8761

3. **Start Other Services in separate terminals**:
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

   *Note: For easier production deployment, you can use Docker Compose to orchestrate all services together!*

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Run frontend dev server**
   ```bash
   npm run dev
   ```

