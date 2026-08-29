export const AGENT_TASKS = {
  interpret_idea: 'Translate the user\'s natural-language idea into a small, editable project definition.',
  summarize_source: 'Explain what a source actually did, its useful method, and its limits in plain language.',
  explain_code: 'Explain the selected code in the context of the project and the learner\'s level.',
  explain_build_error: 'Turn a compiler or runtime diagnostic into a clear cause, evidence, and next action.',
  generate_code: 'Generate a small, relevant, compilable multi-file project stack from the verified project definition.',
  generate_ui: 'Generate a practical, accessible interface plan from the verified project inputs and outputs.',
  write_notes: 'Create short human-readable project notes from verified project facts.',
  write_slides: 'Create a concise presentation outline from verified project facts and results.',
};

export const isAgentTask = (task) => Object.prototype.hasOwnProperty.call(AGENT_TASKS, task);
