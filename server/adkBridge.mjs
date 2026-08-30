const stripJsonFence = (value) => value.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
const parseAgentJson = (value) => {
  const clean = stripJsonFence(String(value || ''));
  try { return JSON.parse(clean); } catch { /* try a bounded JSON object extracted from a helpful model prefix/suffix */ }
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
  if (!apiKey) throw new Error('Gemini is not configured. Add GOOGLE_API_KEY or GEMINI_API_KEY to the server environment.');
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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: `${instruction}\nProject JSON:\n${JSON.stringify({ project, input })}` }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || `Gemini request failed (${response.status}).`);
    const text = body.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();
    if (!text) throw new Error('Gemini returned no semantic result.');
    try { return parseAgentJson(text); } catch { throw new Error('Gemini returned text outside the required JSON shape.'); }
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Gemini timed out before returning a response.');
    if (error instanceof TypeError && /fetch failed/i.test(error.message)) throw new Error('Gemini network request failed. Confirm the deployed API has outbound HTTPS access.');
    throw error;
  } finally { clearTimeout(timer); }
}

export async function runADKTask(payload, timeoutMs = 60000) {
  if (process.env.ADK_SERVICE_URL) return runRemoteADK(payload, timeoutMs);
  if (process.env.REQUIRE_REMOTE_ADK === 'true' || process.env.NODE_ENV === 'production') throw new Error('Remote ADK is required. Configure ADK_SERVICE_URL for the deployed ADK service.');
  return runDirectGemini(payload, timeoutMs);
}
