import { getAI, getGenerativeModel, GoogleAIBackend, Schema } from 'firebase/ai';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import { getFirebaseApp, isFirebaseConfigured } from './firebaseConfig';

const DEFAULT_MODEL = 'gemini-3.5-flash-lite';
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_RECAPTCHA_ENTERPRISE_SITE_KEY;
const useDebugAppCheck = import.meta.env.DEV && import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN === 'true';
let appCheckInitialized = false;
const modelPromises = new Map();

const taskInstructions = {
  interpret_idea: 'Return exactly {problem, objective, domain, proposedApproach, expectedOutput, constraints:[string]}.',
  summarize_source: 'Return one JSON object with short plain-language summary fields based only on the supplied source evidence.',
  explain_code: 'Return one JSON object with short plain-language explanation fields based only on the supplied code.',
  explain_build_error: 'Return exactly {cause, evidence, nextAction, explanation}.',
  generate_code: 'Return exactly {files:[{path,language,role,content}]}. Keep the stack small and runnable.',
  generate_ui: 'Return exactly {title, screens:[{name,purpose,fields:[string],actions:[string]}], flow:[string]}. Return at least one screen grounded in the supplied project.',
  write_notes: 'Return exactly {notes}.',
  write_slides: 'Return exactly {slides:[{title,content}]}.'
};

const uiSchema = Schema.object({
  properties: {
    title: Schema.string(),
    screens: Schema.array({
      items: Schema.object({
        properties: {
          name: Schema.string(),
          purpose: Schema.string(),
          fields: Schema.array({ items: Schema.string() }),
          actions: Schema.array({ items: Schema.string() }),
        },
      }),
    }),
    flow: Schema.array({ items: Schema.string() }),
  },
});

function initializeAppCheckIfConfigured(app) {
  if (appCheckInitialized) return;
  if (useDebugAppCheck && typeof self !== 'undefined') self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  if (appCheckSiteKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }
  appCheckInitialized = true;
}

export const isFirebaseAIConfigured = isFirebaseConfigured;

async function getModel(task) {
  if (!isFirebaseAIConfigured) {
    throw new Error('Firebase AI Logic is not configured. Add the Firebase web config to the hosting build.');
  }
  if (!modelPromises.has(task)) {
    const app = getFirebaseApp();
    initializeAppCheckIfConfigured(app);
    const ai = getAI(app, { backend: new GoogleAIBackend() });
    modelPromises.set(task, Promise.resolve(getGenerativeModel(ai, {
      model: import.meta.env.VITE_FIREBASE_AI_MODEL || DEFAULT_MODEL,
      generationConfig: {
        responseMimeType: 'application/json',
        ...(task === 'generate_ui' ? { responseSchema: uiSchema } : {}),
        temperature: 0.2,
      },
    })));
  }
  return modelPromises.get(task);
}

function parseJson(text) {
  const clean = String(text || '').replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  try { return JSON.parse(clean); } catch {
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(clean.slice(start, end + 1));
    throw new Error('Firebase AI Logic returned invalid JSON.');
  }
}

export async function runFirebaseAgentTask({ task, input, project }) {
  const model = await getModel(task);
  const instruction = [
    'You are the Project Notebook semantic worker.',
    `Task: ${task}.`,
    taskInstructions[task] || 'Return one JSON object with short plain-language fields.',
    'Use only facts in the supplied JSON. Do not invent files, metrics, citations, compiler facts, or features.',
    'For generate_ui, every screen must connect to a supplied input, action, or output and screens must not be empty.',
    'Respond with raw JSON only.',
    `Project JSON:\n${JSON.stringify({ project, input })}`,
  ].join('\n');
  const result = await model.generateContent(instruction);
  const text = result.response.text();
  const parsed = parseJson(text);
  if (task === 'generate_ui' && (!Array.isArray(parsed?.screens) || parsed.screens.length === 0)) {
    throw new Error('Firebase AI Logic returned no interface screens. Check that AI Logic is enabled for this Firebase project.');
  }
  return parsed;
}
