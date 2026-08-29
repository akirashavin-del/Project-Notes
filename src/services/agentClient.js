import { readAuthSession } from '../integrations/authSession';
import { isSupabaseConfigured, supabaseAgentRunStore } from '../integrations/supabaseClient';

const API_BASE = (import.meta.env.VITE_AGENT_API_URL || '/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const session = readAuthSession();
  const target = `${API_BASE}${path}`;
  let response;
  try {
    response = await fetch(target, {
      headers: { 'Content-Type': 'application/json', ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}), ...(options.headers || {}) },
      ...options,
    });
  } catch (error) {
    throw new Error(`Backend is unreachable at ${target}. Start the API on port 8787 or set VITE_AGENT_API_URL to the deployed API. ${error.message}`);
  }
  const raw = await response.text();
  let body = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch { body = { error: raw.slice(0, 500) || `Backend returned a non-JSON response (${response.status}).` }; }
  if (!response.ok) throw new Error(body.error || body.message || `Backend request failed (${response.status}) at ${target}. Check ${API_BASE}/health.`);
  if (!body || typeof body !== 'object') throw new Error('Backend returned an invalid response shape.');
  return body;
}

const persistAgentRun = async ({ payload, status, response, error }) => {
  const session = readAuthSession();
  if (!isSupabaseConfigured || !session?.user?.id || !session?.accessToken || !payload?.project?.id) return;
  await supabaseAgentRunStore.save({
    projectId: payload.project.id,
    userId: session.user.id,
    accessToken: session.accessToken,
    task: payload.task || 'unknown',
    status,
    input: payload.input || {},
    output: response?.result || null,
    error: error?.message || null,
  });
};

export const runAgentTask = async (payload) => {
  try {
    const response = await request('/agents/run', { method: 'POST', body: JSON.stringify(payload) });
    try { await persistAgentRun({ payload, status: 'succeeded', response }); } catch { /* preserve a successful AI result if audit storage is temporarily unavailable */ }
    return response;
  } catch (error) {
    try { await persistAgentRun({ payload, status: 'failed', error }); } catch { /* preserve the original agent error */ }
    throw error;
  }
};
export const searchResearch = (payload) => request('/research/search', { method: 'POST', body: JSON.stringify(payload) });
export const probeToolchains = () => request('/toolchains/probe', { method: 'POST', body: '{}' });
export const compileCode = (payload) => request('/toolchains/compile', { method: 'POST', body: JSON.stringify(payload) });
export const publishGithub = (payload) => request('/github/publish', { method: 'POST', body: JSON.stringify(payload) });

export { API_BASE };
