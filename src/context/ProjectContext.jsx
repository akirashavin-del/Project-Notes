import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { WORKFLOW_STAGES, getNextStage, getStageIndex } from '../workflow/stages';
import { isSupabaseConfigured, supabaseProjectStore } from '../integrations/supabaseClient';

const ProjectContext = createContext(null);
const STORAGE_KEY = 'project-notebook:project:v1';

const readSavedProject = () => {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

export const DEFAULT_PROFILE = {
  name: 'Alex Chen',
  role: 'Undergraduate Computer Science Student',
  year: 'Year 3',
  overallLevel: 'Intermediate', // Beginner, Intermediate, Advanced, Expert
  languages: {
    Python: 'Intermediate',
    Java: 'Beginner',
    JavaScript: 'Intermediate',
    Rust: 'Beginner',
    'C++': 'Beginner',
    C: 'Beginner',
  },
  subjects: {
    AI: 'Advanced',
    Compiler: 'Beginner',
    Algorithms: 'Intermediate',
    Web: 'Intermediate',
    DistributedSystems: 'Beginner',
  },
  goal: 'Build an executable polyglot engine with AI explainability and technical presentation generator',
  preferredExplanation: 'Balanced (Concepts + Code + Metrics)',
};

export const DEFAULT_IDEA = {
  rawIdea: `I want to create a system where different programming languages can be understood semantically and combined into one executable workflow with real-time explainability and automatic slide presentation generation.`,
  problem: `Software development & project learning are fragmented across search engines, papers, coding environments, documentation, and presentation tools. Switching context causes loss of semantic alignment and steep debugging curves.`,
  objective: `Build a continuous AI Engineering Notebook that unifies idea classification, semantic paper research, AST/Common IR cross-language execution, contextual teaching, explainable debugging, and LaTeX Beamer deck generation in one state graph.`,
  requirements: [
    'Single persistent Project Semantic Graph carrying context across all workflow pages',
    'User Knowledge Model controlling code explanation depth and teaching granularity',
    'Optimized Research Prompt generator matching Q (Idea) vs K (Source) with multi-dimensional scoring',
    'Dual-panel modern code editor with selection-driven contextual AI Teacher',
    'Common Semantic Intermediate Representation (IR) with AST visualizer and compatibility matrix',
    'Structured Error IR and Explainable AI (XAI) root-cause debugging pipeline',
    'Automatic Live UI schema generation from code functions and execution models',
    'LaTeX Beamer presentation workspace with live presenter deck preview',
  ],
  constraints: [
    'Must not force users into rigid setup forms',
    'Never silently overwrite original user ideas or code without consent',
    'AI-derived insights must clearly distinguish from deterministic compiler facts',
  ],
  domain: 'Compiler Design & AI-Driven Software Engineering',
  proposedApproach: 'Map multi-language ASTs into a common semantic intermediate representation (IR) while generating isolated execution nodes for incompatible runtime boundaries.',
  expectedOutput: 'An interactive engineering notebook web application with execution preview, live UI rendering, and downloadable LaTeX presentation.',
  unknownConcepts: ['Semantic IR lowering', 'Polyglot execution boundaries', 'Structured Error IR schema'],
  techStack: ['Python', 'Java', 'WebAssembly', 'Vite', 'React', 'AST Parsers'],
  researchQuestions: [
    'How do modern multi-language intermediate representations handle type safety across boundaries?',
    'What combined similarity metrics best score research paper relevance to system architecture?',
    'How to lower high-level semantic IR into executable WASM or bytecode nodes safely?',
  ],
  optimizedPrompt: `Research state-of-the-art multi-language AST parsing, semantic intermediate representations (IR), cross-language type safety boundaries, explainable error tracing, and automated LaTeX technical presentation synthesis for polyglot execution engines.`,
};

export const INITIAL_RESEARCH_GRAPH = [
  {
    id: 'paper-1',
    title: 'GraalVM: High-Performance Polyglot Runtime for Language Interoperability',
    authors: 'T. Wuerthinger et al. (Oracle Labs)',
    year: '2019',
    source: 'ACM SIGPLAN International Conference on Managed Programming Runtimes',
    semanticScore: 94,
    problemAlignment: 91,
    techRelevance: 89,
    archRelevance: 95,
    whyItMatters: 'Directly supports the cross-language compatibility boundary architecture by defining zero-cost foreign function calls and shared runtime object graphs.',
    graphNode: 'Architecture → Polyglot Boundary',
    connectedConcepts: ['Foreign Function Interface', 'Polyglot Object Graph', 'Just-In-Time Lowering'],
    saved: true,
    status: 'Saved',
  },
  {
    id: 'paper-2',
    title: 'Explainable AI for Compiler Diagnostics and Error Remediation',
    authors: 'M. Gupta & R. Vance',
    year: '2023',
    source: 'OpenAlex / Software Engineering corpus',
    semanticScore: 92,
    problemAlignment: 96,
    techRelevance: 90,
    archRelevance: 88,
    whyItMatters: 'Provides the formal framework for mapping raw compiler error output into structured Error IR with dependency chains and contextual fix suggestions.',
    graphNode: 'Execution → Structured Error IR',
    connectedConcepts: ['Error IR Schema', 'Root Cause Analysis', 'Dependency Traceability'],
    saved: true,
    status: 'Saved',
  },
  {
    id: 'paper-3',
    title: 'Unified AST and Semantic Intermediate Representations for Multi-Language Analysis',
    authors: 'S. Park, E. Miller',
    year: '2022',
    source: 'Journal of Systems and Software',
    semanticScore: 88,
    problemAlignment: 89,
    techRelevance: 93,
    archRelevance: 91,
    whyItMatters: 'Outlines common node schemas for representing control flow, memory side effects, and type dependencies independently of original source syntax.',
    graphNode: 'Code → Common Semantic IR',
    connectedConcepts: ['Common IR', 'Control Flow Graph', 'Type Equivalence'],
    saved: false,
    status: 'Available',
  },
  {
    id: 'paper-4',
    title: 'Automatic Technical Presentation Generation from Software Artifacts and Semantic Traceability',
    authors: 'K. Patel et al.',
    year: '2024',
    source: 'International Conference on Automated Software Engineering (ASE)',
    semanticScore: 85,
    problemAlignment: 92,
    techRelevance: 84,
    archRelevance: 90,
    whyItMatters: 'Validates synthesizing LaTeX Beamer slides directly from project semantic graphs, research gap analysis, and implementation metrics.',
    graphNode: 'Results → Presentation Generator',
    connectedConcepts: ['LaTeX Beamer Synthesis', 'Semantic Traceability', 'Automatic Slide Layout'],
    saved: false,
    status: 'Available',
  },
];

export const INITIAL_PROBLEM_STATEMENTS = [
  {
    id: 'problem-1',
    title: 'Explainable compatibility checking for mixed-language code',
    description: 'Detect whether code blocks written in different languages can safely exchange data.',
    subject: 'Compilers', difficulty: 'Advanced', novelty: 'High', language: 'C',
    whyItMatters: 'It gives the project a focused first problem instead of trying to solve every compiler problem at once.',
  },
  {
    id: 'problem-2',
    title: 'A research assistant for learning DSA by building',
    description: 'Turn an algorithm problem into guided implementation steps, explanations, and revision notes.',
    subject: 'DSA', difficulty: 'Intermediate', novelty: 'High', language: 'Python',
    whyItMatters: 'It connects the user’s idea to a project that can be built and understood incrementally.',
  },
  {
    id: 'problem-3',
    title: 'Research-to-project traceability for student software',
    description: 'Link each design decision in a project to the research or documentation that supports it.',
    subject: 'Software Engineering', difficulty: 'Intermediate', novelty: 'Medium', language: 'Java',
    whyItMatters: 'It makes the final project, notes, and presentation easier to defend and revise.',
  },
];

export const INITIAL_CODE_SAMPLES = {
  python: `def calculate_compatibility(block_a, block_b):
    # Semantic type checking between cross-language code blocks
    types_a = block_a.get("exported_types", [])
    types_b = block_b.get("imported_types", [])
    
    match_count = sum(1 for t in types_a if t in types_b)
    total_required = len(types_b) if len(types_b) > 0 else 1
    
    score = (match_count / total_required) * 100.0
    
    return {
        "compatibility_score": score,
        "is_compatible": score >= 80.0,
        "requires_isolated_node": score < 80.0,
        "matched_types": match_count
    }`,
  java: `public class PolyglotBridge {
    private final String runtimeBackend;
    
    public PolyglotBridge(String backend) {
        this.runtimeBackend = backend;
    }
    
    public ExecutionResult executeBoundary(ExecutionNode node) {
        if (!node.isCompatible()) {
            return IsolatedExecutor.runInSandbox(node, this.runtimeBackend);
        }
        return LoweringEngine.compileAndRun(node);
    }
}`,
  c: `#include <stdio.h>

int main(void) {
    printf("Project notebook compiler check\\n");
    return 0;
}`,
  javascript: `function buildSemanticIR(astNode) {
  const irNode = {
    op: astNode.type,
    operands: astNode.arguments || [],
    typeSchema: astNode.returnType || 'Unknown',
    controlFlow: astNode.isAsync ? 'Asynchronous' : 'Sequential',
    memorySideEffects: astNode.mutatesGlobals ? ['StateMutation'] : ['None']
  };
  return irNode;
}`,
};

export const SMALL_CODE_SAMPLES = {
  python: `def main():
    values = [2, 4, 6]
    print(sum(values))


if __name__ == "__main__":
    main()`,
  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Project Notebook ready");
    }
}`,
  c: `#include <stdio.h>

