export const WORKFLOW_STAGES = [
  { id: 'profile', label: 'Start', shortLabel: 'Start', nextAction: 'Describe your project idea' },
  { id: 'idea', label: 'Idea', shortLabel: 'Idea', nextAction: 'Discover relevant problems and research' },
  { id: 'research', label: 'Discover', shortLabel: 'Discover', nextAction: 'Define the project you want to build' },
  { id: 'define', label: 'Define', shortLabel: 'Define', nextAction: 'Start building the project' },
  { id: 'build', label: 'Build', shortLabel: 'Build', nextAction: 'Create the project interface' },
  { id: 'ui', label: 'UI', shortLabel: 'UI', nextAction: 'Generate project notes' },
  { id: 'notes', label: 'Notes', shortLabel: 'Notes', nextAction: 'Create the presentation' },
  { id: 'present', label: 'Present', shortLabel: 'Present', nextAction: 'Export the finished project' },
  { id: 'export', label: 'Export', shortLabel: 'Export', nextAction: 'Project complete' },
];

export const getStageIndex = (stageId) =>
  Math.max(0, WORKFLOW_STAGES.findIndex((stage) => stage.id === stageId));

export const getStage = (stageId) =>
  WORKFLOW_STAGES.find((stage) => stage.id === stageId) || WORKFLOW_STAGES[0];

export const getNextStage = (stageId) => {
  const nextIndex = getStageIndex(stageId) + 1;
  return WORKFLOW_STAGES[nextIndex] || null;
};
