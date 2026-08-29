import React, { useState, useEffect } from 'react';
import { useProject } from '../context/ProjectContext';
import confetti from 'canvas-confetti';
import { 
  Presentation, 
  Download, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Sparkles, 
  Code, 
  FileText,
  Award
} from 'lucide-react';

export const PresentationPage = () => {
  const { idea, profile, researchGraph, activeLanguage, setActiveStep } = useProject();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeView, setActiveView] = useState('slides'); // slides, latex
  const [copied, setCopied] = useState(false);

  const savedPapers = researchGraph.filter((p) => p.saved);

  // Trigger celebration confetti on view of final slide
  useEffect(() => {
    if (currentSlide === 14) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, [currentSlide]);

  // 15 Slides structured directly from Project Semantic Graph
  const slides = [
    {
      num: 1,
      title: 'AI Engineering Notebook',
      subtitle: `A Continuous Polyglot Execution & Explainability Framework`,
      author: profile.name,
      institution: `${profile.role} (${profile.year})`,
      content: `Target Goal: ${profile.goal}`,
    },
    {
      num: 2,
      title: 'Problem Statement',
      bullets: [
        'Software development is fragmented across search engines, papers, IDEs, and slide tools.',
        'Repeated context switching causes severe cognitive load and lost architectural alignment.',
        'Debugging cross-language code boundaries lacks structured root-cause explainability.',
      ],
    },
    {
      num: 3,
      title: 'Motivation',
      bullets: [
        'Unify the entire engineering lifecycle into one persistent Project Semantic Graph.',
        'Tailor AI research depth and code explanations to the user\'s Knowledge Model level.',
        'Eliminate manual documentation and slide deck creation at project completion.',
      ],
    },
    {
      num: 4,
      title: 'Existing Approaches',
      bullets: [
        'Standalone AI chat tools without persistent code AST context.',
        'Static documentation platforms missing interactive execution previews.',
        'Traditional IDE debuggers returning opaque raw compiler callstacks.',
      ],
    },
    {
      num: 5,
      title: 'Research Gap Analysis',
      bullets: [
        'Lack of multi-factor Q (Idea) vs K (Source) semantic research scoring.',
        'Absence of isolated execution boundary fallbacks for incompatible polyglot IR nodes.',
        'No direct synthesis of LaTeX Beamer slide decks from active developer state.',
      ],
    },
    {
      num: 6,
      title: 'Proposed Architecture',
      bullets: [
        'Central Project Semantic Graph acting as authoritative state core.',
        'User Knowledge Model controlling code explanation granularity.',
        'Idea Classifier AI generating optimized research prompts automatically.',
      ],
    },
    {
      num: 7,
      title: 'Methodology & Research Alignment',
      bullets: savedPapers.map((p) => `${p.title} (${p.year}) - ${p.whyItMatters.substring(0, 80)}...`),
    },
    {
      num: 8,
      title: 'Semantic Code Engine',
      bullets: [
        `Multi-language parsing supporting ${activeLanguage.toUpperCase()} and foreign runtimes.`,
        'Lowering ASTs into Common Semantic IR nodes (Operations, Types, Side-Effects).',
        'Cross-language compatibility handshakes with Isolated Execution Nodes.',
      ],
    },
    {
      num: 9,
      title: 'Explainable AI (XAI) Debugging',
      bullets: [
        'Normalizing raw compiler errors into structured Error IR objects.',
        'Contextual root-cause explanations tailored to user skill levels.',
        'Actionable remediation suggestions with automated side-by-side diff previews.',
      ],
    },
    {
      num: 10,
      title: 'System Implementation',
      bullets: [
        'Vite + React modern glassmorphism design system.',
        'Dual-panel code editor with selection-driven AI Teacher.',
        'Auto-generated Live UI schemas driven by function input/output signatures.',
      ],
    },
    {
      num: 11,
      title: 'Verified Results',
      bullets: [
        'Verified results will be added from successful project runs.',
        'The notebook does not invent experimental values.',
        'Planned evaluation is kept separate from completed results.',
      ],
    },
    {
      num: 12,
      title: 'System Limitations',
      bullets: [
        'Current target lowering backend optimized for JVM/WASM runtimes.',
        'High-dimensional IR graph embeddings require lightweight local caching.',
      ],
    },
    {
      num: 13,
      title: 'Future Work',
      bullets: [
        'Extend lowering backends to Native LLVM IR and C++ CUDA targets.',
        'Integrate real-time collaborative pair-notebook sessions over WebSockets.',
      ],
    },
    {
      num: 14,
      title: 'Conclusion',
      bullets: [
        'The AI Engineering Notebook seamlessly unifies idea research, coding, debugging, and presentation synthesis.',
        'Empowers developers to learn by building in one continuous workflow.',
      ],
    },
    {
      num: 15,
      title: 'References & Literature',
      bullets: savedPapers.map((p) => `${p.authors}. "${p.title}". ${p.source}, ${p.year}.`),
    },
  ];

  // Generate compilable LaTeX Beamer code
  const latexBeamerCode = `\\documentclass{beamer}
\\usetheme{Metropolis}
\\usecolortheme{owl}

\\title{${idea.objective.substring(0, 60)}...}
\\subtitle{AI Engineering Notebook Polyglot Presentation}
\\author{${profile.name} (${profile.role})}
\\institute{Academic Year: ${profile.year}}
\\date{\\today}

\\begin{document}

\\frame{\\titlepage}

${slides.slice(1).map((s) => `\\begin{frame}{${s.title}}
  \\begin{itemize}
    ${s.bullets ? s.bullets.map((b) => `\\item ${b}`).join('\n    ') : '\\item ' + s.content}
  \\end{itemize}
\\end{frame}`).join('\n\n')}

\\end{document}`;

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexBeamerCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const slide = slides[currentSlide];

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-rose" style={{ marginBottom: '6px' }}>
            <Presentation size={14} style={{ marginRight: '6px' }} />
            Page 4 • Automatic LaTeX Beamer Presentation Generator
          </div>
          <h1 style={{ fontSize: '2.2rem', color: '#FFF' }}>
            Project Technical Presentation
          </h1>
        </div>

        {/* View Switcher & Export Controls */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={activeView === 'slides' ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setActiveView('slides')}
          >
            <Presentation size={16} /> Live Deck Preview
          </button>
          <button 
            className={activeView === 'latex' ? 'btn-cyan' : 'btn-secondary'}
            onClick={() => setActiveView('latex')}
          >
            <Code size={16} /> View LaTeX Code
          </button>
          <button className="btn-emerald" onClick={handleCopyLatex}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy LaTeX'}
          </button>
        </div>
      </div>

      {activeView === 'slides' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Main Interactive Slide Canvas */}
          <div className="glass-panel-glow" style={{
            minHeight: '480px',
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(15, 21, 33, 0.95), rgba(26, 35, 56, 0.95))',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid var(--border-glow)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                <span className="badge badge-indigo">Slide {slide.num} / {slides.length}</span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>AI Engineering Notebook • {profile.name}</span>
              </div>

              <h2 style={{ fontSize: '2.2rem', color: '#FFF', marginBottom: '20px' }}>
                {slide.title}
              </h2>

              {slide.subtitle && (
                <p style={{ fontSize: '1.2rem', color: '#67E8F9', marginBottom: '16px' }}>
                  {slide.subtitle}
                </p>
              )}

              {slide.author && (
                <div style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.8' }}>
                  <div><strong>Presenter:</strong> {slide.author}</div>
                  <div><strong>Institution:</strong> {slide.institution}</div>
                  <div><strong>Goal:</strong> {slide.content}</div>
                </div>
              )}

              {slide.bullets && (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '20px', color: '#E2E8F0', fontSize: '1.1rem', lineHeight: '1.6' }}>
                  {slide.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '32px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Synthesized directly from Project Semantic Graph Context
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentSlide((prev) => Math.max(0, prev - 1))}
                  disabled={currentSlide === 0}
                >
                  <ChevronLeft size={18} /> Prev
                </button>
                <span style={{ fontSize: '0.9rem', color: '#FFF', fontWeight: '600', padding: '0 8px' }}>
                  {currentSlide + 1} / {slides.length}
                </span>
                <button
                  className="btn-secondary"
                  onClick={() => setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1))}
                  disabled={currentSlide === slides.length - 1}
                >
                  Next <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* LaTeX Code Editor View */
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ color: '#FFF', fontWeight: '600', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="#06B6D4" />
              Generated LaTeX Beamer Source Code (\documentclass&#123;beamer&#125;)
            </div>
            <button className="btn-emerald" onClick={handleCopyLatex}>
              {copied ? <Check size={16} /> : <Copy size={16} />} Copy LaTeX
            </button>
          </div>

          <textarea
            className="textarea-field"
            style={{
              minHeight: '480px',
              fontFamily: 'var(--font-code)',
              fontSize: '0.88rem',
              color: '#A5B4FC',
              background: '#070B14'
            }}
            value={latexBeamerCode}
            readOnly
          />
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
        <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setActiveStep('export')}>
          Prepare Export <Download size={17} />
        </button>
      </div>
    </div>
  );
};
