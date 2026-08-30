const stripJsonFence = (value) => value.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

const parseAgentJson = (value) => {
  const clean = stripJsonFence(String(value || ''));
  try { return JSON.parse(clean); } catch { /* try a bounded JSON object */ }
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
  throw new Error('Agent returned text outside the required JSON shape.');
};

async function remoteHeaders(signal) {
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json' };
  if (process.env.ADK_SERVICE_TOKEN) return { ...headers, Authorization: `Bearer ${process.env.ADK_SERVICE_TOKEN}` };
  if (process.env.K_SERVICE && process.env.ADK_SERVICE_URL) {
    const audience = process.env.ADK_AUDIENCE || process.env.ADK_SERVICE_URL.replace(/\/$/, '');
    const response = await fetch(`http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=${encodeURIComponent(audience)}&format=full`, { signal, headers: { 'Metadata-Flavor': 'Google' } });
    if (response.ok) return { ...headers, Authorization: `Bearer ${(await response.text()).trim()}` };
  }
  return headers;
}

async function remoteRequest(path, options = {}, timeoutMs = 60000) {
  const baseUrl = process.env.ADK_SERVICE_URL?.replace(/\/$/, '');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, signal: controller.signal, headers: { ...(await remoteHeaders(controller.signal)), ...(options.headers || {}) } });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.detail || body?.message || `Remote ADK request failed (${response.status}).`);
    return body;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Remote ADK timed out before returning a response.');
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) throw new Error('Remote ADK network request failed. Confirm the deployed API has outbound HTTPS access.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function runRemoteADK({ task, input, project }, timeoutMs) {
  const appName = process.env.ADK_APP_NAME || 'notebook_agent';
  const userId = `project-user-${project?.id || 'anonymous'}`;
  const sessionId = `project-session-${project?.id || 'default'}`;
  try {
    await remoteRequest(`/apps/${encodeURIComponent(appName)}/users/${encodeURIComponent(userId)}/sessions/${encodeURIComponent(sessionId)}`, { method: 'POST', body: JSON.stringify({ projectId: project?.id || null }) }, Math.min(timeoutMs, 15000));
  } catch (error) {
    if (!error.message.includes('already exists') && !error.message.includes('(409)')) throw error;
  }
  const events = await remoteRequest('/run', {
    method: 'POST',
    body: JSON.stringify({ appName, userId, sessionId, newMessage: { role: 'user', parts: [{ text: JSON.stringify({ task, project, input }) }] } }),
  }, timeoutMs);
  const finalText = [...(Array.isArray(events) ? events : [])].reverse().flatMap((event) => event.content?.parts || []).map((part) => part.text || '').find(Boolean);
  if (!finalText) throw new Error('Remote ADK returned no final response.');
  try { return parseAgentJson(finalText); } catch { throw new Error('Remote ADK returned text outside the required JSON shape.'); }
}

