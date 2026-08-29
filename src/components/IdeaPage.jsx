import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  Lightbulb, 
  Sparkles, 
  ArrowRight, 
  Sliders, 
  FileCode, 
  HelpCircle, 
  Check, 
  Edit3,
  Layers,
  Search,
  BookOpen
} from 'lucide-react';

export const IdeaPage = () => {
  const { idea, setIdea, setActiveStep } = useProject();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      // Simulate real-time Idea Classifier AI analysis
      setIdea((prev) => ({
        ...prev,
        domain: prev.rawIdea.toLowerCase().includes('web') ? 'Web & Distributed Systems' : 'Compiler Design & AI-Driven Software Engineering',
        optimizedPrompt: `Research state-of-the-art implementations, algorithms, AST schemas, cross-language boundaries, and error explainability models for: "${prev.rawIdea.substring(0, 100)}..."`,
      }));
      setIsAnalyzing(false);
    }, 800);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
      {/* Page Title */}
      <div style={{ marginBottom: '28px' }}>
        <div className="badge badge-cyan" style={{ marginBottom: '10px' }}>
          <Lightbulb size={14} style={{ marginRight: '6px' }} />
          Page 1 • Natural Language Project Synthesis
        </div>
        <h1 style={{ fontSize: '2.2rem', color: '#FFF', marginBottom: '8px' }}>
          Define Your Project Idea
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '700px' }}>
          Write naturally. The Idea Classifier AI extracts architectural requirements, domain constraints, unknown concepts, and optimized research questions.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
        {/* Left Column: Original Natural Language Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: '600', fontSize: '1.05rem' }}>
                <Edit3 size={18} color="#6366F1" />
                Original Idea Statement
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Freeform Input</span>
            </div>

            <textarea
              className="textarea-field"
              style={{ minHeight: '160px', fontSize: '1rem' }}
              value={idea.rawIdea}
              onChange={(e) => setIdea({ ...idea, rawIdea: e.target.value })}
              placeholder="Describe your project idea in plain natural language..."
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '14px' }}>
              <button 
                className="btn-cyan" 
                onClick={handleAnalyze} 
                disabled={isAnalyzing}
                style={{ padding: '10px 20px', fontSize: '0.9rem' }}
              >
                <Sparkles size={16} />
                {isAnalyzing ? 'Analyzing Idea...' : 'Re-Analyze Idea with AI'}
              </button>
            </div>
          </div>

          {/* AI Flow Trace: Original -> Interpretation -> Optimized Prompt */}
          <div className="glass-panel" style={{ padding: '20px', background: 'rgba(15, 21, 33, 0.9)' }}>
            <div style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '12px' }}>
              Idea Pipeline Transformation Trace
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.04)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#A5B4FC' }}>1. Original Idea:</strong> "{idea.rawIdea.substring(0, 90)}..."
              </div>
              <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>↓</div>
              <div style={{ background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#67E8F9' }}>2. AI Semantic Interpretation:</strong> Extracted {idea.requirements.length} functional requirements in {idea.domain}.
              </div>
              <div style={{ textAlign: 'center', color: 'var(--accent-secondary)' }}>↓</div>
              <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <strong style={{ color: '#6EE7B7' }}>3. Optimized Research Vector Q:</strong> Synthesized research prompt with {idea.researchQuestions.length} query dimensions.
              </div>
            </div>
          </div>

          {/* Editable Optimized Research Prompt */}
          <div className="glass-panel-glow" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: '600' }}>
                <Search size={18} color="#10B981" />
                Optimized Research Prompt (Q Vector)
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: '#06B6D4', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
                onClick={() => setIsEditingPrompt(!isEditingPrompt)}
              >
                {isEditingPrompt ? 'Lock Prompt' : 'Edit Prompt'}
              </button>
            </div>

            {isEditingPrompt ? (
              <textarea
                className="textarea-field"
                style={{ minHeight: '100px', fontSize: '0.92rem' }}
                value={idea.optimizedPrompt}
                onChange={(e) => setIdea({ ...idea, optimizedPrompt: e.target.value })}
              />
            ) : (
              <div style={{ background: 'rgba(9, 13, 22, 0.8)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem', color: '#E2E8F0', lineHeight: '1.5', border: '1px solid var(--border-color)' }}>
                {idea.optimizedPrompt}
              </div>
            )}
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              * Original user idea is always preserved; this prompt is sent to the Page 2 Research Agent.
            </div>
          </div>
        </div>

        {/* Right Column: Idea Classifier AI Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#FFF', fontWeight: '600', fontSize: '1.05rem', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
              <Sliders size={18} color="#06B6D4" />
              Extracted Project Blueprint
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Problem & Objective */}
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: '6px' }}>Problem Statement</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.5' }}>
                  {idea.problem}
                </p>
              </div>

              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '6px' }}>Primary Objective</span>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.5' }}>
                  {idea.objective}
                </p>
              </div>

              {/* Technologies & Domain */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>Domain</span>
                  <div style={{ fontSize: '0.86rem', color: '#FFF', fontWeight: '500', marginTop: '4px' }}>
                    {idea.domain}
                  </div>
                </div>
                <div>
                  <span className="badge badge-amber" style={{ marginBottom: '6px' }}>Technologies</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {idea.techStack.map((tech) => (
                      <span key={tech} style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', color: '#E2E8F0' }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Functional Requirements */}
              <div>
                <span className="badge badge-indigo" style={{ marginBottom: '8px' }}>Extracted Requirements</span>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {idea.requirements.slice(0, 4).map((req, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <Check size={14} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Unknown Concepts to Learn */}
              <div>
                <span className="badge badge-rose" style={{ marginBottom: '6px' }}>Unknown Concepts (Learning Agenda)</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {idea.unknownConcepts.map((concept) => (
                    <span key={concept} style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', color: '#FDA4AF' }}>
                      <HelpCircle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setActiveStep('research')}>
          Proceed to Agentic Research Workspace <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
