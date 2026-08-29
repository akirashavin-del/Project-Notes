import { isAgentTask } from './ai/prompts.mjs';
import { runADKTask } from './adkBridge.mjs';
import { compileSource } from './toolchains.mjs';

export async function runAgentTask({ task, input, project }) {
  if (task === 'compile_code') return compileSource(input || {});
  if (!isAgentTask(task)) throw new Error(`Unknown agent task: ${task}`);
  return runADKTask({ task, input, project });
}
