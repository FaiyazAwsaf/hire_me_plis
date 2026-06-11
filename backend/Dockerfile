FROM python:3.11

WORKDIR /app

# gcc + libpq-dev for asyncpg (builds from source); no ML system deps needed
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8000

# Use shell form so $PORT (injected by Railway) is expanded at runtime
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
