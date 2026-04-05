# WorkSphere – Employee Engagement Platform

A web-based Employee Engagement Platform with role-based access (Admin, HR Manager, Employee), JWT authentication, and an interactive landing page.

## Tech Stack

- **Frontend:** React 18, Vite, React Router, Framer Motion
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Auth:** JWT (JSON Web Token)

## Prerequisites

- Node.js 18+
- MongoDB running locally (or set `MONGO_URI` in `server/.env`)

## Setup & Run

### 1. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend (from project root)
cd client
npm install
```

### 2. Environment (optional)

Create `server/.env` if you need custom settings:

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/worksphere
JWT_SECRET=your-secret-key
```

### 3. Start the app

**Terminal 1 – backend**

```bash
cd server
npm run dev
```

**Terminal 2 – frontend**

```bash
cd client
npm run dev
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:5000  

## Features

- **Landing page:** Hero, features, role highlights, Register / Login CTAs, cursor-follow glow, animations
- **Register:** Name, email, password, **role** (Employee / HR Manager / Admin)
- **Login:** Email + password, JWT, redirect to dashboard
- **Dashboard:** Role-based sections (placeholder cards for surveys, analytics, recognition, etc.)
- **Auth:** Protected routes, persisted session, sign out

## Roles

| Role      | Description                                      |
|-----------|--------------------------------------------------|
| Admin     | Users, system settings, reports (placeholders)  |
| HR Manager| Surveys, analytics, employee profiles            |
| Employee  | Surveys, recognition, announcements              |

## Project Structure

```
client/                 # React (Vite) frontend
  src/
    components/
    context/            # AuthContext
    pages/              # Landing, Login, Register, Dashboard
server/                 # Express API
  src/
    models/             # User (MongoDB)
    routes/             # auth, users
    middleware/         # auth, requireRole
```

## API (examples)

- `POST /api/auth/register` – body: `{ name, email, password, role? }`
- `POST /api/auth/login` – body: `{ email, password }`
- `GET /api/auth/me` – header: `Authorization: Bearer <token>`
- `GET /api/users/profile` – header: `Authorization: Bearer <token>`
