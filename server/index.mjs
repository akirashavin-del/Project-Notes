import './env.mjs';
import { createServer } from 'node:http';
import { runAgentTask } from './agentOrchestrator.mjs';
import { probeToolchains, compileSource } from './toolchains.mjs';
import { publishProject } from './github.mjs';
import { searchResearch } from './research.mjs';

const port = Number(process.env.PORT || 8787);
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'http://localhost:5173', 'Access-Control-Allow-Headers': 'Content-Type, Authorization', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }); response.end(JSON.stringify(body)); };
const upstreamStatus = (error) => /compiler|Gemini|ADK|network request|provider|fetch failed|unreachable/i.test(error?.message || '') ? 502 : 400;

async function requireSupabaseUser(request) {
  if (process.env.REQUIRE_API_AUTH !== 'true' && process.env.NODE_ENV !== 'production') return null;
  const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');
  if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) throw new Error('Authenticated API mode needs a Supabase bearer token and server Supabase configuration.');
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/user`, { headers: { apikey: process.env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error('The Supabase session is not valid.');
  return response.json();
}

async function readBody(request) {
  let raw = '';
  for await (const chunk of request) { raw += chunk; if (raw.length > 2_000_000) throw new Error('Request body is too large.'); }
  return raw ? JSON.parse(raw) : {};
}

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return json(response, 204, {});
  try {
    if (request.method === 'GET' && request.url === '/api/health') return json(response, 200, { ok: true, service: 'project-notebook-agent-api', agent: process.env.ADK_SERVICE_URL ? 'remote-adk' : 'development-gemini-fallback', compiler: process.env.ONLINE_COMPILER_URL || 'https://ce.judge0.com', research: ['OpenAlex', 'Semantic Scholar', 'Crossref', 'Europe PMC', 'arXiv'], authRequired: process.env.REQUIRE_API_AUTH === 'true' || process.env.NODE_ENV === 'production' });
    if (request.method !== 'POST') return json(response, 404, { error: 'Route not found.' });
    await requireSupabaseUser(request);
    const body = await readBody(request);
    if (request.url === '/api/agents/run') return json(response, 200, { ok: true, task: body.task, result: await runAgentTask(body) });
    if (request.url === '/api/research/search') return json(response, 200, { ok: true, result: await searchResearch(body) });
    if (request.url === '/api/toolchains/probe') return json(response, 200, { ok: true, toolchains: await probeToolchains() });
    if (request.url === '/api/toolchains/compile') return json(response, 200, { ok: true, result: await compileSource(body) });
    if (request.url === '/api/github/publish') return json(response, 200, { ok: true, result: await publishProject(body) });
    return json(response, 404, { error: 'Route not found.' });
  } catch (error) {
    return json(response, upstreamStatus(error), { ok: false, error: error.message || 'Request failed.' });
  }
});

server.listen(port, () => console.log(`Project Notebook agent API listening on http://localhost:${port}`));
