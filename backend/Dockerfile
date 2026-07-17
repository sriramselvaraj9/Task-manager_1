FROM python:3.12

WORKDIR /app

# Install uv
RUN pip install --no-cache-dir uv

# Copy project metadata
COPY pyproject.toml ./

# Install dependencies into the system Python
RUN uv pip install --system \
    fastapi \
    uvicorn \
    sqlalchemy \
    psycopg2-binary \
    python-dotenv

# Copy the application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]