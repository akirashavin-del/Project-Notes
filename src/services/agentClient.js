import { readAuthSession } from '../integrations/authSession';
import { isSupabaseConfigured, supabaseAgentRunStore } from '../integrations/supabaseClient';
import { isFirebaseAIConfigured, runFirebaseAgentTask } from '../integrations/firebaseAI';

const API_BASE = (import.meta.env.VITE_AGENT_API_URL || '/api').replace(/\/$/, '');

const unwrapResult = (value) => {
  let result = value;
  for (let index = 0; index < 3 && result && typeof result === 'object'; index += 1) {
    if (result.result && typeof result.result === 'object') result = result.result;
    else if (result.data && typeof result.data === 'object') result = result.data;
    else break;
  }
  return result;
};

const normalizeUiResult = (value) => {
  const data = unwrapResult(value);
  const rawScreens = data?.screens || data?.pages || data?.views || data?.screenStack || data?.interface || data?.screens_list;
  if (!Array.isArray(rawScreens) || rawScreens.length === 0) {
    throw new Error('AI returned no usable interface screens.');
  }
  const screens = rawScreens.map((screen, index) => {
    if (typeof screen === 'string') return { name: screen, purpose: `Screen for ${screen}`, fields: ['Input data', 'Status'], actions: ['Continue'] };
    const fields = screen?.fields || screen?.inputs;
    const actions = screen?.actions || screen?.buttons;
    return {
      name: screen?.name || screen?.title || `Screen ${index + 1}`,
      purpose: screen?.purpose || screen?.description || 'Project interaction screen.',
      fields: (Array.isArray(fields) && fields.length ? fields : ['Input data', 'Status']).map(String),
      actions: (Array.isArray(actions) && actions.length ? actions : ['Continue']).map(String),
    };
  });
  return {
    title: data.title || data.name || 'Project interface',
    screens,
    flow: (data.flow || data.userFlow || screens.map((screen, index) => `Step ${index + 1}: Open ${screen.name}`)).map(String),
  };
};

async function request(path, options = {}) {
  const session = readAuthSession();
  const target = `${API_BASE}${path}`;
  
  const userKeysRaw = localStorage.getItem('shariee-note:user-keys');
  const userHeaders = {};
  if (userKeysRaw) {
    try {
      const keys = JSON.parse(userKeysRaw);
      if (keys.gemini) userHeaders['X-User-Gemini-Key'] = keys.gemini;
      if (keys.openai) userHeaders['X-User-OpenAI-Key'] = keys.openai;
      if (keys.anthropic) userHeaders['X-User-Anthropic-Key'] = keys.anthropic;
      if (keys.github) userHeaders['X-User-Github-Token'] = keys.github;
    } catch (e) {
      console.error('Failed to parse user keys from localStorage', e);
    }
  }

  let response;
  try {
    response = await fetch(target, {
      headers: { 
        'Content-Type': 'application/json', 
        ...(session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
        ...userHeaders,
        ...(options.headers || {}) 
      },
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
  const useFirebaseFirst = import.meta.env.VITE_AI_PROVIDER === 'firebase';
  const canUseFirebase = isFirebaseAIConfigured && payload?.task;
  const runFirebaseFallback = async (originalError) => {
    if (!canUseFirebase) throw originalError;
    try {
      const result = await runFirebaseAgentTask(payload);
      const response = { ok: true, task: payload.task, provider: 'firebase-ai-logic', result };
      if (payload.task === 'generate_ui') response.result = normalizeUiResult(result);
      try { await persistAgentRun({ payload, status: 'succeeded', response }); } catch { /* preserve a successful AI result if audit storage is temporarily unavailable */ }
      return response;
    } catch (firebaseError) {
      throw new Error(`${originalError.message} Firebase AI Logic fallback also failed: ${firebaseError.message}`);
    }
  };

  if (useFirebaseFirst) {
    try { return await runFirebaseFallback(new Error('Firebase AI Logic request failed.')); }
    catch (error) {
      try { await persistAgentRun({ payload, status: 'failed', error }); } catch { /* preserve the original agent error */ }
      throw error;
    }
  }

  try {
    const response = await request('/agents/run', { method: 'POST', body: JSON.stringify(payload) });
    if (payload.task === 'generate_ui') response.result = normalizeUiResult(response.result);
    try { await persistAgentRun({ payload, status: 'succeeded', response }); } catch { /* preserve a successful AI result if audit storage is temporarily unavailable */ }
    return response;
  } catch (error) {
    try { return await runFirebaseFallback(error); }
    catch (fallbackError) {
      try { await persistAgentRun({ payload, status: 'failed', error: fallbackError }); } catch { /* preserve the original agent error */ }
      throw fallbackError;
    }
  }
};
export const searchResearch = (payload) => request('/research/search', { method: 'POST', body: JSON.stringify(payload) });
export const probeToolchains = () => request('/toolchains/probe', { method: 'POST', body: '{}' });
export const compileCode = (payload) => request('/toolchains/compile', { method: 'POST', body: JSON.stringify(payload) });
export const publishGithub = (payload) => request('/github/publish', { method: 'POST', body: JSON.stringify(payload) });
export const registerPushToken = (payload) => request('/notifications/register', { method: 'POST', body: JSON.stringify(payload) });

export { API_BASE };
