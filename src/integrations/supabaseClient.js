const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const authResponse = (body) => ({
  accessToken: body?.access_token || null,
  refreshToken: body?.refresh_token || null,
  expiresIn: body?.expires_in || null,
  expiresAt: body?.expires_at || (body?.expires_in ? Math.floor(Date.now() / 1000) + body.expires_in : null),
  user: body?.user || null,
});

const headersFor = (accessToken) => ({
  apikey: supabaseAnonKey,
  Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
  'Content-Type': 'application/json',
});

async function supabaseRequest(path, options = {}, accessToken) {
  if (!isSupabaseConfigured) throw new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  const response = await fetch(`${supabaseUrl}${path}`, { ...options, headers: { ...headersFor(accessToken), ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || body?.error_description || `Supabase request failed (${response.status}).`);
  return body;
}

export const supabaseProjectStore = {
  async save({ snapshot, userId, accessToken }) {
    if (!userId) throw new Error('A signed-in Supabase user is required before syncing a project.');
    const rows = await supabaseRequest('/rest/v1/projects?on_conflict=id', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: snapshot.id, owner_id: userId, title: snapshot.idea?.domain || 'Untitled project', state: snapshot }),
    }, accessToken);
    return rows?.[0] || rows;
  },
  async load({ projectId, userId, accessToken }) {
    if (!userId) throw new Error('A signed-in Supabase user is required before loading a project.');
    const query = `/rest/v1/projects?id=eq.${encodeURIComponent(projectId)}&owner_id=eq.${encodeURIComponent(userId)}&select=state`;
    const rows = await supabaseRequest(query, { method: 'GET' }, accessToken);
    return rows?.[0]?.state || null;
  },
};

export const supabaseAgentRunStore = {
  async save({ projectId, userId, accessToken, task, status, input = {}, output = null, error = null }) {
    if (!projectId || !userId) throw new Error('A project and signed-in user are required before saving an agent run.');
    const rows = await supabaseRequest('/rest/v1/agent_runs', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ project_id: projectId, owner_id: userId, task, status, input, output, error, finished_at: status === 'succeeded' || status === 'failed' ? new Date().toISOString() : null }),
    }, accessToken);
    return rows?.[0] || rows;
  },
};

export const supabaseAuth = {
  async signUp({ email, password, name }) {
    const body = await supabaseRequest('/auth/v1/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, data: { full_name: name } }),
    });
    return authResponse(body);
  },
  async signIn({ email, password }) {
    const body = await supabaseRequest('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return authResponse(body);
  },
  async refreshSession(refreshToken) {
    const body = await supabaseRequest('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    return authResponse(body);
  },
  async getUser(accessToken) {
    const body = await supabaseRequest('/auth/v1/user', { method: 'GET' }, accessToken);
    return body;
  },
  async signOut(accessToken) {
    await supabaseRequest('/auth/v1/logout', { method: 'POST' }, accessToken);
  },
};

export { supabaseUrl };
