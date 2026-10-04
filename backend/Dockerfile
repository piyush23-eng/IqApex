# Multi-stage production build for ApexIQ telemetry backend
FROM python:3.11-slim as builder

WORKDIR /build
COPY requirements.txt .

RUN apt-get update && apt-get install -y --no-install-recommends gcc build-essential \
    && pip install --no-cache-dir --user -r requirements.txt \
    && apt-get purge -y --auto-remove gcc build-essential \
    && rm -rf /var/lib/apt/lists/*

FROM python:3.11-slim as runtime

WORKDIR /app

# Non-root service user for container security
RUN groupadd -r apexiq && useradd -r -g apexiq apexiq

COPY --from=builder /root/.local /home/apexiq/.local
COPY --chown=apexiq:apexiq . /app

ENV PATH=/home/apexiq/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

USER apexiq

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
