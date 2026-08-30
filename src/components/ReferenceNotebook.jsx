import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  GitBranch,
  LogOut,
  Search,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { getStage, getStageIndex, WORKFLOW_STAGES } from '../workflow/stages';
import { compileCode, publishGithub, runAgentTask, searchResearch } from '../services/agentClient';

const STAGE_NUMBERS = Object.fromEntries(WORKFLOW_STAGES.map((stage, index) => [stage.id, String(index + 1).padStart(2, '0')]));

const StageIntro = ({ stageId, title, subtitle, children }) => (
  <>
    <p className="eyebrow">Stage {STAGE_NUMBERS[stageId]}</p>
    <h1 className="stage-title">{title}</h1>
    <p className="stage-sub">{subtitle}</p>
    {children}
  </>
);

const StageActions = ({ children }) => <div className="stage-actions">{children}</div>;

const PrimaryButton = ({ children, onClick, disabled = false }) => (
  <button className="notebook-btn teal" onClick={onClick} disabled={disabled}>{children}</button>
);

const GhostButton = ({ children, onClick, disabled = false }) => (
  <button className="notebook-btn ghost" onClick={onClick} disabled={disabled}>{children}</button>
);

const ProfileStage = () => {
  const { profile, setProfile, setActiveStep } = useProject();
  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const update = (field, value) => setProfile((current) => ({ ...current, [field]: value }));
  const knowledge = [
    ['Java', profile.languages?.Java],
    ['Python', profile.languages?.Python],
    ['Algorithms', profile.subjects?.Algorithms],
    ['Compilers', profile.subjects?.Compiler],
    ['AI / ML', profile.subjects?.AI],
  ];

  return (
    <section className="notebook-stage">
      <StageIntro stageId="profile" title="Before we start — who’s building this?" subtitle="Tell the notebook what you know. It shapes how deep the research goes, how code gets explained, and what it teaches you along the way." />
      <div className="profile-grid">
        <div className="card card-pad">
          <div className="form-row-2">
            <div><label className="field-label">Name</label><input className="notebook-input" value={profile.name || ''} onChange={(e) => update('name', e.target.value)} /></div>
            <div><label className="field-label">Role / Year</label><input className="notebook-input" value={profile.role || ''} onChange={(e) => update('role', e.target.value)} /></div>
          </div>
          <div className="form-row"><label className="field-label">What I want to build</label><textarea className="notebook-textarea" rows="2" value={profile.goal || ''} onChange={(e) => update('goal', e.target.value)} /></div>
          <div className="form-row"><label className="field-label">What I want to achieve</label><textarea className="notebook-textarea" rows="2" value={profile.achievement || ''} onChange={(e) => update('achievement', e.target.value)} placeholder="Describe the outcome you want." /></div>
          <div className="form-row"><label className="field-label">Preferred explanation level</label><div className="segmented">{levels.map((level) => <button className={profile.overallLevel === level ? 'on' : ''} key={level} onClick={() => update('overallLevel', level)}>{level}</button>)}</div></div>
          <div className="form-row" style={{ marginBottom: 0 }}><label className="field-label">Technical subjects known</label><div className="tag-row"><span className="tag">Data structures</span><span className="tag">Web dev</span><span className="tag">Applied ML</span><span className="tag">+ Add subject</span></div></div>
        </div>
        <div className="card card-pad">
          <p className="rside-title" style={{ marginBottom: 16 }}>Generated knowledge model</p>
          <table className="know-table"><thead><tr><th>Subject</th><th>Level</th></tr></thead><tbody>{knowledge.map(([subject, level]) => <tr key={subject}><td>{subject}</td><td><span className={`lvl-pill lvl-${level || 'Beginner'}`}>{level || 'Beginner'}</span></td></tr>)}</tbody></table>
          <div className="note-box">This controls research depth and code explanations. The notebook will only teach what the current project actually needs.</div>
        </div>
      </div>
      <StageActions><PrimaryButton onClick={() => setActiveStep('idea')}>Continue to Idea <ArrowRight size={15} /></PrimaryButton></StageActions>
    </section>
  );
};

const IdeaStage = () => {
  const { project, idea, setIdea, setActiveStep } = useProject();
  const [interpretState, setInterpretState] = useState({ status: 'idle', error: '' });
  const update = (field, value) => setIdea((current) => ({ ...current, [field]: value }));
  const interpretIdea = async () => {
    setInterpretState({ status: 'running', error: '' });
    try {
      const response = await runAgentTask({ task: 'interpret_idea', project: { id: project?.id || 'idea' }, input: { rawIdea: idea.rawIdea } });
      const res = response.result;
      if (res) {
        setIdea((current) => ({
          ...current,
          problem: res.problem || current.problem,
          objective: res.objective || current.objective,
          domain: res.domain || current.domain,
          proposedApproach: res.proposedApproach || current.proposedApproach,
          expectedOutput: res.expectedOutput || current.expectedOutput,
        }));
      }
      setInterpretState({ status: 'done', error: '' });
    } catch (err) {
      setInterpretState({ status: 'error', error: err.message });
    }
  };
  const chips = [
    ['Problem', idea.problem],
    ['Objective', idea.objective],
    ['Domain', idea.domain],
    ['Proposed approach', idea.proposedApproach],
    ['Expected output', idea.expectedOutput],
    ['Constraints', (idea.constraints || []).join(' · ')],
  ];
  return (
    <section className="notebook-stage">
      <StageIntro stageId="idea" title="Write the idea the way it lives in your head" subtitle="No forms to fight with. Write naturally — the notebook extracts the structure and always shows you what it changed." />
      <div className="idea-flow">
        <div className="card card-pad"><label className="field-label">Original idea</label><textarea className="notebook-textarea idea-textarea" value={idea.rawIdea || ''} onChange={(e) => update('rawIdea', e.target.value)} /></div>
        <div className="flow-arrow"><ArrowRight size={24} /></div>
        <div><div className="card card-pad"><label className="field-label">AI interpretation</label><div className="chip-grid">{chips.map(([key, value]) => <div className="chip-block" key={key}><span className="k">{key}</span><span className="v">{value || 'Not interpreted yet.'}</span></div>)}</div><div className="tag-row" style={{ marginTop: 14 }}>{(idea.unknownConcepts || []).slice(0, 3).map((item) => <span className="tag unknown" key={item}>Unknown: {item}</span>)}{(idea.techStack || []).slice(0, 3).map((item) => <span className="tag" key={item}>Candidate: {item}</span>)}</div></div></div>
      </div>
      {interpretState.status === 'error' && <div className="build-result error" style={{ margin: '12px 0' }}><b>AI interpretation failed</b><span>{interpretState.error}</span></div>}
      <div className="prompt-toggle"><button className="on">Optimized research prompt</button><button>Compare to original</button></div>
      <div className="card card-pad"><textarea className="notebook-textarea" rows="3" value={idea.optimizedPrompt || ''} onChange={(e) => update('optimizedPrompt', e.target.value)} /><p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '10px 0 0' }}>Editable. Your original idea is never replaced — only translated into a sharper research question.</p></div>
      <StageActions><PrimaryButton onClick={() => setActiveStep('research')}>Send to Research <ArrowRight size={15} /></PrimaryButton><GhostButton onClick={interpretIdea} disabled={interpretState.status === 'running'}>{interpretState.status === 'running' ? 'Interpreting...' : 'Re-interpret idea'}</GhostButton></StageActions>
    </section>
  );
};

