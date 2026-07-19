# Task Manager

A secure, production-ready full-stack task management application built with **FastAPI**, **React**, and **PostgreSQL**. Users register, authenticate via JWT, and manage their own isolated task lists through a RESTful API.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Running with Docker Compose](#running-with-docker-compose)
- [Local Development](#local-development)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Dependency Management](#dependency-management)
  - [Python — uv](#python--uv)
  - [JavaScript — npm](#javascript--npm)
- [API Reference](#api-reference)

---

## Tech Stack

| Layer        | Technology                                   |
| :----------- | :------------------------------------------- |
| **Backend**  | Python 3.12+, FastAPI, SQLAlchemy, Uvicorn   |
| **Frontend** | React 19, Vite, Axios, Lucide               |
| **Database** | PostgreSQL 16                                |
| **Auth**     | JWT (PyJWT), Passlib / bcrypt                |
| **DevOps**   | Docker, Docker Compose                       |
| **Python PM**| [uv](https://github.com/astral-sh/uv)       |
| **JS PM**    | npm                                          |

---

## Architecture

```
task-manager/
├── backend/                  # FastAPI application
│   ├── app/
│   │   ├── main.py           # App entry point, middleware, router registration
│   │   ├── config.py         # Settings loaded from environment variables
│   │   ├── database.py       # SQLAlchemy engine and session
│   │   ├── models.py         # ORM models (User, Task)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── auth.py           # JWT creation and verification helpers
│   │   ├── auth_router.py    # /auth/register, /auth/login endpoints
│   │   ├── tasks_router.py   # /tasks CRUD endpoints (auth required)
│   │   └── limiter.py        # SlowAPI rate limiter setup
│   ├── Dockerfile
│   ├── pyproject.toml        # Backend package specification
│   └── .env.example          # Environment variable template
├── frontend/                 # React + Vite application
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml        # Multi-container orchestration
├── pyproject.toml            # Root uv workspace configuration
└── uv.lock                   # Python dependency lockfile
```

---

## Prerequisites

| Requirement | Minimum Version |
| :--- | :--- |
| Docker Desktop | Latest |
| Python | 3.12+ |
| uv | Latest |
| Node.js | 18+ |
| npm | 9+ |

**Install uv** (if not already installed):

```bash
# macOS / Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Windows (PowerShell)
powershell -ExecutionPolicy BypassScope -c "irm https://astral.sh/uv/install.ps1 | iex"
```

---

## Environment Configuration

The backend reads all sensitive values from a `.env` file. **Never commit this file.**

```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and fill in your values:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=taskdb

# Connection string — use 'db' as host when running via Docker Compose
DATABASE_URL=postgresql://postgres:your_secure_password@db:5432/taskdb

# JWT — change this to a long random string in production
JWT_SECRET=change-this-to-a-strong-random-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# CORS — comma-separated list of allowed frontend origins
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Rate Limits
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_TASKS=60/minute
```

> **Note:** When running locally (not via Docker), change `@db:5432` to `@localhost:5432` in `DATABASE_URL`.

---

## Running with Docker Compose

This is the recommended way to run the full application stack.

```bash
# 1. Configure environment (one-time setup)
cp backend/.env.example backend/.env
# Edit backend/.env with your values

# 2. Build and start all services
docker compose up --build

# 3. To run in detached (background) mode
docker compose up --build -d

# 4. To stop all services
docker compose down
```

| Service     | URL                              |
| :---------- | :------------------------------- |
| Frontend    | http://localhost:5173            |
| Backend API | http://localhost:8000            |
| Swagger UI  | http://localhost:8000/docs       |

---

## Local Development

Run each service independently for a faster development workflow.

### Backend

```bash
# From the project root

# 1. Sync dependencies and create virtual environment
uv sync

# 2. Start the backend with hot reload
uv run uvicorn app.main:app --reload --app-dir backend
```

The API will be available at `http://localhost:8000`.

### Frontend

```bash
# From the frontend directory
cd frontend

# 1. Install dependencies
npm install

# 2. Start the Vite dev server
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## Dependency Management

### Python — `uv`

This project uses **uv** as its Python package manager. Dependencies are defined in `pyproject.toml` and pinned in `uv.lock`. Do **not** use `pip` directly.

| Task | Command |
| :--- | :--- |
| Install all dependencies | `uv sync` |
| Add a new package | `uv add <package>` |
| Remove a package | `uv remove <package>` |
| Update the lockfile | `uv lock` |
| Run a command in the venv | `uv run <command>` |

> `uv sync` automatically creates the `.venv` and installs exactly what is in `uv.lock`, ensuring a reproducible environment across all machines.

### JavaScript — `npm`

Frontend packages are managed with **npm** and defined in `frontend/package.json`.

| Task | Command |
| :--- | :--- |
| Install all packages | `npm install` |
| Add a package | `npm install <package>` |
| Remove a package | `npm uninstall <package>` |
| Run development server | `npm run dev` |
| Build for production | `npm run build` |
| Lint code | `npm run lint` |

---

## API Reference

All task endpoints require a `Bearer` token in the `Authorization` header.

### Authentication

| Method | Endpoint | Description | Auth Required |
| :----- | :------- | :---------- | :------------ |
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Login and receive a JWT | No |

**Register — Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Login — Response:**
```json
{
  "access_token": "<jwt_token>",
  "token_type": "bearer"
}
```

---

### Tasks

All task endpoints return or accept data in this shape:

```json
{
  "id": 1,
  "title": "Buy groceries",
  "description": "Milk, eggs, bread",
  "completed": false,
  "user_id": 1
}
```

| Method   | Endpoint        | Description             | Auth Required |
| :------- | :-------------- | :---------------------- | :------------ |
| `GET`    | `/tasks`        | Get all tasks for the current user | Yes |
| `GET`    | `/tasks/{id}`   | Get a specific task | Yes |
| `POST`   | `/tasks`        | Create a new task | Yes |
| `PUT`    | `/tasks/{id}`   | Update an existing task | Yes |
| `DELETE` | `/tasks/{id}`   | Delete a task | Yes |

> Full interactive documentation with request/response examples is available at **[http://localhost:8000/docs](http://localhost:8000/docs)**.

---

## Author

**Sriram Selvaraj** — BE Computer Science and Engineering