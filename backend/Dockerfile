FROM python:3.11

WORKDIR /app

# gcc + libpq for psycopg2; poppler + libmagic + libgl for unstructured PDF/DOCX parsing
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    poppler-utils \
    libmagic1 \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
