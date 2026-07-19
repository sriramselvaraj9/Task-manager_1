# Task Manager Application Documentation

## Overview

Task Manager is a full-stack web application for creating, viewing, updating, and deleting tasks. It includes:

- A FastAPI backend with JWT-based authentication
- A React frontend with a task management interface
- PostgreSQL for persistent storage
- Docker Compose for local development and deployment
- `uv` for Python dependency management

## Technology Stack

- Backend: FastAPI, SQLAlchemy, Pydantic, Uvicorn
- Frontend: React, Vite, Axios
- Database: PostgreSQL
- Containerization: Docker, Docker Compose
- Python dependency management: `uv`

## Repository Structure

- `backend/` contains the FastAPI application, database models, routers, schemas, and authentication logic
- `frontend/` contains the React client application
- `docker-compose.yml` defines the local multi-service environment

## Prerequisites

Before running the project, install the following:

- Python 3.11 or later
- `uv`
- Node.js 18 or later
- Docker Desktop
- Docker Compose

## Environment Configuration

The backend reads configuration from environment variables. Create a `.env` file inside the `backend/` directory with values similar to the following:

```env
DATABASE_URL=postgresql://postgres:password@db:5432/taskdb
JWT_SECRET=replace-this-with-a-secure-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
RATE_LIMIT_AUTH=5/minute
RATE_LIMIT_TASKS=60/minute
```

If you are using Docker Compose, the default `DATABASE_URL` can usually stay as shown above.

## Installation

### Backend Dependencies

Install Python dependencies with `uv`:

```bash
cd backend
uv sync
```

If you need to refresh the dependency lockfile:

```bash
uv lock
uv sync
```

### Frontend Dependencies

Install frontend dependencies with npm:

```bash
cd frontend
npm install
```

## Running the Application

You can run the application locally or with Docker Compose.

### Local Development

#### Start the Backend

From the `backend/` directory:

```bash
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend endpoints:

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

#### Start the Frontend

From the `frontend/` directory:

```bash
npm run dev
```

Frontend URL:

- Application: `http://localhost:5173`

### Full Stack with Docker Compose

From the project root:

```bash
docker compose up --build
```

To run in detached mode:

```bash
docker compose up -d --build
```

To stop the stack:

```bash
docker compose down
```

## Dependency Management with `uv`

This project uses `uv` for Python package management.

Common commands:

```bash
uv sync
uv lock
uv add <package-name>
uv remove <package-name>
uv run <command>
```

Examples:

```bash
uv add httpx
uv sync
uv run pytest
```

## Authentication Flow

Users must register before signing in.

### Registration

- The user submits an email and password
- The backend validates the input
- The password is hashed before storage
- A new user record is created in the database

### Login

- The user submits email and password
- The backend verifies the password against the stored hash
- On success, the backend returns a JWT access token
- The frontend stores the token and uses it for authenticated requests

## Task Management Flow

After signing in, users can:

- Create tasks
- View their tasks
- Mark tasks as completed
- Edit task details
- Delete tasks

Each task is associated with the authenticated user account.

## API Endpoints

### Authentication

- `POST /auth/register`
- `POST /auth/login`

### Tasks

- `GET /tasks`
- `GET /tasks/{id}`
- `POST /tasks`
- `PUT /tasks/{id}`
- `DELETE /tasks/{id}`

## Database Notes

The application uses PostgreSQL for persistence. Database tables are created automatically on startup if they do not already exist.

If you are running the project through Docker Compose, PostgreSQL data is stored in a persistent Docker volume.

## Troubleshooting

### Login Fails

If login fails even with the correct email and password, confirm that:

- The user account exists in the database
- The backend is connected to the correct PostgreSQL instance
- The database was not reset between registration and login

### Frontend Cannot Reach Backend

Check the following:

- The backend is running on port `8000`
- `VITE_API_URL` points to the correct backend URL
- CORS is configured to allow the frontend origin

### Database Connection Issues

Verify that:

- PostgreSQL is running
- `DATABASE_URL` is correct
- The Docker Compose services are healthy

## Recommended Development Workflow

1. Install dependencies for backend and frontend
2. Configure environment variables
3. Start PostgreSQL and the backend
4. Confirm the API is available at `/docs`
5. Start the frontend
6. Register a user account
7. Sign in and create tasks
8. Use Docker Compose to verify the full stack

## Maintenance Guidelines

- Keep dependency versions synchronized with the lockfile
- Update environment variables when moving between environments
- Avoid resetting the database outside of test workflows
- Document new endpoints and services as the project grows