int main(void) {
    printf("Project Notebook ready\\n");
    return 0;
}`,
  javascript: `function main() {
  const values = [2, 4, 6];
  console.log(values.reduce((sum, value) => sum + value, 0));
}

main();`,
};

export const INITIAL_FILE_STACK = [
  { id: 'python-main', path: 'src/main.py', language: 'python', role: 'entry', content: SMALL_CODE_SAMPLES.python },
  { id: 'python-tests', path: 'tests/test_main.py', language: 'python', role: 'test', content: 'from src.main import main\n\n# Add focused tests as the project grows.\n' },
  { id: 'c-main', path: 'src/main.c', language: 'c', role: 'entry', content: SMALL_CODE_SAMPLES.c },
  { id: 'java-main', path: 'src/Main.java', language: 'java', role: 'entry', content: SMALL_CODE_SAMPLES.java },
  { id: 'javascript-main', path: 'src/main.js', language: 'javascript', role: 'entry', content: SMALL_CODE_SAMPLES.javascript },
];

const getInitialFileStack = (savedProject) => {
  if (Array.isArray(savedProject.codeFiles) && savedProject.codeFiles.length) return savedProject.codeFiles;
  if (!savedProject.codeSamples) return INITIAL_FILE_STACK;
  return Object.entries(savedProject.codeSamples || SMALL_CODE_SAMPLES).map(([language, content]) => ({
    id: `${language}-main`, path: `src/main.${language === 'python' ? 'py' : language}`, language, role: 'entry', content,
  }));
};

export const ProjectProvider = ({ children, session = null }) => {
  const [savedProject] = useState(readSavedProject);
  const liveResearch = (savedProject.researchGraph || []).filter((item) => item.provider || item.sourceType === 'live');
  const liveProblems = (savedProject.problemStatements || []).filter((item) => item.sourcePaperId || item.sourceType === 'live');
  const [projectId] = useState(() => savedProject.id || `project-${Date.now()}`);
  const [activeStepState, setActiveStepState] = useState(savedProject.activeStep || 'profile');
  const [completedStages, setCompletedStages] = useState(savedProject.completedStages || []);
  const [lastSavedAt, setLastSavedAt] = useState(savedProject.lastSavedAt || null);
  const [profile, setProfile] = useState(savedProject.profile || DEFAULT_PROFILE);
  const [idea, setIdea] = useState(savedProject.idea || DEFAULT_IDEA);
  const [researchGraph, setResearchGraph] = useState(liveResearch);
  const [problemStatements, setProblemStatements] = useState(liveProblems);
  const [selectedProblemIds, setSelectedProblemIds] = useState(savedProject.selectedProblemIds || []);
  const [selectedPaperIds, setSelectedPaperIds] = useState(savedProject.selectedPaperIds || []);
  const [researchNotes, setResearchNotes] = useState(savedProject.researchNotes || []);
  const [projectDefinition, setProjectDefinition] = useState(savedProject.projectDefinition || null);
  const [uiDefinition, setUIDefinition] = useState(savedProject.uiDefinition || null);
  const [projectNotes, setProjectNotes] = useState(savedProject.projectNotes || '');
  const [exportState, setExportState] = useState(savedProject.exportState || { status: 'not-ready' });
  const [cloudState, setCloudState] = useState(() => session?.user?.id ? { status: 'loading', error: '' } : { status: 'offline', error: '' });
  const cloudHydratedRef = useRef(!session?.user?.id);

  // Navigation is a workflow action, not an untracked tab switch.
  const setActiveStep = (nextStep) => {
    if (!WORKFLOW_STAGES.some((stage) => stage.id === nextStep)) return;
    setCompletedStages((current) => {
      const currentIndex = getStageIndex(activeStepState);
      const nextIndex = getStageIndex(nextStep);
      if (nextIndex <= currentIndex) return current;
      return current.includes(activeStepState) ? current : [...current, activeStepState];
    });
    setActiveStepState(nextStep);
  };

  const completeStage = (stageId = activeStepState) => {
    setCompletedStages((current) => (current.includes(stageId) ? current : [...current, stageId]));
  };

  const goToNextStage = () => {
    const nextStage = getNextStage(activeStepState);
    if (nextStage) setActiveStep(nextStage.id);
  };

  // Build state
  const initialFileStack = getInitialFileStack(savedProject);
  const initialFile = initialFileStack.find((file) => file.id === savedProject.activeFileId) || initialFileStack.find((file) => file.role === 'entry') || initialFileStack[0];
  const [activeFileId, setActiveFileId] = useState(savedProject.activeFileId || initialFile.id);
  const [codeFiles, setCodeFiles] = useState(initialFileStack);
  const [activeLanguage, setActiveLanguage] = useState(savedProject.activeLanguage || initialFile.language);
  const [code, setCode] = useState(savedProject.code || initialFile.content);
  const [codeSamples, setCodeSamples] = useState(savedProject.codeSamples || SMALL_CODE_SAMPLES);
  const [selectedCode, setSelectedCode] = useState('');
  const [explanationDepth, setExplanationDepth] = useState(savedProject.explanationDepth || 'Adaptive'); // Adaptive, Beginner, Intermediate, Advanced

  // Optimizer state
  const [isOptimizerActive, setIsOptimizerActive] = useState(false);
  const [suggestedCode, setSuggestedCode] = useState('');

  // XAI Error state
  const [activeError, setActiveError] = useState(null);

  // Inspector modal state
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);

  const getProjectSnapshot = () => ({
    id: projectId,
    activeStep: activeStepState,
    completedStages,
    profile,
    idea,
    researchGraph,
    problemStatements,
    selectedProblemIds,
    selectedPaperIds,
    researchNotes,
    projectDefinition,
    uiDefinition,
    projectNotes,
    exportState,
    activeFileId,
    codeFiles,
    activeLanguage,
    code,
    codeSamples,
    explanationDepth,
    savedAt: new Date().toISOString(),
  });

  const exportProject = (format = 'json') => {
    const snapshot = getProjectSnapshot();
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(idea.domain || 'project').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-context.${format}`;
    link.click();
    URL.revokeObjectURL(url);
    setExportState({ status: 'downloaded', format, downloadedAt: new Date().toISOString() });
  };

  const hydrateProject = (snapshot) => {
    if (!snapshot) return;
    const has = (key) => Object.prototype.hasOwnProperty.call(snapshot, key);
    if (has('activeStep')) setActiveStepState(snapshot.activeStep);
    if (has('completedStages')) setCompletedStages(snapshot.completedStages);
    if (has('profile')) setProfile(snapshot.profile);
    if (has('idea')) setIdea(snapshot.idea);
    if (has('researchGraph')) setResearchGraph(snapshot.researchGraph);
    if (has('problemStatements')) setProblemStatements(snapshot.problemStatements);
    if (has('selectedProblemIds')) setSelectedProblemIds(snapshot.selectedProblemIds);
    if (has('selectedPaperIds')) setSelectedPaperIds(snapshot.selectedPaperIds);
    if (has('researchNotes')) setResearchNotes(snapshot.researchNotes);
    if (has('projectDefinition')) setProjectDefinition(snapshot.projectDefinition);
    if (has('uiDefinition')) setUIDefinition(snapshot.uiDefinition);
    if (has('projectNotes')) setProjectNotes(snapshot.projectNotes);
    if (has('exportState')) setExportState(snapshot.exportState);
    if (has('activeFileId')) setActiveFileId(snapshot.activeFileId);
    if (has('codeFiles')) setCodeFiles(snapshot.codeFiles);
    if (has('activeLanguage')) setActiveLanguage(snapshot.activeLanguage);
    if (has('code')) setCode(snapshot.code);
    if (has('codeSamples')) setCodeSamples(snapshot.codeSamples);
    if (has('explanationDepth')) setExplanationDepth(snapshot.explanationDepth);
  };

  const syncProjectToSupabase = ({ snapshot = getProjectSnapshot(), userId = session?.user?.id, accessToken = session?.accessToken } = {}) => supabaseProjectStore.save({ snapshot, userId, accessToken });

  useEffect(() => {
    let cancelled = false;
    const loadCloudProject = async () => {
      if (!session?.user?.id || !session?.accessToken || !isSupabaseConfigured) {
        cloudHydratedRef.current = true;
        setCloudState({ status: 'offline', error: '' });
        return;
      }
      cloudHydratedRef.current = false;
      setCloudState({ status: 'loading', error: '' });
      try {
        const snapshot = await supabaseProjectStore.load({ projectId, userId: session.user.id, accessToken: session.accessToken });
        if (!cancelled) {
          hydrateProject(snapshot);
          cloudHydratedRef.current = true;
          setCloudState({ status: snapshot ? 'ready' : 'new', error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          cloudHydratedRef.current = true;
          setCloudState({ status: 'error', error: error.message || 'Cloud project could not be loaded.' });
        }
      }
    };
    loadCloudProject();
    return () => { cancelled = true; };
  }, [projectId, session?.user?.id, session?.accessToken]);

  useEffect(() => {
    const snapshot = getProjectSnapshot();
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      setLastSavedAt(snapshot.savedAt);
    } catch {
      // Local persistence is helpful but must never block the editor.
    }
    if (!session?.user?.id || !session?.accessToken || !isSupabaseConfigured || !cloudHydratedRef.current) return undefined;
    const timeout = window.setTimeout(async () => {
      setCloudState({ status: 'saving', error: '' });
      try {
        await syncProjectToSupabase({ snapshot });
        setCloudState({ status: 'saved', error: '' });
      } catch (error) {
        setCloudState({ status: 'error', error: error.message || 'Cloud save failed. Local changes are safe.' });
      }
    }, 900);
    return () => window.clearTimeout(timeout);
  }, [projectId, activeStepState, completedStages, profile, idea, researchGraph, problemStatements, selectedProblemIds, selectedPaperIds, researchNotes, projectDefinition, uiDefinition, projectNotes, exportState, activeFileId, codeFiles, activeLanguage, code, codeSamples, explanationDepth, session?.user?.id, session?.accessToken]);

  // Switch the active file while preserving the current buffer.
  const switchFile = (fileId) => {
    const nextFile = codeFiles.find((file) => file.id === fileId);
    if (!nextFile || nextFile.id === activeFileId) return;
    setCodeFiles((files) => files.map((file) => file.id === activeFileId ? { ...file, content: code } : file));
    setActiveFileId(nextFile.id);
    setActiveLanguage(nextFile.language);
    setCode(nextFile.content || '');
    setSelectedCode('');
    setIsOptimizerActive(false);
  };

  const switchLanguage = (lang) => {
    const nextFile = codeFiles.find((file) => file.language === lang && file.role === 'entry') || codeFiles.find((file) => file.language === lang);
    if (nextFile) switchFile(nextFile.id);
  };

  // Update code content
  const updateCode = (newCode) => {
    setCode(newCode);
    setCodeSamples((prev) => ({ ...prev, [activeLanguage]: newCode }));
    setCodeFiles((files) => files.map((file) => file.id === activeFileId ? { ...file, content: newCode } : file));
  };

  const replaceCodeFiles = (files = []) => {
    const nextFiles = files.filter((file) => file?.path && file?.language && ['python', 'c', 'java', 'javascript', 'markdown'].includes(file.language) && typeof file.content === 'string' && !String(file.path).includes('..')).map((file, index) => ({
      id: file.id || `${file.language}-${file.path}-${index}`,
      path: String(file.path).replace(/\\/g, '/').replace(/^\/+/, ''),
      language: file.language,
      role: file.role || (index === 0 ? 'entry' : 'support'),
      content: file.content,
    }));
    if (!nextFiles.length) throw new Error('The AI returned no usable source files.');
    const nextFile = nextFiles.find((file) => file.role === 'entry') || nextFiles[0];
    setCodeFiles(nextFiles);
    setActiveFileId(nextFile.id);
    setActiveLanguage(nextFile.language);
    setCode(nextFile.content);
    setCodeSamples(Object.fromEntries(nextFiles.filter((file) => file.role === 'entry').map((file) => [file.language, file.content])));
    setSelectedCode('');
  };

  // User Profile Knowledge Model evaluator helper
  const getKnowledgeLevel = (subjectOrLang) => {
    if (profile.languages[subjectOrLang]) return profile.languages[subjectOrLang];
    if (profile.subjects[subjectOrLang]) return profile.subjects[subjectOrLang];
    return profile.overallLevel;
  };

  // Toggle research paper saved state
  const toggleSaveResearch = (id) => {
    setResearchGraph((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              saved: !item.saved,
              status: !item.saved ? 'Saved' : 'Available',
            }
          : item
      )
    );
  };

  // Add custom research question or search paper
  const addResearchPaper = (newPaper) => {
    setResearchGraph((prev) => [newPaper, ...prev]);
  };

  const mergeResearchPapers = (papers = []) => {
    setResearchGraph((current) => {
      const incomingIds = new Set(papers.map((paper) => paper.id));
      return [...papers, ...current.filter((paper) => !incomingIds.has(paper.id))];
    });
  };

  const mergeProblemStatements = (problems = []) => {
    setProblemStatements((current) => {
      const incomingIds = new Set(problems.map((problem) => problem.id));
      return [...problems, ...current.filter((problem) => !incomingIds.has(problem.id))];
    });
  };

  const toggleSelectProblem = (id) => {
    setSelectedProblemIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const toggleSelectPaper = (id) => {
    setSelectedPaperIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const addResearchNote = (note) => {
    setResearchNotes((current) => [...current.filter((item) => item.paperId !== note.paperId), note]);
  };

  // Generate baseline optimization diff
  const generateOptimization = () => {
    setIsOptimizerActive(true);
    if (activeLanguage === 'python') {
      setSuggestedCode(`def calculate_compatibility(block_a: dict, block_b: dict) -> dict:
    """Optimized vector lookup & type safety matching."""
    types_a = set(block_a.get("exported_types", []))
    types_b = set(block_b.get("imported_types", []))
    
    if not types_b:
        return {"compatibility_score": 100.0, "is_compatible": True, "requires_isolated_node": False}
        
    matched = types_a.intersection(types_b)
    score = (len(matched) / len(types_b)) * 100.0
    
    return {
        "compatibility_score": round(score, 2),
        "is_compatible": score >= 80.0,
        "requires_isolated_node": score < 80.0,
        "matched_types": len(matched)
    }`);
    } else {
      setSuggestedCode(code + '\n// [AI Baseline Optimizer]: Added null-safety check and O(1) hashing lookup.');
    }
  };

  const acceptOptimization = () => {
    if (suggestedCode) {
      updateCode(suggestedCode);
      setIsOptimizerActive(false);
      setSuggestedCode('');
    }
  };

  const rejectOptimization = () => {
    setIsOptimizerActive(false);
    setSuggestedCode('');
  };

  // Trigger XAI Error simulation
  const triggerSimulatedError = () => {
    setActiveError({
      error_id: 'ERR-POLY-4092',
      source_location: `${activeLanguage.toUpperCase()} Line 6, Col 12`,
      language: activeLanguage,
      operation: 'Type Schema Compatibility Handshake',
      expected_type: 'List[TypeSignature]',
      actual_type: 'String ("String")',
      dependency_chain: ['block_a.exported_types', 'calculate_compatibility()', 'PolyglotBridge.executeBoundary()'],
      affected_blocks: ['Python Execution Block #1', 'Java Execution Boundary Node #2'],
      runtime_state: 'Unmatched Schema Handshake (Score: 0.0%)',
      compiler_message: `TypeError: Unhandled argument type mismatch. Passed String value to List parameter.`,
      severity: 'Critical Compatibility Failure',
      fix_suggestion: `Wrap the exported value in a list [val] or parse string tokens into type signatures before passing to the boundary function.`,
      xai_explanation: `The Python block exported a plain String value ('String'), but the Java boundary expects a structured List of TypeSignatures. Because type mismatch occurred at the cross-language boundary, the compatibility engine cannot auto-cast it. Converting the input to a List will resolve the compatibility fault.`,
    });
  };

  const clearError = () => {
    setActiveError(null);
  };

  return (
    <ProjectContext.Provider
      value={{
        project: { id: projectId },
        activeStep: activeStepState,
        setActiveStep,
        completedStages,
        completeStage,
        goToNextStage,
        lastSavedAt,
        cloudState,
        profile,
        setProfile,
        idea,
        setIdea,
        researchGraph,
        toggleSaveResearch,
        addResearchPaper,
        mergeResearchPapers,
        mergeProblemStatements,
        problemStatements,
        setProblemStatements,
        selectedProblemIds,
        selectedPaperIds,
        toggleSelectProblem,
        toggleSelectPaper,
        researchNotes,
        addResearchNote,
        projectDefinition,
        setProjectDefinition,
        uiDefinition,
        setUIDefinition,
        projectNotes,
        setProjectNotes,
        exportState,
        exportProject,
        isSupabaseConfigured,
        syncProjectToSupabase,
        activeLanguage,
        activeFileId,
        codeFiles,
        switchFile,
        replaceCodeFiles,
        switchLanguage,
        code,
        updateCode,
        selectedCode,
        setSelectedCode,
        explanationDepth,
        setExplanationDepth,
        isOptimizerActive,
        suggestedCode,
        generateOptimization,
        acceptOptimization,
        rejectOptimization,
        activeError,
        triggerSimulatedError,
        clearError,
        isInspectorOpen,
        setIsInspectorOpen,
        getKnowledgeLevel,
        getProjectSnapshot,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
};
