import React from 'react';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  FileText,
  GitBranch,
  Lightbulb,
  Layout,
  Network,
  Presentation,
  Sparkles,
  User,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { WORKFLOW_STAGES, getStageIndex } from '../workflow/stages';

const ICONS = { profile: User, idea: Lightbulb, research: BookOpen, define: FileText, build: Code2, ui: Layout, notes: FileText, present: Presentation, export: GitBranch };

export const Navigation = () => {
  const { activeStep, setActiveStep, profile, completedStages, setIsInspectorOpen } = useProject();
  const currentIndex = getStageIndex(activeStep);

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="brand-lockup">
          <div className="brand-mark"><Sparkles size={19} /></div>
          <div>
            <div className="brand-title">AI Project Notebook <span className="badge badge-indigo brand-badge">Workspace</span></div>
            <div className="brand-subtitle">{profile.name || 'Your project'} · continuous build workflow</div>
          </div>
        </div>

        <nav className="workflow-nav" aria-label="Project workflow">
          {WORKFLOW_STAGES.map((stage, index) => {
            const Icon = ICONS[stage.id] || FileText;
            const isCurrent = activeStep === stage.id;
            const isComplete = completedStages.includes(stage.id) || index < currentIndex;
            return (
              <button
                className={`workflow-nav-item${isCurrent ? ' current' : ''}${isComplete ? ' complete' : ''}`}
                key={stage.id}
                onClick={() => setActiveStep(stage.id)}
                aria-current={isCurrent ? 'step' : undefined}
              >
                {isComplete ? <CheckCircle2 size={15} /> : <Icon size={15} />}
                <span>{stage.shortLabel}</span>
              </button>
            );
          })}
        </nav>

        <button className="btn-secondary context-button" onClick={() => setIsInspectorOpen(true)}>
          <Network size={16} color="#06B6D4" /> Project context
        </button>
      </div>
    </header>
  );
};
