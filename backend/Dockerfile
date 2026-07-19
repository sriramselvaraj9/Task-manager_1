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
    python-dotenv \
    "pyjwt>=2.8.0" \
    "passlib[bcrypt]>=1.7.4" \
    "bcrypt==4.0.1" \
    "python-multipart>=0.0.9" \
    "slowapi>=0.1.9"

# Copy the application
COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]