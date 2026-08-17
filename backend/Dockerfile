FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Documentation for `docker run -P` and for Render's port detection. The actual
# port comes from the line below.
EXPOSE 8000

# Render assigns the port through $PORT and routes traffic to whatever the
# service binds. The exec form of CMD performs no shell expansion — `--port
# "$PORT"` there would be passed to uvicorn as the literal string — so this runs
# through `sh -c`. The default keeps `docker run` working on a laptop, where
# $PORT is unset.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
