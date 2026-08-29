import React from 'react';
import { CheckCircle2, FileText, Layers3 } from 'lucide-react';
import { StageScaffold } from './StageScaffold';
import { useProject } from '../context/ProjectContext';

export const DefinePage = () => {
  const { idea, profile, setActiveStep, projectDefinition, setProjectDefinition } = useProject();
  const definition = projectDefinition || {
    title: `${idea.domain || 'Project'} Notebook`,
    problem: idea.problem,
    objective: idea.objective,
    solution: idea.proposedApproach,
    novelty: 'To be refined after implementation and evaluation.',
  };

  const update = (field, value) => setProjectDefinition({ ...definition, [field]: value });

  return (
    <StageScaffold
      eyebrow="Stage 4 · Define"
      title="Make the project clear"
      description="Turn the selected problem and research into a project plan you can actually build."
      actionLabel="Start building the project"
      onAction={() => setActiveStep('build')}
    >
      <div className="stage-grid two-column">
        <section className="glass-panel stage-card">
          <div className="card-heading"><FileText size={18} color="#67E8F9" /><span>Project definition</span></div>
          <label className="field-label">Project title</label>
          <input className="input-field" value={definition.title || ''} onChange={(e) => update('title', e.target.value)} />
          <label className="field-label">Problem</label>
          <textarea className="textarea-field compact" value={definition.problem || ''} onChange={(e) => update('problem', e.target.value)} />
          <label className="field-label">Objective</label>
          <textarea className="textarea-field compact" value={definition.objective || ''} onChange={(e) => update('objective', e.target.value)} />
        </section>

        <section className="glass-panel stage-card">
          <div className="card-heading"><Layers3 size={18} color="#A5B4FC" /><span>Build direction</span></div>
          <label className="field-label">Proposed solution</label>
          <textarea className="textarea-field compact" value={definition.solution || ''} onChange={(e) => update('solution', e.target.value)} />
          <label className="field-label">What is new?</label>
          <textarea className="textarea-field compact" value={definition.novelty || ''} onChange={(e) => update('novelty', e.target.value)} />
          <div className="fact-list">
            <div><CheckCircle2 size={15} color="#10B981" /> Language: {profile.preferredLanguage || idea.techStack?.[0] || 'Choose during build'}</div>
            <div><CheckCircle2 size={15} color="#10B981" /> Research and requirements stay linked to this definition.</div>
          </div>
        </section>
      </div>
    </StageScaffold>
  );
};
