# Task Manager Application

A simple full-stack Task Manager application built using **FastAPI** for the backend and **React** for the frontend. The application is containerized using **Docker** and can be run using **Docker Compose**.

---

## Features

- View all tasks
- Add new tasks
- Delete tasks
- REST API built with FastAPI
- React frontend
- Frontend connected with backend APIs
- Dockerized backend and frontend
- Run the complete application using Docker Compose

---

## Technologies Used

### Backend
- Python
- FastAPI
- Uvicorn

### Frontend
- React
- Axios

### DevOps
- Docker
- Docker Compose

---

## Project Structure

```
task-manager/
│
├── backend/
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
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

Before running the project, make sure you have installed:

- Docker Desktop
- Docker Compose (included with Docker Desktop)
- Git (optional, for cloning the repository)

---

## Clone the Repository

```bash
git clone https://bitbucket.org/sriram2004/task-manager.git
cd task-manager
```

---

## Run the Application Using Docker

### Build the Docker Images

```bash
docker compose build
```

### Start the Containers

```bash
docker compose up
```

To run in the background:

```bash
docker compose up -d
```

---

## Access the Application

### Frontend

```
http://localhost:3000
```

### Backend

```
http://localhost:8000
```

### FastAPI Swagger Documentation

```
http://localhost:8000/docs
```

---

## API Endpoints

### Get All Tasks

```
GET /tasks
```

Returns the list of all tasks.

---

### Add a Task

```
POST /tasks
```

Example Request Body:

```json
{
  "title": "Learn Docker"
}
```

---

### Delete a Task

```
DELETE /tasks/{id}
```

Deletes a task using its ID.

---

## Docker Commands

Build Images

```bash
docker compose build
```

Start Containers

```bash
docker compose up
```

Run in Background

```bash
docker compose up -d
```

Stop Containers

```bash
docker compose down
```

View Running Containers

```bash
docker ps