const LegacyResearchPaperCard = ({ paper, focused, selectedForMatch, note, onSelect, onSave, onToggleNote, onSelectPaper }) => (
  <div className={`card paper-card${focused ? ' selected' : ''}`}>
    <div className="result-head" onClick={onSelect}>
      <div><span className="result-type">Research paper · {paper.year}</span><h3 className="result-title">{paper.title}</h3><p className="paper-meta">{paper.authors} · {paper.source}</p></div>
      <div className="score-badge">{paper.semanticScore ? `${paper.semanticScore}%` : '—'}<span>idea fit</span></div>
    </div>
    <div className="paper-summary"><b>What they did —</b> {paper.whatTheyDid || paper.whyItMatters}</div>
    <div className="paper-bottom"><span className="compatibility-label">Compatibility with your idea <strong>{paper.semanticScore}%</strong></span><button className={`sticky-note-button${note ? ' active' : ''}`} title="Add research note" onClick={onToggleNote}>▧</button></div>
    <div className="result-actions"><GhostButton onClick={onSelect}>{focused ? 'Reading' : 'Read summary'}</GhostButton><GhostButton onClick={onSave}>{paper.saved ? 'Saved' : 'Save'}</GhostButton><button className={`notebook-btn sm${selectedForMatch ? ' teal' : ' ghost'}`} onClick={onSelectPaper}>{selectedForMatch ? 'In match' : 'Add to match'}</button></div>
    {note !== undefined && <div className="paper-note-inline"><label className="field-label">How should this paper help the project?</label><textarea className="notebook-textarea" rows="2" value={note || ''} onChange={(event) => onToggleNote(event.target.value)} placeholder="For example: use this approach for the parser module." /></div>}
  </div>
);

const ResearchPaperCard = ({ paper, focused, selectedForMatch, note, summary, summaryStatus, onSelect, onSave, onToggleNote, onSelectPaper }) => (
  <div className={`card paper-card${focused ? ' selected' : ''}`}>
    <button className="result-head result-head-button" onClick={onSelect}>
      <div><span className="result-type">{paper.sourceType === 'live' ? 'LIVE SOURCE' : 'Research paper'} · {paper.year || 'year unavailable'}</span><h3 className="result-title">{paper.title}</h3><p className="paper-meta">{paper.authors} · {paper.source} · {paper.provider}</p></div>
      <div className="score-badge">{paper.semanticScore ? `${paper.semanticScore}%` : '—'}<span>live fit</span></div>
    </button>
    <div className="paper-summary"><b>{summaryStatus === 'running' ? 'AI is summarizing...' : 'What they did -'}</b> {summary || (summaryStatus === 'error' ? 'The AI summary failed. Open the source to read its verified abstract.' : focused ? (paper.whatTheyDid || 'This live record has no abstract in its provider metadata.') : 'Click Read summary for a simple explanation of the method.')}</div>
    <div className="paper-bottom"><span className="compatibility-label">Compatibility with your idea <strong>{paper.semanticScore || '—'}%</strong></span><button className={`sticky-note-button${note ? ' active' : ''}`} title="Add research note" onClick={onToggleNote}>Note</button></div>
    <div className="result-actions"><GhostButton onClick={onSelect}>{focused ? 'Reading' : 'Read summary'}</GhostButton><GhostButton onClick={onSave}>{paper.saved ? 'Saved' : 'Save'}</GhostButton><button className={`notebook-btn sm${selectedForMatch ? ' teal' : ' ghost'}`} onClick={onSelectPaper}>{selectedForMatch ? 'In match' : 'Add to match'}</button></div>
    {note !== undefined && <div className="paper-note-inline"><label className="field-label">How should this paper help the project?</label><textarea className="notebook-textarea" rows="2" value={note || ''} onChange={(event) => onToggleNote(event.target.value)} placeholder="For example: use this approach for the parser module." /></div>}
  </div>
);

void LegacyResearchPaperCard;

const ProblemCard = ({ problem, selected, onSelect }) => (
  <button className={`card problem-card${selected ? ' selected' : ''}`} onClick={onSelect}>
    <div className="problem-card-top"><span className="result-type">{problem.subject} · {problem.language}</span><span className="problem-rank">{selected ? 'Selected' : 'Choose'}</span></div>
    <h3 className="result-title">{problem.title}</h3>
    <p className="problem-description">{problem.description}</p>
    <div className="tag-row"><span className="tag">{problem.difficulty}</span><span className="tag">{problem.novelty} novelty</span></div>
    <div className="problem-why">{problem.whyItMatters}</div>
  </button>
);

