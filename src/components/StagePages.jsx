import React from 'react';
import { Download, ExternalLink, FileText, GitBranch, Layout, NotebookPen } from 'lucide-react';
import { StageScaffold } from './StageScaffold';
import { useProject } from '../context/ProjectContext';

const EmptyStage = ({ icon: Icon, color, eyebrow, title, description, children, actionLabel, onAction }) => (
  <StageScaffold eyebrow={eyebrow} title={title} description={description} actionLabel={actionLabel} onAction={onAction}>
    <section className="glass-panel stage-card empty-stage">
      <div className="empty-stage-icon" style={{ color }}><Icon size={26} /></div>
      <h2>{title}</h2>
      <p>{description}</p>
      {children}
    </section>
  </StageScaffold>
);

export const UIPage = () => {
  const { setActiveStep } = useProject();
  return (
    <EmptyStage
      icon={Layout}
      color="#10B981"
      eyebrow="Stage 6 · UI"
      title="Create the project interface"
      description="The UI builder will derive inputs and outputs from the project code, then let you arrange them for phone and desktop."
      actionLabel="Generate project notes"
      onAction={() => setActiveStep('notes')}
    >
      <div className="ui-schema-preview">
        <span>Input</span><span>→</span><span>Action</span><span>→</span><span>Result</span>
      </div>
    </EmptyStage>
  );
};

export const NotesPage = () => {
  const { setActiveStep, projectNotes, setProjectNotes, idea } = useProject();
  const notes = projectNotes || `## ${idea.domain || 'Project'}\n\nProject notes will be generated from the verified project definition, code, research, and test results.`;
  return (
    <EmptyStage
      icon={NotebookPen}
      color="#F59E0B"
      eyebrow="Stage 7 · Notes"
      title="Understand what you built"
      description="Keep short, useful notes about the project, architecture, important code, research, and decisions."
      actionLabel="Create the presentation"
      onAction={() => setActiveStep('present')}
    >
      <textarea className="textarea-field notes-editor" value={notes} onChange={(e) => setProjectNotes(e.target.value)} />
    </EmptyStage>
  );
};

export const ExportPage = () => {
  const { project, codeSamples, researchGraph, projectNotes, exportProject } = useProject();
  const files = ['src/', 'ui/', 'research/', 'notes/project-notes.md', 'presentation/main.tex', 'README.md', 'project-context.json'];
  return (
    <StageScaffold
      eyebrow="Stage 9 · Export"
      title="Your project is ready to take out"
      description="Prepare the project files, notes, presentation, and context for download or GitHub publishing."
    >
      <div className="stage-grid two-column">
        <section className="glass-panel stage-card">
          <div className="card-heading"><Download size={18} color="#67E8F9" /><span>Export package</span></div>
          <div className="file-tree">{files.map((file) => <div key={file}><FileText size={14} /> {file}</div>)}</div>
          <button className="btn-primary full-width" onClick={() => exportProject('json')}><Download size={16} /> Download project context</button>
        </section>
        <section className="glass-panel stage-card">
          <div className="card-heading"><GitBranch size={18} color="#A5B4FC" /><span>GitHub publishing</span></div>
          <p className="muted-copy">Git publishing will use the verified export manifest and require confirmation before creating a repository or pushing changes.</p>
          <button className="btn-secondary full-width" disabled><GitBranch size={16} /> Connect GitHub in backend</button>
          <div className="export-facts">
            <span>{project?.id || 'local-project'}</span>
            <span>{researchGraph.length} research sources</span>
            <span>{Object.keys(codeSamples || {}).length} code workspaces</span>
            <span>{projectNotes ? 'Notes ready' : 'Notes pending'}</span>
          </div>
        </section>
      </div>
      <div className="export-disclaimer"><ExternalLink size={15} /> Sharing integrations are connected only after the export package is verified.</div>
    </StageScaffold>
  );
};
