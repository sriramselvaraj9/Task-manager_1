# Task Manager Application

A production-ready full-stack **Task Manager** application built with **FastAPI**, **React**, and **PostgreSQL**. The application provides RESTful APIs for task management, persistent database storage, and a responsive frontend. All services are containerized using **Docker Compose**, and Python dependencies are managed with **uv**.

---

## Features

### Backend
- FastAPI REST APIs
- PostgreSQL integration
- Full CRUD operations
- SQLAlchemy ORM
- Pydantic validation
- Clean project architecture
- Proper error handling
- REST API best practices
- Dependency management using **uv**

### Frontend
- React application
- Responsive user interface
- Create, View, Update, and Delete tasks
- API integration with FastAPI
- Loading indicators
- Form validation
- Error handling

### DevOps
- Dockerized Backend
- Dockerized Frontend
- Dockerized PostgreSQL
- Docker Compose support

---

## Technology Stack

| Category | Technologies |
|----------|--------------|
| Backend | Python, FastAPI, SQLAlchemy, Uvicorn |
| Frontend | React, Axios, CSS |
| Database | PostgreSQL |
| DevOps | Docker, Docker Compose |
| Package Manager | uv |

---

## Project Structure

```
task-manager/
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── config.py
│   │   └── main.py
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── uv.lock
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Prerequisites

Before running the project, install:

- Docker Desktop
- Python 3.11+
- uv
- Node.js & npm (optional for local frontend development)

---

## Clone the Repository

```bash
git clone https://bitbucket.org/sriram2004/task-manager.git
cd task-manager
```

---

# Running the Backend

Install dependencies:

```bash
uv sync
```

Run the backend:

```bash
uv run uvicorn app.main:app --reload
```

Backend URL:

```
http://localhost:8000
```

Swagger Documentation:

```
http://localhost:8000/docs
```

---

# Running the Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```
http://localhost:5173
```

---

# Running with Docker

Build the images:

```bash
docker compose build
```

Start all services:

```bash
docker compose up
```

Run in the background:

```bash
docker compose up -d
```

Stop all services:

```bash
docker compose down
```

---

## Application URLs

| Service | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| Swagger API | http://localhost:8000/docs |

---

## REST API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks` | Get all tasks |
| GET | `/tasks/{id}` | Get task by ID |
| POST | `/tasks` | Create a task |
| PUT | `/tasks/{id}` | Update a task |
| DELETE | `/tasks/{id}` | Delete a task |

---

## PostgreSQL

Example table structure:

| Column | Type |
|---------|------|
| id | Integer |
| title | String |
| description | String |
| completed | Boolean |
| created_at | Timestamp |

View database records:

```bash
docker exec -it postgres psql -U postgres
```

```sql
\c taskdb
\dt
SELECT * FROM tasks;
\q
```

---

## uv Commands

Install dependencies:

```bash
uv sync
```

Add a package:

```bash
uv add <package-name>
```

Remove a package:

```bash
uv remove <package-name>
```

Update lock file:

```bash
uv lock
```

Run the project:

```bash
uv run uvicorn app.main:app --reload
```

---

## Docker Commands

```bash
docker compose build
docker compose up
docker compose up -d
docker compose down
docker ps
docker compose logs
```

---

## Phase 2 Improvements

Compared to Phase 1, this version includes:

- Migrated from in-memory storage to PostgreSQL
- Implemented SQLAlchemy ORM
- Persistent CRUD operations
- Dependency management using **uv**
- Improved backend architecture
- Better error handling
- REST API best practices
- Responsive React frontend
- Loading states and form validation
- Dockerized backend, frontend, and PostgreSQL
- Updated project documentation

---

## Future Enhancements

- User Authentication (JWT)
- Search and Filtering
- Pagination
- Unit & Integration Testing
- CI/CD Pipeline
- Cloud Deployment

---

## Author

**Sriram Selvaraj**

BE Computer Science and Engineering

**Tech Stack:** Python • FastAPI • React • PostgreSQL • SQLAlchemy • Docker • uv