const ResearchStage = () => {
  const {
    project, idea, projectDefinition, problemStatements, researchGraph, selectedProblemIds, selectedPaperIds, researchNotes,
    toggleSaveResearch, toggleSelectProblem, toggleSelectPaper, addResearchNote, mergeResearchPapers, mergeProblemStatements, setProjectDefinition, setActiveStep,
  } = useProject();
  const [filters, setFilters] = useState({ subject: 'All', difficulty: 'All', novelty: 'All', language: 'All' });
  const [query, setQuery] = useState('');
  const [researchState, setResearchState] = useState({ status: 'idle', message: '', scholarUrl: '' });
  const [openNoteId, setOpenNoteId] = useState(null);
  const [paperSummaries, setPaperSummaries] = useState({});
  const [selectedPaperId, setSelectedPaperId] = useState(researchGraph[0]?.id);
  const selectedProblems = problemStatements.filter((problem) => selectedProblemIds.includes(problem.id));
  const selectedPapers = researchGraph.filter((paper) => selectedPaperIds.includes(paper.id));
  const filteredProblems = problemStatements.filter((problem) => (
    (filters.subject === 'All' || problem.subject === filters.subject) &&
    (filters.difficulty === 'All' || problem.difficulty === filters.difficulty) &&
    (filters.novelty === 'All' || problem.novelty === filters.novelty) &&
    (filters.language === 'All' || problem.language === filters.language) &&
    (!query || `${problem.title} ${problem.description}`.toLowerCase().includes(query.toLowerCase()))
  ));
  const matchScore = selectedProblems.length && selectedPapers.length
    ? Math.round((selectedProblems.reduce((sum, problem) => sum + (problem.novelty === 'High' ? 90 : 80), 0) / selectedProblems.length + selectedPapers.reduce((sum, paper) => sum + paper.semanticScore, 0) / selectedPapers.length) / 2)
    : 0;
  const renderMatch = () => {
    const problem = selectedProblems[0] || problemStatements[0];
    const paperNames = selectedPapers.length ? selectedPapers.map((paper) => paper.title).join('; ') : 'the selected research papers';
    setProjectDefinition({
      title: `${problem.subject}: ${problem.title}`,
      problem: problem.description,
      objective: `Build a simple, testable project that addresses this problem and explains how it uses the selected research.`,
      solution: `Use the approach described by ${paperNames}. Start with a small working implementation, then evaluate it against the project requirements.`,
      novelty: problem.novelty === 'High' ? 'High novelty direction; validate the exact contribution during research and testing.' : 'A practical combination of an existing problem and selected research.',
      selectedProblemIds,
      selectedPaperIds,
    });
    setActiveStep('define');
  };
  const updateNote = (paperId, value) => addResearchNote({ paperId, text: value, updatedAt: new Date().toISOString() });
  const summarizePaper = async (paper) => {
    setSelectedPaperId(paper.id);
    if (!paper.abstract || paperSummaries[paper.id]) return;
    setPaperSummaries((current) => ({ ...current, [paper.id]: { status: 'running' } }));
    try {
      const response = await runAgentTask({ task: 'summarize_source', project: { id: project.id, idea, projectDefinition }, input: { title: paper.title, authors: paper.authors, source: paper.source, abstract: paper.abstract } });
      const result = response.result;
      const summary = typeof result === 'string' ? result : result?.summary || result?.whatTheyDid || result?.explanation;
      setPaperSummaries((current) => ({ ...current, [paper.id]: { status: summary ? 'done' : 'error', text: summary || '' } }));
    } catch {
      setPaperSummaries((current) => ({ ...current, [paper.id]: { status: 'error' } }));
    }
  };
  const searchSources = async () => {
    const selectedFilters = Object.entries(filters).filter(([, value]) => value !== 'All').map(([key, value]) => `${key}: ${value}`).join(', ');
    const searchQuery = [query.trim() || idea.optimizedPrompt || idea.rawIdea || 'research methods for this project', selectedFilters].filter(Boolean).join(' | ');
    setResearchState({ status: 'running', message: '', scholarUrl: '' });
    try {
      const response = await searchResearch({ query: searchQuery, limit: 8 });
      const results = response.result.results || [];
      mergeResearchPapers(results);
      mergeProblemStatements(response.result.problemStatements || []);
      const count = results.length;
      const msg = count > 0 ? `${count} live research paper records retrieved.` : 'No research papers found for this query.';
      setResearchState({ status: 'done', message: msg, scholarUrl: response.result.providers?.googleScholar?.searchUrl });
    } catch (error) {
      setResearchState({ status: 'error', message: error.message, scholarUrl: '' });
    }
  };

  return <section className="notebook-stage">
    <div className="research-search-actions"><button className="notebook-btn teal" onClick={searchSources} disabled={researchState.status === 'running'}>{researchState.status === 'running' ? 'Searching sources…' : 'Search research sources'}</button>{researchState.scholarUrl && <a className="research-scholar-link" href={researchState.scholarUrl} target="_blank" rel="noreferrer">Open Google Scholar results</a>}{researchState.message && <span className={`research-search-message ${researchState.status}`}>{researchState.message}</span>}</div>
    <StageIntro stageId="research" title="Find a problem, then connect it to research" subtitle="Choose a focused problem on the left. Read what the research actually did on the right. Add both to your match and the project fit updates below." />
    <div className="discover-toolbar"><div className="discover-search"><Search size={15} /><input className="notebook-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search problem statements or research" /></div><select className="notebook-select" value={filters.subject} onChange={(event) => setFilters({ ...filters, subject: event.target.value })}><option>All</option><option>DSA</option><option>Compilers</option><option>Software Engineering</option></select><select className="notebook-select" value={filters.difficulty} onChange={(event) => setFilters({ ...filters, difficulty: event.target.value })}><option>All</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select><select className="notebook-select" value={filters.novelty} onChange={(event) => setFilters({ ...filters, novelty: event.target.value })}><option>All</option><option>High</option><option>Medium</option></select><select className="notebook-select" value={filters.language} onChange={(event) => setFilters({ ...filters, language: event.target.value })}><option>All</option><option>C</option><option>Python</option><option>Java</option></select></div>
    <div className="discover-layout"><div className="discover-column"><div className="column-heading"><span>NEW / NOVEL PROBLEM STATEMENTS</span><span>{filteredProblems.length} found</span></div>{filteredProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} selected={selectedProblemIds.includes(problem.id)} onSelect={() => toggleSelectProblem(problem.id)} />)}{filteredProblems.length === 0 && <div className="card card-pad live-empty">No live problem statements yet. Search the selected topic to derive candidates from current provider records.</div>}</div><div className="discover-column"><div className="column-heading"><span>RESEARCH RELATED TO THESE PROBLEMS</span><span>{selectedPapers.length} in match</span></div>{researchGraph.map((paper) => { const summary = paperSummaries[paper.id]; return <ResearchPaperCard key={paper.id} paper={paper} focused={selectedPaperId === paper.id} selectedForMatch={selectedPaperIds.includes(paper.id)} summary={summary?.text} summaryStatus={summary?.status} note={openNoteId === paper.id ? (researchNotes.find((item) => item.paperId === paper.id)?.text || '') : undefined} onSelect={() => summarizePaper(paper)} onSave={() => toggleSaveResearch(paper.id)} onSelectPaper={() => toggleSelectPaper(paper.id)} onToggleNote={(value) => { if (typeof value === 'string') updateNote(paper.id, value); else setOpenNoteId(openNoteId === paper.id ? null : paper.id); }} />; })}{researchGraph.length === 0 && <div className="card card-pad live-empty">No live papers loaded. Search to query OpenAlex, Semantic Scholar, Crossref, Europe PMC, and arXiv.</div>}</div></div>
    <div className="match-panel card"><div><span className="result-type">LIVE PROJECT MATCH</span><h2 className="match-title">{matchScore ? `${matchScore}% compatible with your current idea` : 'Choose a problem and at least one paper'}</h2><p className="match-copy">{selectedProblems.length ? `${selectedProblems.length} problem${selectedProblems.length > 1 ? 's' : ''}` : 'No problem selected'} + {selectedPapers.length ? `${selectedPapers.length} research paper${selectedPapers.length > 1 ? 's' : ''}` : 'no paper selected'}</p></div><div className="match-meter"><strong>{matchScore || '—'}</strong><span>project fit</span></div></div>
    <div className="render-project card card-pad"><div><span className="result-type">RENDER SELECTED COMBINATION</span><h2 className="subsection-title">A simple project you can understand</h2><p className="subsection-sub">This is a plain-language render of the choices above. You can edit it on the next stage.</p></div><div className="render-columns"><div><span className="field-label">Problem</span><p>{selectedProblems[0]?.description || 'Select a problem statement to render it here.'}</p></div><div><span className="field-label">Project direction</span><p>{selectedProblems.length && selectedPapers.length ? `Build ${selectedProblems[0].title.toLowerCase()} using the selected research as guidance, then test and explain the result.` : 'Select a problem and research paper to create the project direction.'}</p></div></div><StageActions><PrimaryButton onClick={renderMatch} disabled={!selectedProblems.length || !selectedPapers.length}>Use this combination <ArrowRight size={15} /></PrimaryButton></StageActions></div>
    <StageActions><GhostButton onClick={() => setActiveStep('define')}>Skip matching and define manually</GhostButton></StageActions>
  </section>;
};

