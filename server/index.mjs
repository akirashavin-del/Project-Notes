import './env.mjs';
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { runAgentTask } from './agentOrchestrator.mjs';
import { probeToolchains, compileSource } from './toolchains.mjs';
import { publishProject } from './github.mjs';
import { searchResearch } from './research.mjs';
import crypto from 'node:crypto';

const pushTokens = new Map();

async function getGoogleAuthToken(clientEmail, privateKey) {
  const header = { alg: 'RS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${encodedHeader}.${encodedClaim}`);
  const signature = sign.sign(privateKey.replace(/\\n/g, '\n'), 'base64url');
  const jwt = `${encodedHeader}.${encodedClaim}.${signature}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  if (!response.ok) {
    throw new Error(`Google OAuth2 token request failed: ${response.statusText}`);
  }
  const data = await response.json();
  return data.access_token;
}

async function sendFcmNotification({ token, title, body }) {
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const fcmProjectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;

  if (!token) return { success: false, error: 'No FCM registration token provided.' };

  if (clientEmail && privateKey && fcmProjectId) {
    try {
      const accessToken = await getGoogleAuthToken(clientEmail, privateKey);
      const url = `https://fcm.googleapis.com/v1/projects/${fcmProjectId}/messages:send`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body }
          }
        })
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error?.message || `FCM response code ${response.status}`);
      }
      return { success: true, messageId: result.name };
    } catch (error) {
      console.error('FCM send failed:', error);
      return { success: false, error: error.message };
    }
  } else {
    console.log(`[MOCK PUSH] To: ${token} | Title: ${title} | Body: ${body}`);
    return { success: true, mock: true };
  }
}


const port = Number(process.env.PORT || 8787);
const json = (response, status, body) => { response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': process.env.APP_ORIGIN || 'http://localhost:5173', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-User-Gemini-Key, X-User-OpenAI-Key, X-User-Anthropic-Key, X-User-Github-Token', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' }); response.end(JSON.stringify(body)); };
const upstreamStatus = (error) => /compiler|Gemini|ADK|network request|provider|fetch failed|unreachable/i.test(error?.message || '') ? 502 : 400;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

async function serveStaticFile(urlPath, response) {
  try {
    const distPath = join(process.cwd(), 'dist');
    let safeUrl = urlPath.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';
    
    let filePath = join(distPath, safeUrl);
    
    // Fallback to index.html for Single Page Application client routing
    if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
      filePath = join(distPath, 'index.html');
    }
    
    if (!existsSync(filePath)) {
      response.writeHead(404, { 'Content-Type': 'text/plain' });
      response.end('Not Found');
      return;
    }
    
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const content = readFileSync(filePath);
    response.writeHead(200, { 'Content-Type': contentType });
    response.end(content);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end(`Internal Server Error: ${error.message}`);
  }
}

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
    if (request.method === 'GET') {
      if (request.url === '/api/health') return json(response, 200, { ok: true, service: 'project-notebook-agent-api', agent: process.env.ADK_SERVICE_URL ? 'remote-adk' : 'development-gemini-fallback', compiler: process.env.ONLINE_COMPILER_URL || 'https://ce.judge0.com', research: ['OpenAlex', 'Semantic Scholar', 'Crossref', 'Europe PMC', 'arXiv'], authRequired: process.env.REQUIRE_API_AUTH === 'true' || process.env.NODE_ENV === 'production' });
      if (!request.url.startsWith('/api/')) {
        return serveStaticFile(request.url, response);
      }
    }
    if (request.method !== 'POST') return json(response, 404, { error: 'Route not found.' });
    await requireSupabaseUser(request);
    const body = await readBody(request);
    const userKeys = {
      gemini: request.headers['x-user-gemini-key'] || null,
      openai: request.headers['x-user-openai-key'] || null,
      anthropic: request.headers['x-user-anthropic-key'] || null
    };
    if (request.url === '/api/notifications/register') {
      const { projectId, token } = body;
      if (!token) return json(response, 400, { error: 'Token is required.' });
      pushTokens.set(projectId || 'default', token);
      console.log(`[FCM] Registered token for project ${projectId || 'default'}: ${token}`);
      return json(response, 200, { ok: true, registered: true });
    }
    if (request.url === '/api/agents/run') {
      try {
        const result = await runAgentTask({ ...body, userKeys });
        const token = pushTokens.get(body.project?.id || 'default');
        if (token) {
          sendFcmNotification({
            token,
            title: `Agent Task Succeeded: ${body.task}`,
            body: `Finished executing ${body.task} for project.`
          }).catch(err => console.error('Failed to send FCM notification:', err));
        }
        return json(response, 200, { ok: true, task: body.task, result });
      } catch (error) {
        const token = pushTokens.get(body.project?.id || 'default');
        if (token) {
          sendFcmNotification({
            token,
            title: `Agent Task Failed: ${body.task}`,
            body: error.message || 'Unknown error'
          }).catch(err => console.error('Failed to send FCM notification:', err));
        }
        throw error;
      }
    }
    if (request.url === '/api/research/search') return json(response, 200, { ok: true, result: await searchResearch(body) });
    if (request.url === '/api/toolchains/probe') return json(response, 200, { ok: true, toolchains: await probeToolchains() });
    if (request.url === '/api/toolchains/compile') {
      try {
        const result = await compileSource(body);
        const token = pushTokens.get(body.projectId || 'default');
        if (token) {
          sendFcmNotification({
            token,
            title: `Compiler Run Completed`,
            body: result?.verified ? `Accepted: Verification succeeded.` : `Diagnostic: Verification returned an error.`
          }).catch(err => console.error('Failed to send FCM notification:', err));
        }
        return json(response, 200, { ok: true, result });
      } catch (error) {
        const token = pushTokens.get(body.projectId || 'default');
        if (token) {
          sendFcmNotification({
            token,
            title: `Compiler Run Failed`,
            body: error.message || 'Unknown error'
          }).catch(err => console.error('Failed to send FCM notification:', err));
        }
        throw error;
      }
    }
    if (request.url === '/api/github/publish') {
      const userGithubToken = request.headers['x-user-github-token'] || null;
      return json(response, 200, { ok: true, result: await publishProject({ ...body, userGithubToken }) });
    }
    return json(response, 404, { error: 'Route not found.' });
  } catch (error) {
    return json(response, upstreamStatus(error), { ok: false, error: error.message || 'Request failed.' });
  }
});

server.listen(port, () => console.log(`Project Notebook agent API listening on http://localhost:${port}`));
