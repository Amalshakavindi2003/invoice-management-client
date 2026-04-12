# EasyInvoice - Invoice Management System

A full-stack web application for managing customers and invoices for small businesses.

## Tech Stack

- Frontend: React.js, Recharts, jsPDF
- Backend: Java, Spring Boot, Spring Security
- Database: MySQL
- Authentication: JWT tokens

## Features

- Admin login with JWT authentication
- Customer management (add, edit, delete)
- Invoice creation and tracking
- PDF invoice generation and download
- Revenue analytics dashboard
- CSV and PDF export
- Customer self-service portal
- Activity timeline
- Overdue tracking

## How to Run

### Backend

```powershell
cd invoice-management-service
./mvnw spring-boot:run
```

### Frontend

```powershell
cd invoice-management-client
npm install
npm start
```

## Default Ports

- Frontend: http://localhost:3000
- Backend: http://localhost:8080