const DefineStage = () => {
  const { idea, projectDefinition, setProjectDefinition, setActiveStep } = useProject();
  const value = projectDefinition || { title: idea.domain || 'New project', problem: idea.problem, objective: idea.objective, solution: idea.proposedApproach, novelty: 'Describe what makes this project different.' };
  const update = (field, next) => setProjectDefinition({ ...value, [field]: next });
  return <section className="notebook-stage"><StageIntro stageId="define" title="Make the project clear before you build it" subtitle="Turn the idea, selected problem, and research into a definition that can guide code and evaluation." /><div className="define-grid"><div className="card card-pad"><label className="field-label">Project title</label><input className="notebook-input" value={value.title || ''} onChange={(e) => update('title', e.target.value)} /><label className="field-label">Problem statement</label><textarea className="notebook-textarea" rows="4" value={value.problem || ''} onChange={(e) => update('problem', e.target.value)} /><label className="field-label">Objective</label><textarea className="notebook-textarea" rows="4" value={value.objective || ''} onChange={(e) => update('objective', e.target.value)} /></div><div className="card card-pad"><label className="field-label">Proposed solution</label><textarea className="notebook-textarea" rows="5" value={value.solution || ''} onChange={(e) => update('solution', e.target.value)} /><label className="field-label">What is new?</label><textarea className="notebook-textarea" rows="5" value={value.novelty || ''} onChange={(e) => update('novelty', e.target.value)} /><div className="note-box">This definition becomes the source of truth for the build, notes, presentation, and export.</div></div></div><StageActions><PrimaryButton onClick={() => setActiveStep('build')}>Start Building <ArrowRight size={15} /></PrimaryButton></StageActions></section>;
};

const LegacyBuildStage = () => {
  const { project, idea, projectDefinition, code, activeLanguage, selectedCode, setSelectedCode, explanationDepth, setExplanationDepth, setActiveStep } = useProject();
  const [compileState, setCompileState] = useState({ status: 'idle', result: null, error: '' });
  const [teacherState, setTeacherState] = useState({ status: 'idle', result: null, error: '' });
  const lines = (code || '# Start writing your project').split('\n');
  const explanations = { Beginner: 'This block goes through the input one item at a time and builds a result that the next part of the project can use.', Intermediate: 'This performs a linear traversal and maintains an accumulator. Its output feeds the next project block.', Advanced: 'This is a loop-carried reduction with an explicit dependency from each iteration to the next.', Adaptive: 'Select a code line to see a project-aware explanation at your level.' };
  const highlighted = selectedCode ? lines.findIndex((line) => line === selectedCode) : -1;
  const verifyCode = async () => { setCompileState({ status: 'running', result: null, error: '' }); try { setCompileState({ status: 'done', result: await compileCode({ language: activeLanguage, code }), error: '' }); } catch (error) { setCompileState({ status: 'error', result: null, error: error.message }); } };
  const explainWithAI = async () => { if (!selectedCode) return; setTeacherState({ status: 'running', result: null, error: '' }); try { setTeacherState({ status: 'done', result: await runAgentTask({ task: 'explain_code', project: { id: project.id, idea, projectDefinition }, input: { language: activeLanguage, code: selectedCode, level: explanationDepth } }), error: '' }); } catch (error) { setTeacherState({ status: 'error', result: null, error: error.message }); } };
  const compilerMessage = compileState.result?.result;
  const teacherText = teacherState.result?.result;
  return <section className="notebook-stage"><StageIntro stageId="build" title="Code on top, a teacher underneath" subtitle="Highlight any block and the AI Teacher explains it in context — of the whole program, and of what you already know." /><div className="build-split"><div className="code-pane"><div className="code-toolbar"><span className="filename">main.{activeLanguage === 'javascript' ? 'js' : activeLanguage === 'java' ? 'java' : 'py'}</span><span>{activeLanguage} · select a line to explain</span><button className="notebook-btn sm ghost" onClick={verifyCode} disabled={compileState.status === 'running'}>{compileState.status === 'running' ? 'Verifying…' : 'Verify with compiler'}</button></div><div className="code-body">{lines.slice(0, 14).map((line, index) => <button className={`code-line${highlighted === index ? ' hl' : ''}`} key={`${index}-${line}`} onClick={() => setSelectedCode(line)}><span className="ln">{index + 1}</span><span>{line || ' '}</span></button>)}</div>{compileState.status !== 'idle' && <div className={`build-result ${compileState.status}`}><b>{compileState.status === 'done' && compilerMessage?.verified ? 'Compiler verified this file.' : compileState.status === 'running' ? 'Running the configured toolchain…' : 'Compiler verification failed.'}</b><span>{compilerMessage?.stderr || compileState.error || compilerMessage?.stdout || 'No diagnostic output.'}</span></div>}</div><div className="teacher-pane"><div className="teacher-head"><span className="who">● AI Teacher {selectedCode ? `— explaining line ${highlighted + 1}` : '— waiting for a selection'}</span><div className="lvl-tabs">{['Beginner', 'Intermediate', 'Advanced'].map((level) => <button className={explanationDepth === level ? 'on' : ''} key={level} onClick={() => setExplanationDepth(level)}>{level}</button>)}</div></div><div className="teacher-body"><div className="explain-text">{teacherText ? (teacherText.explanation || teacherText.summary || JSON.stringify(teacherText)) : selectedCode ? explanations[explanationDepth] : explanations.Adaptive}</div><div className="explain-meta"><div className="meta-row"><span className="k">Selected code</span>{selectedCode || 'Nothing selected'}</div><div className="meta-row"><span className="k">Produces</span>Project output for the next stage</div><div className="meta-row"><span className="k">Depends on</span>Current file and project definition</div><div className="meta-row"><span className="k">Status</span>{teacherState.status === 'error' ? teacherState.error : teacherState.status === 'done' ? 'AI explanation ready' : 'Deterministic explanation shown'}</div></div><StageActions><GhostButton onClick={explainWithAI} disabled={!selectedCode || teacherState.status === 'running'}>{teacherState.status === 'running' ? 'Asking teacher…' : 'Ask AI teacher'}</GhostButton></StageActions></div></div></div><div className="subsection"><h3 className="subsection-title">Baseline optimizer</h3><p className="subsection-sub">Nothing changes silently — every suggestion will show what changed, why, and what it risks.</p><div className="card"><div className="optimize-grid"><div className="opt-col"><span className="k">Current</span><div className="opt-code">sum = 0{`\n`}for item in arr:{`\n`}    sum += item</div></div><div className="opt-col" style={{ borderLeft: '1px solid var(--line)' }}><span className="k">Suggested</span><div className="opt-code">total = sum(arr)</div></div></div><div className="card-pad" style={{ paddingTop: 0 }}><div className="why-box"><b>Why it may be better —</b> The suggestion is shown as a diff and must be formatted, compiled, tested, and accepted by you before it changes the project.</div><div className="result-actions"><GhostButton>Accept after verification</GhostButton><GhostButton>Reject</GhostButton><GhostButton>Compare</GhostButton></div></div></div></div><div className="subsection"><h3 className="subsection-title">Explainable error</h3><p className="subsection-sub">Errors are taught, not just reported.</p><div className="card error-card card-pad"><div className="error-pipeline"><span className="step">compiler/runtime</span><span className="arrow">→</span><span className="step">normalizer</span><span className="arrow">→</span><span className="step">structured error</span><span className="arrow">→</span><span className="step">plain explanation</span></div><div className="explain-final">No verified error has been recorded for this project yet. When a compiler or runtime run fails, its exact diagnostic will be shown here and explained without changing the source automatically.</div></div></div><StageActions><PrimaryButton onClick={() => setActiveStep('ui')}>Continue to UI <ArrowRight size={15} /></PrimaryButton></StageActions></section>;
};

