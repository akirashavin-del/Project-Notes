import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const readTemplate = (filename, secondary = '') => {
  try {
    const paths = [
      join(process.cwd(), filename),
      join(process.cwd(), 'server', filename)
    ];
    if (secondary) {
      paths.push(join(process.cwd(), secondary));
      paths.push(join(process.cwd(), 'server', secondary));
    }
    for (const p of paths) {
      if (existsSync(p)) return readFileSync(p, 'utf8');
    }
  } catch (e) {
    console.error(`Failed to read template ${filename}`, e);
  }
  return '';
};

const codeTemplateContent = readTemplate('code_development_prompt.txt');

// Load all 3 LaTeX templates
const latexTemplateContent1 = readTemplate('for_latex/code_temp1.txt', 'code_temp1.txt');
const latexTemplateContent2 = readTemplate('for_latex/code_temp2.txt', 'code_temp2.txt');
const latexTemplateContent3 = readTemplate('for_latex/code_temp3.txt', 'code_temp3.txt');
const allLatexTemplates = `
[LaTeX Style Option 1]:
${latexTemplateContent1}
[LaTeX Style Option 2]:
${latexTemplateContent2}
[LaTeX Style Option 3]:
${latexTemplateContent3}
`;

// Load all 3 UI templates
const uiTemplateContent1 = readTemplate('for_ui/ui-template1.html', 'ui-template1.html');
const uiTemplateContent2 = readTemplate('for_ui/ui-template2.html', 'ui-template2.html');
const uiTemplateContent3 = readTemplate('for_ui/ui-template3.html', 'ui-template3.html');
const allUiTemplates = `
[UI Style Option 1]:
${uiTemplateContent1}
[UI Style Option 2]:
${uiTemplateContent2}
[UI Style Option 3]:
${uiTemplateContent3}
`;

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
    const raw = await response.text();
    let body = null;
    try { body = raw ? JSON.parse(raw) : null; } catch {
      const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      body = lines.length > 1 ? lines.map((line) => { try { return JSON.parse(line); } catch { return { text: line }; } }) : raw;
    }
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
  const directResult = events?.result || events?.data;
  if (directResult && typeof directResult === 'object' && (directResult.screens || directResult.files || directResult.notes)) return directResult;
  const eventList = Array.isArray(events) ? events : Array.isArray(events?.events) ? events.events : [];
  const finalText = [...eventList].reverse()
    .flatMap((event) => event.content?.parts || event.parts || event.output?.parts || [])
    .map((part) => part.text || '')
    .find(Boolean);
  if (!finalText) throw new Error('Remote ADK returned no final response.');
  try { return parseAgentJson(finalText); } catch { throw new Error('Remote ADK returned text outside the required JSON shape.'); }
}

async function runDirectGemini({ task, input, project, key }, timeoutMs) {
  const apiKey = key || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini API key is not configured. Add GOOGLE_API_KEY or GEMINI_API_KEY to .env.local or server environment.');
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const taskRule = task === 'generate_code'
    ? `Follow this full-stack project development prompt template:
${codeTemplateContent}
Guidelines:
1. Generate a complete, functional, runnable backend (e.g. Node/Express or FastAPI) and matching React/Vite frontend.
2. The generated code MUST produce a clear visual output (e.g., SVG diagrams, canvas graphics, or dynamic HTML visualization).
3. Do NOT use fake placeholders or unimplemented button hooks. All logic must be real.
4. Output JSON format: {"files":[{"path":"server.js","language":"javascript","role":"backend","content":"..."},{"path":"index.html","language":"html","role":"frontend","content":"..."}]}`
    : task === 'generate_ui'
      ? `Design a clean, modern interface plan. You can use one of these three template options depending on what fits best:
${allUiTemplates}
Guidelines:
1. Ensure the UI displays and uses the actual visual output generated by the backend/frontend code (e.g., interactive canvas, charts, or SVG grids).
2. Do NOT include any features, fields, or sections from the templates for which we do not have corresponding code.
3. Every button or form action must map to real code features.
4. Output JSON format: {"title":"...","screens":[{"name":"...","purpose":"...","fields":["..."],"actions":["..."]}],"flow":["..."]}`
    : task === 'explain_build_error'
      ? 'Return exactly {"cause":"...","evidence":"...","nextAction":"...","explanation":"..."}. Turn the compiler or runtime diagnostic into a clear cause, evidence, next action, and plain explanation.'
    : task === 'interpret_idea'
      ? 'Return exactly {"problem":"...","objective":"...","domain":"...","proposedApproach":"...","expectedOutput":"...","constraints":["..."]}. Translate the raw idea into a structured project definition.'
    : task === 'write_notes'
      ? 'Return exactly {"notes":"..."}. Format structured markdown project notes from verified project facts.'
    : task === 'write_slides'
      ? `Create presentation slides in LaTeX Beamer. You can base your layout/styling on one of these three templates depending on what fits best:
${allLatexTemplates}
Guidelines:
1. Structure slides to present the Problem, Solution, Methodology, Results/Impact (mentioning the visual output), and Conclusion.
2. Only include features and details actually implemented in the generated code files. Do NOT use placeholder text or unimplemented sections.
3. Include TikZ diagram items representing the actual engine/pipeline workflow.
4. Output JSON format: {"slides":[{"title":"...","content":"..."}]}`
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

async function runDirectAnthropic({ task, input, project, key }, timeoutMs) {
  const apiKey = key || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Anthropic API key is not configured.');
  const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
  const taskRule = task === 'generate_code'
    ? `Follow this full-stack project development prompt template:
${codeTemplateContent}
Guidelines:
1. Generate a complete, functional, runnable backend (e.g. Node/Express or FastAPI) and matching React/Vite frontend.
2. The generated code MUST produce a clear visual output (e.g., SVG diagrams, canvas graphics, or dynamic HTML visualization).
3. Do NOT use fake placeholders or unimplemented button hooks. All logic must be real.
4. Output JSON format: {"files":[{"path":"server.js","language":"javascript","role":"backend","content":"..."},{"path":"index.html","language":"html","role":"frontend","content":"..."}]}`
    : 'Return exactly one JSON object with short plain-language fields.';
  const instruction = `You are the semantic writing worker for Project Notebook. Task: ${task}. Use only facts in the supplied JSON. Do not invent results, citations, metrics, compiler facts, or files. ${taskRule} If information is missing, say so instead of guessing. You MUST respond with a valid raw JSON object. Do not include markdown formatting or prose outside the JSON.`;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: instruction,
        messages: [
          { role: 'user', content: `Project JSON:\n${JSON.stringify({ project, input })}` }
        ],
        temperature: 0.2
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || `Anthropic API request failed (${response.status}).`);
    const text = body.content?.[0]?.text?.trim();
    if (!text) throw new Error('Anthropic API returned no text result.');
    try { return parseAgentJson(text); } catch { throw new Error('Anthropic API returned text outside the required JSON shape.'); }
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('Anthropic API request timed out before returning a response.');
    throw error;
  } finally { clearTimeout(timer); }
}