async function runDirectGemini({ task, input, project }, timeoutMs) {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured. Add GOOGLE_API_KEY or GEMINI_API_KEY to .env.local or server environment.');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const taskRule = task === 'generate_code'
    ? 'Return exactly {"files":[{"path":"src/main.py","language":"python","role":"entry","content":"..."}]} with 2-5 small, relevant, runnable files. Use the requested language, keep dependencies standard-library only, and never invent APIs, citations, metrics, or project requirements.'
    : task === 'generate_ui'
      ? 'Return exactly {"title":"...","screens":[{"name":"...","purpose":"...","fields":["..."],"actions":["..."]}],"flow":["..."]}. Keep it practical, accessible, and grounded in the supplied project.'
    : task === 'explain_build_error'
      ? 'Return exactly {"cause":"...","evidence":"...","nextAction":"...","explanation":"..."}. Turn the compiler or runtime diagnostic into a clear cause, evidence, next action, and plain explanation.'
    : task === 'interpret_idea'
      ? 'Return exactly {"problem":"...","objective":"...","domain":"...","proposedApproach":"...","expectedOutput":"...","constraints":["..."]}. Translate the raw idea into a structured project definition.'
    : task === 'write_notes'
      ? 'Return exactly {"notes":"..."}. Format structured markdown project notes from verified project facts.'
    : task === 'write_slides'
      ? 'Return exactly {"slides":[{"title":"...","content":"..."}]}. Create concise presentation slides from verified project facts.'
    : 'Return exactly one JSON object with short plain-language fields.';
  const instruction = `You are the semantic writing worker for Project Notebook. Task: ${task}. Use only facts in the supplied JSON. Do not invent results, citations, metrics, compiler facts, or files. ${taskRule} If information is missing, say so instead of guessing.`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${instruction}\nProject JSON:\n${JSON.stringify({ project, input })}` }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || `Gemini API request failed (${response.status}).`);
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) throw new Error('Gemini API returned no text result.');
    try { return parseAgentJson(text); } catch { throw new Error('Gemini API returned text outside the required JSON shape.'); }
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Gemini API request timed out before returning a response.');
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) throw new Error('Gemini network request failed. Confirm outbound HTTPS access.');
    throw error;
  } finally { clearTimeout(timer); }
}

function normalizeUISpec(raw) {
  let data = raw;
  if (typeof data === 'string') {
    try { data = JSON.parse(stripJsonFence(data)); } catch { data = null; }
  }
  if (!data || typeof data !== 'object') {
    throw new Error('AI returned no valid UI specification structure.');
  }

  if (data.result && typeof data.result === 'object') data = data.result;
  else if (data.data && typeof data.data === 'object') data = data.data;

  let rawScreens = data.screens || data.pages || data.views || data.screenStack || data.interface || data.screens_list;

  if (rawScreens && !Array.isArray(rawScreens) && typeof rawScreens === 'object') {
    rawScreens = Object.entries(rawScreens).map(([key, val]) => typeof val === 'object' ? { name: key, ...val } : { name: key, purpose: String(val) });
  }

  if (!Array.isArray(rawScreens) || rawScreens.length === 0) {
    throw new Error('AI returned no interface screens in the generated UI plan.');
  }

  const screens = rawScreens.map((s, index) => {
    if (typeof s === 'string') {
      return { name: s, purpose: `Screen for ${s}`, fields: ['Input Data', 'Status'], actions: ['Submit', 'Reset'] };
    }
    return {
      name: s.name || s.title || `Screen ${index + 1}`,
      purpose: s.purpose || s.description || 'Project interaction screen.',
      fields: Array.isArray(s.fields) && s.fields.length > 0 ? s.fields.map(String) : (Array.isArray(s.inputs) ? s.inputs.map(String) : ['Input Data', 'Status']),
      actions: Array.isArray(s.actions) && s.actions.length > 0 ? s.actions.map(String) : (Array.isArray(s.buttons) ? s.buttons.map(String) : ['Action'])
    };
  });

  const flow = Array.isArray(data.flow) && data.flow.length > 0
    ? data.flow.map(String)
    : (Array.isArray(data.userFlow) ? data.userFlow.map(String) : screens.map((s, idx) => `Step ${idx + 1}: Navigate to ${s.name}`));

  return {
    title: data.title || data.name || 'Project interface',
    screens,
    flow
  };
}

function normalizeCodeSpec(raw) {
  let data = raw;
  if (typeof data === 'string') {
    try { data = JSON.parse(stripJsonFence(data)); } catch { data = null; }
  }
  if (!data || typeof data !== 'object') {
    throw new Error('AI returned no valid code structure.');
  }
  if (data.result && typeof data.result === 'object') data = data.result;

  const rawFiles = data.files || data.codeFiles || data.code_files;
  if (!Array.isArray(rawFiles) || rawFiles.length === 0) {
    throw new Error('AI returned an empty or invalid code file stack.');
  }

  const files = rawFiles.map((f, i) => ({
    id: f.id || `file-${i}`,
    path: f.path || f.filename || `src/file_${i + 1}`,
    language: f.language || 'python',
    role: f.role || (i === 0 ? 'entry' : 'helper'),
    content: typeof f.content === 'string' ? f.content : String(f.code || f.body || '')
  }));

  return { files };
}

export async function runADKTask(payload, timeoutMs = 60000) {
  let result;
  if (process.env.ADK_SERVICE_URL) {
    result = await runRemoteADK(payload, timeoutMs);
  } else if (process.env.REQUIRE_REMOTE_ADK === 'true' || process.env.NODE_ENV === 'production') {
    throw new Error('Remote ADK is required. Configure ADK_SERVICE_URL for the deployed ADK service.');
  } else {
    result = await runDirectGemini(payload, timeoutMs);
  }

  if (payload?.task === 'generate_ui') {
    return normalizeUISpec(result);
  }
  if (payload?.task === 'generate_code') {
    return normalizeCodeSpec(result);
  }
  return result;
}