const BuildStage = () => {
  const { project, idea, projectDefinition, code, codeFiles, activeFileId, activeLanguage, switchFile, replaceCodeFiles, updateCode, selectedCode, setSelectedCode, explanationDepth, setExplanationDepth, setActiveStep } = useProject();
  const [compileState, setCompileState] = useState({ status: 'idle', result: null, error: '' });
  const [teacherState, setTeacherState] = useState({ status: 'idle', result: null, error: '' });
  const [errorTeacherState, setErrorTeacherState] = useState({ status: 'idle', result: null, error: '' });
  const [generationState, setGenerationState] = useState({ status: 'idle', error: '' });
  const [stdin, setStdin] = useState('');
  const lines = (code || '').split('\n');
  const files = (codeFiles || []).filter((file) => ['python', 'c', 'java', 'javascript', 'markdown'].includes(file.language));
  const activeFile = files.find((file) => file.id === activeFileId) || files[0];
  const fileName = activeFile?.path || 'src/main.py';
  const explanations = { Beginner: 'This line is one small step in the program. Follow its input and output before changing it.', Intermediate: 'This line transforms data for the next step. Check its type and value at this boundary.', Advanced: 'This line is part of the program dependency chain. Its output must satisfy the next operation.', Adaptive: 'Select a line to see a project-aware explanation at your level.' };
  const highlighted = selectedCode ? lines.findIndex((line) => line === selectedCode) : -1;
  const selectLine = (event) => {
    const position = event.currentTarget.selectionStart || 0;
    const line = code.slice(0, position).split('\n').length - 1;
    setSelectedCode(lines[line] || '');
  };
  const verifyCode = async () => {
    if (activeFile?.role !== 'entry') { setCompileState({ status: 'error', result: null, error: 'Select an entry file to compile. Test and support files stay in the stack for context.' }); return; }
    setCompileState({ status: 'running', result: null, error: '' });
    setErrorTeacherState({ status: 'idle', result: null, error: '' });
    try { setCompileState({ status: 'done', result: await compileCode({ language: activeLanguage, code, stdin }), error: '' }); }
    catch (error) { setCompileState({ status: 'error', result: null, error: error.message }); }
  };
  const generateStack = async () => {
    setGenerationState({ status: 'running', error: '' });
    try {
      const response = await runAgentTask({ task: 'generate_code', project: { id: project.id, idea, projectDefinition }, input: { language: activeLanguage, requestedFiles: 'small runnable entry file, one focused test or helper file, and a README', existingFiles: codeFiles.map((file) => ({ path: file.path, language: file.language, role: file.role, content: (file.content || '').slice(0, 1200) })) } });
      const files = response.result?.files;
      if (!Array.isArray(files)) throw new Error('The AI returned an invalid file stack.');
      replaceCodeFiles(files);
      setGenerationState({ status: 'done', error: '' });
    } catch (error) { setGenerationState({ status: 'error', error: error.message }); }
  };
  const explainWithAI = async () => {
    if (!selectedCode) return;
    setTeacherState({ status: 'running', result: null, error: '' });
    try { setTeacherState({ status: 'done', result: await runAgentTask({ task: 'explain_code', project: { id: project.id, idea, projectDefinition }, input: { language: activeLanguage, code, selectedCode, level: explanationDepth } }), error: '' }); }
    catch (error) { setTeacherState({ status: 'error', result: null, error: error.message }); }
  };
  const explainBuildErrorWithAI = async () => {
    const diagnostic = compilerMessage?.stderr || compileState.error || compilerMessage?.stdout || 'Compiler error detected.';
    setErrorTeacherState({ status: 'running', result: null, error: '' });
    try {
      const response = await runAgentTask({
        task: 'explain_build_error',
        project: { id: project.id, idea, projectDefinition },
        input: { language: activeLanguage, code, diagnostic }
      });
      setErrorTeacherState({ status: 'done', result: response.result, error: '' });
    } catch (err) {
      setErrorTeacherState({ status: 'error', result: null, error: err.message });
    }
  };

  const compilerMessage = compileState.result?.result;
  const teacherText = teacherState.result?.result;
  const errorText = errorTeacherState.result;

  return <section className="notebook-stage">
    <StageIntro stageId="build" title="Build in small, readable files" subtitle="Edit the real source, select any line, compile it online, and see the exact output before asking the AI teacher." />
    <div className="build-split build-workspace">
      <div className="code-pane">
        <div className="code-toolbar"><div><span className="filename">{fileName}</span><span className="code-mode">{activeLanguage} · editable source</span></div><button className="notebook-btn sm ghost" onClick={verifyCode} disabled={compileState.status === 'running'}>{compileState.status === 'running' ? 'Compiling…' : 'Compile & run'}</button></div>
        <div className="code-file-stack"><span className="field-label">FILE STACK</span>{files.map((file) => <button key={file.id} className={`code-file-tab${activeFileId === file.id ? ' active' : ''}`} onClick={() => switchFile(file.id)}>{file.path}</button>)}<button className="code-file-generate" onClick={generateStack} disabled={generationState.status === 'running'}>{generationState.status === 'running' ? 'Generating...' : 'Generate stack with AI'}</button></div>
        {generationState.status === 'error' && <div className="build-result error"><b>AI file generation failed</b><span>{generationState.error}</span></div>}
        <div className="code-editor-wrap"><div className="code-gutter" aria-hidden="true">{lines.map((_, index) => <span className={highlighted === index ? 'active' : ''} key={index}>{index + 1}</span>)}</div><textarea className="code-editor" aria-label={`${fileName} source code`} value={code} onChange={(event) => updateCode(event.target.value)} onSelect={selectLine} spellCheck="false" /></div>
        <div className="compiler-input"><label className="field-label" htmlFor="compiler-stdin">STANDARD INPUT (OPTIONAL)</label><textarea id="compiler-stdin" className="notebook-textarea" rows="2" value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder="Values passed to the program at run time" /></div>
        {compileState.status !== 'idle' && <div className={`compile-output ${compileState.status}`}><div className="compile-output-head"><b>{compileState.status === 'done' && compilerMessage?.verified ? 'Online compiler accepted this file.' : compileState.status === 'running' ? 'Running the configured online compiler…' : 'Compiler returned an error.'}</b>{compilerMessage?.status && <span>{compilerMessage.status} · exit {compilerMessage.exitCode ?? '—'}</span>}</div><div className="output-grid"><div><span className="field-label">PROGRAM OUTPUT</span><pre>{compilerMessage?.stdout || '(no stdout)'}</pre></div><div><span className="field-label">DIAGNOSTIC</span><pre>{compilerMessage?.stderr || compileState.error || '(no diagnostic)'}</pre></div></div>{(!compilerMessage?.verified || compileState.status === 'error' || compilerMessage?.stderr) && <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center' }}><button className="notebook-btn sm teal" onClick={explainBuildErrorWithAI} disabled={errorTeacherState.status === 'running'}>{errorTeacherState.status === 'running' ? 'Analyzing diagnostic...' : 'Explain diagnostic with AI'}</button>{errorTeacherState.status === 'error' && <span className="research-search-message error">{errorTeacherState.error}</span>}</div>}</div>}
      </div>
      <div className="teacher-pane"><div className="teacher-head"><span className="who">● AI Teacher {selectedCode ? `— line ${highlighted + 1}` : '— select a line'}</span><div className="lvl-tabs">{['Beginner', 'Intermediate', 'Advanced'].map((level) => <button className={explanationDepth === level ? 'on' : ''} key={level} onClick={() => setExplanationDepth(level)}>{level}</button>)}</div></div><div className="teacher-body"><div className="explain-text">{teacherText ? (teacherText.explanation || teacherText.summary || JSON.stringify(teacherText)) : selectedCode ? explanations[explanationDepth] : explanations.Adaptive}</div><div className="explain-meta"><div className="meta-row"><span className="k">Selected code</span>{selectedCode || 'Nothing selected'}</div><div className="meta-row"><span className="k">Produces</span>Compiler output and the next project step</div><div className="meta-row"><span className="k">Depends on</span>{fileName} and the current project definition</div><div className="meta-row"><span className="k">Status</span>{teacherState.status === 'error' ? teacherState.error : teacherState.status === 'done' ? 'AI explanation ready' : 'Ready'}</div></div><StageActions><GhostButton onClick={explainWithAI} disabled={!selectedCode || teacherState.status === 'running'}>{teacherState.status === 'running' ? 'Asking teacher…' : 'Ask AI teacher'}</GhostButton></StageActions></div></div>
    </div>
    {compileState.status !== 'idle' && <div className="compile-flow" role="img" aria-label={`Compilation flow for ${fileName}: source file to online compiler to ${compilerMessage?.verified ? 'accepted output' : 'diagnostic'}`}><div className="compile-flow-node"><b>{fileName}</b><span>source file</span></div><span className="compile-flow-arrow">→</span><div className="compile-flow-node"><b>Judge0</b><span>online compiler</span></div><span className="compile-flow-arrow">→</span><div className={`compile-flow-node ${compilerMessage?.verified ? 'success' : 'failure'}`}><b>{compilerMessage?.verified ? 'Accepted' : 'Diagnostic'}</b><span>{compilerMessage?.stdout ? 'output available' : compilerMessage?.stderr || compileState.error || 'waiting'}</span></div></div>}
    <div className="subsection"><h3 className="subsection-title">Explainable diagnostic</h3><p className="subsection-sub">Errors are taught, not just reported. Turn any compiler diagnostic into clear cause, evidence, and next action.</p><div className="card error-card card-pad"><div className="error-pipeline"><span className="step">compiler/runtime</span><span className="arrow">→</span><span className="step">normalizer</span><span className="arrow">→</span><span className="step">structured error</span><span className="arrow">→</span><span className="step">plain explanation</span></div>{errorText ? <div className="explain-final"><b>Cause:</b> {errorText.cause || errorText.explanation}<br/>{errorText.evidence && <><b>Evidence:</b> {errorText.evidence}<br/></>}{errorText.nextAction && <><b>Next Action:</b> {errorText.nextAction}</>}</div> : <div className="explain-final">{(compilerMessage?.stderr || compileState.error) ? `Diagnostic captured: ${compilerMessage?.stderr || compileState.error}` : 'No verified error has been recorded for this project yet. When a compiler run returns a diagnostic, click "Explain diagnostic with AI" to analyze it.'}</div>}{(!compilerMessage?.verified || compileState.error || compilerMessage?.stderr) && <div style={{ marginTop: 12 }}><PrimaryButton onClick={explainBuildErrorWithAI} disabled={errorTeacherState.status === 'running'}>{errorTeacherState.status === 'running' ? 'Asking AI Agent...' : 'Explain diagnostic with AI'}</PrimaryButton></div>}</div></div>
    <StageActions><PrimaryButton onClick={() => setActiveStep('ui')}>Continue to UI <ArrowRight size={15} /></PrimaryButton></StageActions>
  </section>;
};

void LegacyBuildStage;

const LegacyUIStage = () => {
  const { setActiveStep } = useProject();
  return <section className="notebook-stage"><StageIntro stageId="ui" title="Give the project a usable interface" subtitle="Start from the real inputs and outputs of the code. Arrange the first functional screen before polishing the design." /><div className="ui-grid"><div className="card card-pad"><p className="rside-title">UI structure</p><div className="context-list"><div><strong>Input</strong>Project data or user request</div><div><strong>Action</strong>Run the verified project function</div><div><strong>Output</strong>Readable result and status</div></div><div className="note-box">The UI schema will be generated from verified code inputs and outputs by the backend.</div></div><div className="card card-pad"><p className="rside-title">Phone preview</p><div className="ui-canvas"><div className="ui-flow"><span className="ui-block">Input</span><span>→</span><span className="ui-block">Run</span><span>→</span><span className="ui-block">Result</span></div></div></div></div><StageActions><PrimaryButton onClick={() => setActiveStep('notes')}>Continue to Notes <ArrowRight size={15} /></PrimaryButton></StageActions></section>;
};

const UIStage = () => {
  const { project, idea, projectDefinition, codeFiles, uiDefinition, setUIDefinition, setActiveStep } = useProject();
  const [uiState, setUIState] = useState({ status: 'idle', error: '' });
  const generateUI = async () => {
    setUIState({ status: 'running', error: '' });
    try {
      const response = await runAgentTask({ task: 'generate_ui', project: { id: project.id, idea, projectDefinition }, input: { files: (codeFiles || []).map((file) => ({ path: file.path, language: file.language, role: file.role })), requirement: 'Design a simple phone-first interface for the verified project. Do not add features unrelated to the project.' } });
      const spec = response.result;
      if (!spec?.screens?.length) throw new Error('AI generation completed but returned no usable interface screens.');
      setUIDefinition(spec);
      setUIState({ status: 'done', error: '' });
    } catch (error) { setUIState({ status: 'error', error: error.message }); }
  };
  const screens = uiDefinition?.screens || [];
  return <section className="notebook-stage"><StageIntro stageId="ui" title="Shape the interface from the real project" subtitle="The AI uses your verified files and project definition to suggest screens, fields, and actions. Review the plan before implementation." /><div className="ui-builder-toolbar"><div><span className="result-type">AI UI PLANNER</span><p className="subsection-sub">No invented dashboard. Every screen below must connect to a project input, action, or output.</p></div><PrimaryButton onClick={generateUI} disabled={uiState.status === 'running'}>{uiState.status === 'running' ? 'Designing interface...' : 'Generate UI with AI'}</PrimaryButton></div>{uiState.status === 'error' && <div className="build-result error"><b>AI interface generation failed</b><span>{uiState.error}</span></div>}{screens.length ? <div className="ui-generated-grid"><div className="card card-pad"><p className="rside-title">Screen stack</p>{screens.map((screen, index) => <div className="ui-screen-row" key={`${screen.name}-${index}`}><span className="num">{String(index + 1).padStart(2, '0')}</span><div><strong>{screen.name}</strong><p>{screen.purpose}</p></div></div>)}<div className="ui-flow-list"><span className="field-label">USER FLOW</span>{(uiDefinition.flow || []).map((step, index) => <div key={`${step}-${index}`}><span>{index + 1}</span>{step}</div>)}</div></div><div className="ui-phone-preview" aria-label="Generated phone interface preview"><div className="phone-top"><span>{uiDefinition.title || 'Project interface'}</span><span>●</span></div>{screens.slice(0, 2).map((screen) => <div className="phone-screen" key={screen.name}><span className="result-type">{screen.name}</span><p>{screen.purpose}</p>{(screen.fields || []).slice(0, 3).map((field) => <div className="phone-field" key={field}>{field}</div>)}{(screen.actions || []).slice(0, 2).map((action) => <button className="phone-action" key={action}>{action}</button>)}</div>)}</div></div> : <div className="ui-empty card card-pad"><span className="result-type">WAITING FOR A REAL PROJECT PLAN</span><p>Generate a UI from the problem definition and file stack. The preview will show only screens returned by the agent.</p></div>}<StageActions><PrimaryButton onClick={() => setActiveStep('notes')}>Continue to Notes <ArrowRight size={15} /></PrimaryButton></StageActions></section>;
};

void LegacyUIStage;

const NotesStage = () => {
  const { project, idea, projectDefinition, projectNotes, setProjectNotes, setActiveStep } = useProject();
  const [notesState, setNotesState] = useState({ status: 'idle', error: '' });
  const value = projectNotes || `# ${idea.domain || 'Project'}\n\nWhat it does\n\nHow it works\n\nImportant decisions\n\nResearch used\n\nProblems and solutions\n\nFuture improvements`;
  const generateNotes = async () => {
    setNotesState({ status: 'running', error: '' });
    try {
      const response = await runAgentTask({
        task: 'write_notes',
        project: { id: project.id, idea, projectDefinition },
        input: { rawNotes: value }
      });
      const text = response.result?.notes || response.result?.summary;
      if (text) setProjectNotes(text);
      setNotesState({ status: 'done', error: '' });
    } catch (err) {
      setNotesState({ status: 'error', error: err.message });
    }
  };
  return <section className="notebook-stage">
    <StageIntro stageId="notes" title="Write down what you learned" subtitle="Notes are generated from the project state, then kept short and useful for revision, handoff, and presentation." />
    {notesState.status === 'error' && <div className="build-result error" style={{ marginBottom: 12 }}><b>AI notes generation failed</b><span>{notesState.error}</span></div>}
    <div className="card card-pad">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <label className="field-label" style={{ margin: 0 }}>Project notes</label>
        <button className="notebook-btn sm ghost" onClick={generateNotes} disabled={notesState.status === 'running'}>{notesState.status === 'running' ? 'Writing with AI...' : 'Generate notes with AI'}</button>
      </div>
      <textarea className="notebook-textarea" style={{ minHeight: 390 }} value={value} onChange={(e) => setProjectNotes(e.target.value)} />
    </div>
    <StageActions><PrimaryButton onClick={() => setActiveStep('present')}>Continue to Presentation <ArrowRight size={15} /></PrimaryButton></StageActions>
  </section>;
};

const PresentStage = () => {
  const { idea, projectDefinition, setActiveStep } = useProject();
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const title = projectDefinition?.title || idea.domain || 'Project presentation';
  const slides = useMemo(() => [
    ['Problem statement', projectDefinition?.problem || idea.problem || 'The project problem will be written from the verified definition.'],
    ['Proposed architecture', projectDefinition?.solution || idea.proposedApproach || 'The project architecture will be generated from the verified project state.'],
    ['Implementation and results', 'Results will be added only from successful recorded runs.'],
  ], [idea, projectDefinition]);
  const latex = `\\begin{frame}{${slides[slide][0]}}\n  ${slides[slide][1]}\n\\end{frame}`;
  const copyLatex = async () => { await navigator.clipboard?.writeText(latex); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  return <section className="notebook-stage"><StageIntro stageId="present" title="Everything you built, structured into a presentation" subtitle="Assembled from your actual idea, research, code, and verified results — never invented." /><div className="present-layout"><div className="card card-pad"><p className="rside-title">Outline</p>{['Title', 'Problem statement', 'Motivation', 'Existing approaches', 'Research gap', 'Proposed architecture', 'Implementation', 'Results', 'Limitations', 'Conclusion'].map((item, index) => <div className="toc-item" key={item}><span className="num">{String(index + 1).padStart(2, '0')}</span><span className={`toc-dot${index > 6 ? ' pending' : ''}`} />{item}</div>)}</div><div><div className="slide-preview"><p className="slide-eyebrow">{title}</p><p className="slide-title">{slides[slide][0]}</p><p className="slide-foot">Slide {String(slide + 1).padStart(2, '0')} · {slides.length} preview slides</p></div><div className="latex-box">{latex}</div><div className="present-actions"><PrimaryButton onClick={copyLatex}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy LaTeX'}</PrimaryButton><GhostButton onClick={() => setSlide((value) => (value + 1) % slides.length)}>Next slide <ChevronRight size={15} /></GhostButton></div></div></div><StageActions><PrimaryButton onClick={() => setActiveStep('export')}>Prepare Export <Download size={15} /></PrimaryButton></StageActions></section>;
};

const EditablePresentStage = () => {
  const { idea, projectDefinition, setActiveStep } = useProject();
  const [slide, setSlide] = useState(0);
  const [copied, setCopied] = useState(false);
  const title = projectDefinition?.title || idea.domain || 'Project presentation';
  const slides = useMemo(() => [
    ['Problem statement', projectDefinition?.problem || idea.problem || 'The project problem will be written from the verified definition.'],
    ['Proposed architecture', projectDefinition?.solution || idea.proposedApproach || 'The project architecture will be generated from the verified project state.'],
    ['Implementation and results', 'Results will be added only from successful recorded runs.'],
  ], [idea, projectDefinition]);
  const makeLatex = (index) => `\\begin{frame}{${slides[index][0]}}\n  ${slides[index][1]}\n\\end{frame}`;
  const [latex, setLatex] = useState(() => makeLatex(0));
  const copyLatex = async () => { await navigator.clipboard?.writeText(latex); setCopied(true); window.setTimeout(() => setCopied(false), 1500); };
  const nextSlide = () => setSlide((current) => { const next = (current + 1) % slides.length; setLatex(makeLatex(next)); return next; });
  return <section className="notebook-stage"><StageIntro stageId="present" title="Edit the presentation source" subtitle="The LaTeX source is yours to edit. Keep the preview and source together, then send the final .tex file to the production PDF worker." /><div className="present-layout"><div className="card card-pad"><p className="rside-title">Outline</p>{['Title', 'Problem statement', 'Motivation', 'Existing approaches', 'Research gap', 'Proposed architecture', 'Implementation', 'Results', 'Limitations', 'Conclusion'].map((item, index) => <div className="toc-item" key={item}><span className="num">{String(index + 1).padStart(2, '0')}</span><span className={`toc-dot${index > 6 ? ' pending' : ''}`} />{item}</div>)}</div><div><div className="slide-preview"><p className="slide-eyebrow">{title}</p><p className="slide-title">{slides[slide][0]}</p><p className="slide-foot">Slide {String(slide + 1).padStart(2, '0')} · {slides.length} preview slides</p></div><label className="field-label latex-label" htmlFor="latex-source">EDITABLE LATEX SOURCE</label><textarea id="latex-source" className="latex-editor" value={latex} onChange={(event) => setLatex(event.target.value)} spellCheck="false" rows="12" /><div className="present-actions"><PrimaryButton onClick={copyLatex}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy LaTeX'}</PrimaryButton><GhostButton onClick={nextSlide}>Next slide <ChevronRight size={15} /></GhostButton></div></div></div><StageActions><PrimaryButton onClick={() => setActiveStep('export')}>Prepare Export <Download size={15} /></PrimaryButton></StageActions></section>;
};

void PresentStage;

const ExportStage = () => {
  const { exportProject, project, researchGraph, codeSamples, codeFiles, projectNotes } = useProject();
  const [publishState, setPublishState] = useState({ status: 'idle', result: null, error: '' });
  const files = ['src/', 'ui/', 'research/', 'notes/project-notes.md', 'presentation/main.tex', 'README.md', 'project-context.json'];
  const publish = async () => { setPublishState({ status: 'running', result: null, error: '' }); const slug = (project?.id || 'project-notebook').replace(/[^a-zA-Z0-9._-]/g, '-'); const sourceFiles = (codeFiles || []).map((file) => ({ path: file.path, content: file.content || '' })); try { setPublishState({ status: 'done', result: await publishGithub({ name: slug, description: 'Project Notebook export', files: [...sourceFiles, { path: 'notes/project-notes.md', content: projectNotes || '# Project notes' }, { path: 'research/research.json', content: JSON.stringify(researchGraph, null, 2) }] }), error: '' }); } catch (error) { setPublishState({ status: 'error', result: null, error: error.message }); } };
  return <section className="notebook-stage"><StageIntro stageId="export" title="Take the finished project with you" subtitle="Prepare the project files, notes, presentation, and context for download or a confirmed GitHub publish." /><div className="export-grid"><div className="card card-pad"><p className="rside-title">Export package</p>{files.map((file) => <div className="export-file" key={file}><FileText size={14} />{file}</div>)}<StageActions><PrimaryButton onClick={() => exportProject('json')}><Download size={15} /> Download context</PrimaryButton></StageActions></div><div className="card card-pad"><p className="rside-title">GitHub publishing</p><p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.55 }}>Publishing updates the configured Project-Notes repository with the current project files. The server keeps the GitHub token out of the browser.</p><StageActions><GhostButton onClick={publish} disabled={publishState.status === 'running'}><GitBranch size={15} /> {publishState.status === 'running' ? 'Publishing…' : 'Publish to GitHub'}</GhostButton></StageActions>{publishState.status !== 'idle' && <div className={`build-result ${publishState.status}`}><b>{publishState.status === 'done' ? 'GitHub export complete.' : publishState.status === 'running' ? 'Preparing repository…' : 'GitHub export could not be completed.'}</b><span>{publishState.result?.result?.url || publishState.error}</span></div>}<div className="context-list" style={{ marginTop: 22 }}><div><strong>Project</strong>{project?.id || 'local-project'}</div><div><strong>Research</strong>{researchGraph.length} sources</div><div><strong>Code</strong>{Object.keys(codeSamples || {}).length} workspaces</div><div><strong>Notes</strong>{projectNotes ? 'Ready' : 'Pending'}</div></div></div></div></section>;
};

export const ReferenceNotebook = ({ onSignOut }) => {
  const { activeStep, setActiveStep, completedStages, idea } = useProject();
  const currentIndex = getStageIndex(activeStep);
  const currentStage = getStage(activeStep);

  useEffect(() => {
    document.body.classList.add('notebook-body', 'page-grid');
    return () => document.body.classList.remove('notebook-body', 'page-grid');
  }, []);

  useEffect(() => {
    document.querySelector('.notebook-main')?.scrollTo(0, 0);
  }, [activeStep]);

  const renderStage = () => {
    if (activeStep === 'profile') return <ProfileStage />;
    if (activeStep === 'idea') return <IdeaStage />;
    if (activeStep === 'research') return <ResearchStage />;
    if (activeStep === 'define') return <DefineStage />;
    if (activeStep === 'build') return <BuildStage />;
    if (activeStep === 'ui') return <UIStage />;
    if (activeStep === 'notes') return <NotesStage />;
    if (activeStep === 'present') return <EditablePresentStage />;
    return <ExportStage />;
  };

  return <div className="notebook-app">
    <nav className="notebook-spine" aria-label="Project stages"><div className="spine-thread" /><div className="spine-nodes">{WORKFLOW_STAGES.map((stage, index) => <button className={`spine-node${stage.id === activeStep ? ' active' : ''}${completedStages.includes(stage.id) || index < currentIndex ? ' done' : ''}`} key={stage.id} onClick={() => setActiveStep(stage.id)} aria-label={stage.label} aria-current={stage.id === activeStep ? 'step' : undefined}><span className="dot" /><span className="lbl">{stage.shortLabel.toUpperCase()}</span></button>)}</div></nav>
    <header className="notebook-header"><div className="notebook-brand"><span className="notebook-brand-mark">AEN</span><span className="notebook-brand-name">AI Engineering Notebook</span></div><div className="notebook-header-right"><div className="project-title">PROJECT / <input value={idea.domain || 'Untitled project'} readOnly aria-label="Project title" /></div><div className="stage-flag">STAGE&nbsp;{String(currentIndex + 1).padStart(2, '0')} · <b>{currentStage.label.toUpperCase()}</b></div></div></header>
    {onSignOut && <button className="notebook-btn ghost sign-out-btn notebook-account-action" onClick={onSignOut}><LogOut size={14} /> Sign out</button>}
    <main className="notebook-main">{renderStage()}</main>
  </div>;
};
