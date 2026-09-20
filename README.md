# 🔐 AccessHub

### Startup Access & Permission Management Platform

>AccessHub is a full-stack platform for managing **employees, roles, application access, onboarding, and offboarding** from one place. Instead of managing access manually across different applications, administrators can use AccessHub to **assign roles, grant or revoke access, and track important changes**.
><p>
  <a href="https://access-hub-bice.vercel.app/">🚀 Live Demo</a><br>
  <a href="https://github.com/Jhanwi/AccessHub">💻 GitHub</a>
 </p>

---

## 💡 What Problem Does It Solve?

Managing employee access becomes difficult when an organization uses many applications.Important changes are recorded in **audit logs**, making it easier to track who performed an action and when.

AccessHub brings these tasks together:

| 👤 Employees              | 🎭 Roles           | 📦 Applications       |
| ------------------------- | ------------------ | --------------------- |
| Create & manage users     | Assign permissions | Manage company apps   |
| Enable / disable accounts | Control actions    | Grant / revoke access |

---

## ✨ Key Features

<details>
<summary>🔐 <b>Authentication & RBAC</b></summary>

Users authenticate with **JWT**, while backend permissions determine which actions they can perform.

Example permissions:

```text
users:read
users:create
roles:update
access:grant
access:revoke
audit:read
```

</details>

<details>
<summary>👥 <b>Employee Management</b></summary>

Administrators can:
* Add employees
* Update employee information
* Assign roles
* Disable accounts
* Manage application access

</details>

<details>
<summary>🔑 <b>Application Access</b></summary>

Administrators can add applications and control which employees can use them.Access records are retained so previous access activity can be tracked.

**Grant access → Employee uses application → Revoke access when needed**

</details>

<details>
<summary>🚀 <b>Onboarding</b></summary>

A new employee can be set up through one workflow:

**Create employee → Assign role → Select applications → Grant access → Record activity**

</details>

<details>
<summary>🚪 <b>Offboarding</b></summary>

When an employee leaves:

**Disable account → Find active access → Revoke access → Record changes**

</details>

<details>
<summary>📋 <b>Audit Logs</b></summary>

Important actions are recorded with information such as:

* User who performed the action
* Action performed
* Entity affected
* Additional details
* Timestamp

</details>

---

## 📊 Admin Dashboard

The dashboard gives administrators a quick overview of the organization.

**Employees**

> Total and active employees

**Roles**

> Employee distribution by role

**Applications**

> Available applications

**Access**

> Active access grants and distribution

**Activity**

> Recent account and access changes

---

## 🏗️ How the System Works

The application follows a simple request flow:

```text
React Frontend
      ↓
Express REST API
      ↓
JWT Authentication
      ↓
Permission / RBAC Check
      ↓
PostgreSQL
```

Each layer has a specific job:

* **React** → Dashboard and user interface
* **Express** → REST API and business logic
* **JWT** → Identifies authenticated users
* **RBAC** → Checks what the user is allowed to do
* **PostgreSQL** → Stores users, roles, applications, access, and audit data

---

## 🌐 API Overview

AccessHub currently contains **32 REST API routes**, with **27 protected routes**.

| Module          | Routes |
| --------------- | -----: |
| Authentication  |      4 |
| Dashboard       |      5 |
| Employees       |      6 |
| Roles           |      4 |
| Applications    |      3 |
| Access          |      3 |
| Onboarding      |      1 |
| Offboarding     |      1 |
| Audit Logs      |      1 |
| Server / Health |      4 |
| **Total**       | **32** |

---

## 🗄️ Database

PostgreSQL stores the main entities used by the platform:

```text
Organizations
    ├── Users
    ├── Roles
    │    └── Permissions
    ├── Applications
    ├── Access Grants
    └── Audit Logs
```

Organization-level filtering keeps users, applications, roles, and audit information associated with the correct organization.

---

## 🛠️ Tech Stack

**Frontend**

`React.js` `JavaScript` `React Router` `Axios` `Recharts` `Vite`

**Backend**

`Node.js` `Express.js` `PostgreSQL` `JWT` `bcrypt` `REST APIs`

**Development & Deployment**

`Git` `GitHub` `Docker` `Supabase PostgreSQL` `Vercel` `Render`

---

## 📁 Project Structure

<details>
<summary>Click to view</summary>

```text
AccessHub/
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
├── tests/
├── docker-compose.yml
└── README.md
```

</details>

---

## 🚀 Run Locally

<details>
<summary>Click to view setup</summary>

### 1. Clone

```bash
git clone https://github.com/Jhanwi/AccessHub.git
cd AccessHub
```

### 2. Install backend

```bash
cd backend
npm install
```

Create `.env`:

```env
PORT=5001
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5174
```

### 3. Setup database

Run:

```text
database/schema.sql
database/seed.sql
```

### 4. Start backend

```bash
npm run dev
```

Backend:

```text
http://localhost:5001
```

### 5. Start frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5174
```

</details>

---

## 🧪 Testing

API tests:

```bash
chmod +x tests/api-tests.sh
./tests/api-tests.sh
```

Benchmark:

```bash
node tests/benchmark.js
```

The benchmark measures API response time, authorization overhead, concurrent requests, requests per second, and error rate.

> Performance numbers are recorded from actual benchmark runs rather than hard-coded because results depend on the machine, database, network, and deployment environment.

---

## 🎯 What This Project Demonstrates

* REST API development
* React dashboard development
* JWT authentication
* RBAC and permissions
* PostgreSQL database design
* Employee access management
* Onboarding and offboarding workflows
* Audit logging
* Protected backend routes
* Docker-based development

---

## 👩‍💻 Author

**Jhanwi Kumari**

B.Tech — Computer Science & Engineering

[GitHub Repository](https://github.com/Jhanwi/AccessHub)

> **Note:** Replace `YOUR_LIVE_DEMO_URL` with the actual deployed URL after deployment.
