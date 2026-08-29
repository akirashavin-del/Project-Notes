const TOOLCHAINS = {
  // Judge0 CE fallback ids keep compile usable when its optional catalog is down.
  python: { names: ['Python'], filename: 'main.py', fallbackId: 71 },
  c: { names: ['C (GCC)', 'C'], filename: 'main.c', fallbackId: 50 },
  java: { names: ['Java'], filename: 'Main.java', fallbackId: 62 },
};

const compilerBaseUrl = () => (process.env.ONLINE_COMPILER_URL || 'https://ce.judge0.com').replace(/\/$/, '');
const normalizeLanguage = (language = '') => language.toLowerCase().trim().replace('c language', 'c').replace('gcc', 'c');
const headers = () => ({ Accept: 'application/json', 'Content-Type': 'application/json', ...(process.env.ONLINE_COMPILER_API_KEY ? { 'X-Auth-Token': process.env.ONLINE_COMPILER_API_KEY } : {}) });

const retryableStatuses = new Set([429, 502, 503, 504]);

async function onlineRequest(path, options = {}) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`${compilerBaseUrl()}${path}`, { ...options, headers: { ...headers(), ...(options.headers || {}) } });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return body;
      lastError = new Error(body.message || body.error || body.detail || `Online compiler request failed (${response.status}) at ${compilerBaseUrl()}.`);
      if (!retryableStatuses.has(response.status) || attempt === 2) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === 2 || !(/fetch failed/i.test(error.message) || retryableStatuses.has(Number(error.message.match(/\((\d+)\)/)?.[1])))) throw error;
    }
    await wait(500 * (attempt + 1));
  }
  throw lastError || new Error('Online compiler request failed.');
}

let languageCache = { expiresAt: 0, value: null };
async function getLanguages() {
  if (languageCache.value && languageCache.expiresAt > Date.now()) return languageCache.value;
  const value = await onlineRequest('/languages/', { method: 'GET' });
  languageCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 };
  return value;
}

const matchLanguage = (languages, config) => languages.filter((item) => config.names.some((name) => item.name === name || item.name.startsWith(`${name} `))).sort((left, right) => right.name.localeCompare(left.name, undefined, { numeric: true }))[0];

export async function probeToolchains() {
  try {
    const languages = await getLanguages();
    return Object.fromEntries(Object.entries(TOOLCHAINS).map(([key, config]) => {
      const runtime = matchLanguage(languages, config);
      const fallback = !runtime && compilerBaseUrl() === 'https://ce.judge0.com' ? { id: config.fallbackId, name: `Judge0 CE fallback (${config.fallbackId})` } : null;
      return [key, { language: key, available: Boolean(runtime || fallback), version: runtime?.name || fallback?.name || null, online: true, fallback: Boolean(fallback), error: runtime || fallback ? null : 'Language is not available from the configured online compiler.' }];
    }));
  } catch (error) {
    return Object.fromEntries(Object.entries(TOOLCHAINS).map(([key, config]) => [key, { language: key, available: compilerBaseUrl() === 'https://ce.judge0.com', version: compilerBaseUrl() === 'https://ce.judge0.com' ? `Judge0 CE fallback (${config.fallbackId})` : null, online: true, fallback: compilerBaseUrl() === 'https://ce.judge0.com', error: compilerBaseUrl() === 'https://ce.judge0.com' ? `Language catalog unavailable; compile will use fallback id ${config.fallbackId}.` : error.message }]));
  }
}

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function submitAndWait(languageId, code, filename, stdin, args) {
  const body = await onlineRequest('/submissions?base64_encoded=false&wait=false', {
    method: 'POST',
    body: JSON.stringify({ language_id: languageId, source_code: code, stdin: String(stdin).slice(0, 10000), ...(args.length ? { command_line_arguments: args.slice(0, 20).join(' ') } : {}), cpu_time_limit: 2, wall_time_limit: 5, memory_limit: 128000 }),
  });
  if (!body.token) return body;
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const result = await onlineRequest(`/submissions/${encodeURIComponent(body.token)}?base64_encoded=false`, { method: 'GET' });
    if (result.status?.id > 2) return result;
    await wait(500);
  }
  return { status: { id: 13, description: 'Time Limit Exceeded' }, message: 'Online compiler did not finish within the server limit.' };
}

export async function compileSource({ language, code, stdin = '', args = [] }) {
  const key = normalizeLanguage(language);
  const config = TOOLCHAINS[key];
  if (!config) throw new Error(`No online compiler adapter exists for ${language}. Choose Python, C, or Java.`);
  if (typeof code !== 'string' || code.length > 200000) throw new Error('Code must be a string smaller than 200KB.');
  let runtime;
  try {
    const languages = await getLanguages();
    runtime = matchLanguage(languages, config);
  } catch (error) {
    if (compilerBaseUrl() !== 'https://ce.judge0.com') throw error;
    runtime = { id: config.fallbackId, name: `Judge0 CE fallback (${config.fallbackId})` };
  }
  if (!runtime && compilerBaseUrl() === 'https://ce.judge0.com') runtime = { id: config.fallbackId, name: `Judge0 CE fallback (${config.fallbackId})` };
  if (!runtime) throw new Error(`${language} is not available from the configured online compiler.`);
  const result = await submitAndWait(runtime.id, code, config.filename, stdin, Array.isArray(args) ? args : []);
  const accepted = result.status?.id === 3;
  return { language: key, verified: accepted, exitCode: accepted ? 0 : result.status?.id || 1, stdout: result.stdout || '', stderr: [result.compile_output, result.stderr, result.message].filter(Boolean).join('\n'), sourceFile: config.filename, online: true, runtimeVersion: runtime.name, status: result.status?.description || 'Unknown', memory: result.memory, time: result.time };
}

export { TOOLCHAINS };
