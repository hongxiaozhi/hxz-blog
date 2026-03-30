FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

ARG PIP_INDEX_URL=https://pypi.org/simple

RUN apt-get update \
    && apt-get install -y build-essential libffi-dev libssl-dev gcc \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# install python deps
COPY backend/requirements.txt /app/requirements.txt
RUN python -m pip install --upgrade pip \
    && python -m pip install --no-cache-dir --index-url ${PIP_INDEX_URL} -r requirements.txt

# copy application (both backend + frontend)
COPY backend /app/backend
COPY frontend /app/frontend

WORKDIR /app/backend

# persistent sqlite storage (optional mount)
RUN mkdir -p /data && chown -R root:root /data

EXPOSE 5000

CMD ["gunicorn", "--workers", "2", "--bind", "0.0.0.0:5000", "app:app"]