async function runDirectOpenAI({ task, input, project, key }, timeoutMs) {
  const apiKey = key || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API key is not configured.');
  const model = process.env.OPENAI_MODEL || 'gpt-4o';
  const taskRule = task === 'write_slides'
    ? `Create presentation slides in LaTeX Beamer. You can base your layout/styling on one of these three templates depending on what fits best:
${allLatexTemplates}
Guidelines:
1. Structure slides to present the Problem, Solution, Methodology, Results/Impact (mentioning the visual output), and Conclusion.
2. Only include features and details actually implemented in the generated code files. Do NOT use placeholder text or unimplemented sections.
3. Include TikZ diagram items representing the actual engine/pipeline workflow.
4. Output JSON format: {"slides":[{"title":"...","content":"..."}]}`
    : task === 'write_notes'
      ? 'Return exactly {"notes":"..."}. Format structured markdown project notes from verified project facts.'
      : 'Return exactly one JSON object with short plain-language fields.';
  const instruction = `You are the semantic writing worker for Project Notebook. Task: ${task}. Use only facts in the supplied JSON. Do not invent results, citations, metrics, compiler facts, or files. ${taskRule} If information is missing, say so instead of guessing.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: instruction },
          { role: 'user', content: `Project JSON:\n${JSON.stringify({ project, input })}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error?.message || `OpenAI API request failed (${response.status}).`);
    const text = body.choices?.[0]?.message?.content?.trim();
    if (!text) throw new Error('OpenAI API returned no text result.');
    try { return parseAgentJson(text); } catch { throw new Error('OpenAI API returned text outside the required JSON shape.'); }
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('OpenAI API request timed out before returning a response.');
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

  for (let index = 0; index < 4; index += 1) {
    if (data.result && typeof data.result === 'object') data = data.result;
    else if (data.data && typeof data.data === 'object') data = data.data;
    else break;
  }

  let rawScreens = data.screens || data.pages || data.views || data.screenStack || data.interface || data.screens_list || data.interfaceScreens || data.uiDefinition?.screens;

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
  const task = payload?.task;
  const userKeys = payload?.userKeys || {};

  if (task === 'generate_code' && (userKeys.anthropic || process.env.ANTHROPIC_API_KEY)) {
    result = await runDirectAnthropic({ ...payload, key: userKeys.anthropic }, timeoutMs);
  } else if ((task === 'write_slides' || task === 'write_notes') && (userKeys.openai || process.env.OPENAI_API_KEY)) {
    result = await runDirectOpenAI({ ...payload, key: userKeys.openai }, timeoutMs);
  } else if (userKeys.gemini) {
    result = await runDirectGemini({ ...payload, key: userKeys.gemini }, timeoutMs);
  } else if (process.env.ADK_SERVICE_URL) {
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
