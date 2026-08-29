FROM python:3.12-slim

WORKDIR /app
COPY server/agents/notebook_agent/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY server/agents/notebook_agent /app/notebook_agent

ENV PORT=8080
EXPOSE 8080
CMD ["sh", "-c", "adk api_server --host 127.0.0.1 --port 8000 /app & exec uvicorn notebook_agent.proxy:app --host 0.0.0.0 --port ${PORT:-10000}"]
