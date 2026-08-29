import os

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import Response


app = FastAPI(title="Project Notebook ADK gateway")
ADK_URL = "http://127.0.0.1:8000"


@app.get("/health")
async def health():
    return {"ok": True, "service": "project-notebook-adk", "mode": "google-adk"}


@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])
async def forward(path: str, request: Request):
    expected = os.getenv("ADK_SERVICE_TOKEN")
    supplied = request.headers.get("authorization", "")
    if expected and supplied != f"Bearer {expected}":
        return Response(content='{"detail":"Not authenticated"}', status_code=401, media_type="application/json")

    body = await request.body()
    headers = {key: value for key, value in request.headers.items() if key.lower() not in {"host", "content-length"}}
    async with httpx.AsyncClient(timeout=120.0) as client:
        upstream = await client.request(request.method, f"{ADK_URL}/{path}", params=request.query_params, content=body, headers=headers)
    excluded = {"content-encoding", "content-length", "transfer-encoding", "connection"}
    response_headers = {key: value for key, value in upstream.headers.items() if key.lower() not in excluded}
    return Response(content=upstream.content, status_code=upstream.status_code, headers=response_headers, media_type=upstream.headers.get("content-type"))
