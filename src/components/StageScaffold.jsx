import React from 'react';
import { ArrowRight, CheckCircle2, Circle, Save } from 'lucide-react';
import { getStage, WORKFLOW_STAGES } from '../workflow/stages';
import { useProject } from '../context/ProjectContext';

export const StageScaffold = ({ children, eyebrow, title, description, actionLabel, onAction }) => {
  const { activeStep, completedStages, lastSavedAt } = useProject();
  const currentStage = getStage(activeStep);

  return (
    <div className="stage-page animate-fade-in">
      <div className="stage-header">
        <div>
          <div className="badge badge-indigo stage-eyebrow">{eyebrow || currentStage.label}</div>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <div className="save-status">
          <Save size={14} />
          {lastSavedAt ? 'Saved locally' : 'Ready to save'}
        </div>
      </div>

      <div className="workflow-progress" aria-label="Project progress">
        {WORKFLOW_STAGES.map((stage, index) => {
          const complete = completedStages.includes(stage.id);
          const current = stage.id === activeStep;
          return (
            <React.Fragment key={stage.id}>
              <div className={`progress-step${current ? ' current' : ''}${complete ? ' complete' : ''}`}>
                {complete ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                <span>{stage.shortLabel}</span>
              </div>
              {index < WORKFLOW_STAGES.length - 1 && <div className={`progress-line${complete ? ' complete' : ''}`} />}
            </React.Fragment>
          );
        })}
      </div>

      <div className="stage-content">{children}</div>

      {actionLabel && (
        <div className="next-action-card glass-panel-glow">
          <div>
            <span className="next-action-label">NEXT STEP</span>
            <strong>{actionLabel}</strong>
          </div>
          <button className="btn-primary" onClick={onAction}>
            Continue <ArrowRight size={17} />
          </button>
        </div>
      )}
    </div>
  );
};
