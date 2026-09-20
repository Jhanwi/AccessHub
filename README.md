# AccessHub

A full-stack **Startup Access & Permission Management Platform** for managing employees, roles, application access, onboarding, offboarding, and audit activity from a centralized dashboard.

AccessHub is designed around a common problem in growing organizations: employees need access to multiple applications, while administrators need a simple way to control permissions, track access changes, and remove access when someone leaves the organization.

## Features

* JWT-based authentication
* Role-Based Access Control (RBAC)
* Organization-scoped data access
* Employee management
* Role and permission management
* Application management
* Grant and revoke application access
* Employee onboarding workflow
* Employee offboarding workflow
* Automatic access revocation during offboarding
* Audit logs for important access and account actions
* Admin dashboard with activity and access statistics
* Protected API routes
* PostgreSQL database
* Docker support
* API benchmark and security tests

## Tech Stack

### Frontend

* React.js
* JavaScript
* React Router
* Axios
* Recharts
* Vite

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT
* bcrypt
* REST APIs

### Development & Deployment

* Git
* GitHub
* Docker
* Supabase PostgreSQL
* Vercel
* Render

## Project Architecture

```text
AccessHub/
│
├── backend/
│   └── src/
│       ├── server.js
│       ├── db.js
│       ├── middleware.js
│       ├── auth.js
│       ├── dashboard.js
│       ├── employees.js
│       ├── roles.js
│       ├── applications.js
│       ├── access.js
│       ├── onboarding.js
│       ├── offboarding.js
│       └── audit.js
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── api.js
│       ├── App.jsx
│       └── main.jsx
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── tests/
│   ├── api-tests.sh
│   ├── benchmark.js
│   └── rbac-setup.sql
│
├── docker-compose.yml
└── README.md
```

## Core Modules

### Authentication

Users can register and log in using JWT-based authentication. Protected requests use the JWT to identify the authenticated user and their organization.

### Employees

Administrators can:

* View employees
* Add employees
* Update employee information
* Disable employees
* Assign roles

### RBAC

AccessHub uses permission-based authorization rather than relying only on frontend restrictions.

Example permissions include:

```text
users:read
users:create
users:update
users:delete

roles:read
roles:create
roles:update

applications:read
applications:create

access:grant
access:revoke

audit:read
```

The backend checks the authenticated user's permissions before allowing protected operations.

### Applications

Administrators can create and manage applications used by the organization.

Examples:

```text
GitHub
Slack
Jira
Google Workspace
Notion
```

### Access Management

Administrators can grant application access to employees and revoke it when access is no longer required.

Access records retain their status instead of simply deleting the record, allowing the system to preserve the access history.

### Onboarding

The onboarding workflow allows an administrator to:

1. Create an employee account.
2. Assign a role.
3. Select required applications.
4. Grant application access.
5. Record the onboarding action in the audit log.

### Offboarding

The offboarding workflow:

1. Disables the employee account.
2. Finds active application access.
3. Revokes the employee's active access.
4. Records the changes in the audit logs.

This creates a single workflow for removing access when an employee leaves the organization.

### Audit Logs

Important system actions are recorded in the `audit_logs` table.

Audit records can include:

* User performing the action
* Action performed
* Entity type
* Entity ID
* Additional details
* Timestamp

This provides administrators with a history of important account and access changes.

## Dashboard

The dashboard provides an overview of the organization's access activity.

It includes:

* Total employees
* Active employees
* Applications
* Active access grants
* Access distribution
* Employees by role
* Access activity
* Recent activity

Dashboard data is loaded from multiple backend APIs in parallel.

## API Overview

AccessHub exposes REST API routes for:

| Module         | Routes |
| -------------- | -----: |
| Authentication |      4 |
| Dashboard      |      5 |
| Employees      |      6 |
| Roles          |      4 |
| Applications   |      3 |
| Access         |      3 |
| Onboarding     |      1 |
| Offboarding    |      1 |
| Audit Logs     |      1 |
| Server/Health  |      4 |
| **Total**      | **32** |

Of these, **27 routes require authentication**.

## Database

AccessHub uses PostgreSQL with organization-aware relationships between users, roles, permissions, applications, access grants, and audit logs.

Main tables:

```text
organizations
users
roles
permissions
user_roles
role_permissions
applications
access_grants
audit_logs
```

Organization IDs are used throughout the backend to keep users, applications, roles, and audit data scoped to the correct organization.

## Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/Jhanwi/AccessHub.git
cd AccessHub
```

### 2. Configure the backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=5001
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5174
```

Do not commit `.env` to GitHub.

### 3. Configure the database

Create the PostgreSQL database and run:

```bash
database/schema.sql
```

Then load the initial data:

```bash
database/seed.sql
```

The project can use Supabase PostgreSQL for the database.

### 4. Start the backend

```bash
cd backend
npm run dev
```

Backend:

```text
http://localhost:5001
```

Health check:

```text
http://localhost:5001/api/health
```

### 5. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5174
```

## Testing

The project includes API checks:

```bash
chmod +x tests/api-tests.sh
./tests/api-tests.sh
```

The API test script checks:

* Backend health
* Protected employee endpoint
* Protected application endpoint

Unauthenticated requests to protected resources should be rejected.

## Performance Benchmark

The project also includes:

```text
tests/benchmark.js
```

The benchmark is designed to measure:

* JWT authentication overhead
* Authorization middleware latency
* API response time
* p95 response time
* Dashboard parallel-load time
* Database round-trip time
* Audit-log insertion through login
* Concurrent request handling
* Requests per second
* Protected endpoint behavior
* Error rate

The benchmark should be run against a live backend connected to the configured PostgreSQL database.

```bash
node tests/benchmark.js
```

Benchmark results depend on the machine, network, database location, and deployment environment, so performance numbers should be recorded from an actual benchmark run rather than hard-coded in this README.

## Security Approach

AccessHub applies several backend security controls:

* JWT authentication
* Password hashing with bcrypt
* Permission-based authorization
* Protected API routes
* Organization-level data filtering
* Server-side permission checks
* Access revocation instead of deleting historical records
* Audit logging for important operations

Frontend route protection is used for the user interface, while authorization is enforced again on the backend.

## Example Workflow

A typical employee access lifecycle looks like:

```text
Administrator
     │
     ▼
Create Employee
     │
     ▼
Assign Role
     │
     ▼
Select Applications
     │
     ▼
Grant Access
     │
     ▼
Employee Uses Applications
     │
     ▼
Offboarding
     │
     ├── Disable Employee
     │
     ├── Revoke Active Access
     │
     └── Record Audit Logs
```

## Project Purpose

AccessHub was built as a practical full-stack project to demonstrate backend development, authentication, authorization, PostgreSQL data modeling, REST API design, React dashboards, and real-world employee access lifecycle management.

## Future Improvements

Potential future improvements include:

* Email notifications
* Password reset
* More granular application permissions
* Approval-based access requests
* Scheduled access reviews
* Exportable audit reports
* Automated integration tests
* Production monitoring
* Rate limiting
* Refresh-token based authentication

## Author

**Jhanwi Kumari**

B.Tech — Computer Science & Engineering

GitHub: https://github.com/Jhanwi/AccessHub
