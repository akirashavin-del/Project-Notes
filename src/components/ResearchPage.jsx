import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  BookOpen, 
  Search, 
  Bookmark, 
  Check, 
  X, 
  HelpCircle, 
  Network, 
  ArrowRight, 
  Plus, 
  ExternalLink,
  Sparkles,
  Layers,
  Brain
} from 'lucide-react';

export const ResearchPage = () => {
  const { researchGraph, toggleSaveResearch, addResearchPaper, idea, setActiveStep } = useProject();
  const [selectedPaper, setSelectedPaper] = useState(researchGraph[0]);
  const [qaTopic, setQaTopic] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [newSearchQuery, setNewSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const handleRunSearch = () => {
    if (!newSearchQuery.trim()) return;
    setIsSearching(true);
    setTimeout(() => {
      const generated = {
        id: `paper-${Date.now()}`,
        title: `State-of-the-Art Analysis: ${newSearchQuery}`,
        authors: 'Agentic Research Engine v2.4',
        year: '2025',
        source: 'IEEE / ACM Automated Corpus Search',
        semanticScore: 93,
        problemAlignment: 90,
        techRelevance: 91,
        archRelevance: 89,
        whyItMatters: `Identified key technical benchmarks and architectural patterns matching query "${newSearchQuery}" against your project's semantic graph.`,
        graphNode: 'Architecture → Custom Query Node',
        connectedConcepts: ['Semantic Search', 'Polyglot Benchmarks', 'Lowering Engine'],
        saved: true,
        status: 'Saved',
      };
      addResearchPaper(generated);
      setSelectedPaper(generated);
      setNewSearchQuery('');
      setIsSearching(false);
    }, 700);
  };

  const handleAskQuestion = (questionType) => {
    if (!selectedPaper) return;
    setQaTopic(questionType);
    if (questionType.includes('Why')) {
      setQaAnswer(`Paper "${selectedPaper.title}" directly supports your project goal because it provides empirical proof for ${selectedPaper.connectedConcepts.join(' & ')}. Its architecture relevance score is ${selectedPaper.archRelevance}%.`);
    } else if (questionType.includes('Architecture')) {
      setQaAnswer(`This paper supports the ${selectedPaper.graphNode} node in your Project Semantic Graph. It specifies boundary object marshaling and execution state isolation.`);
    } else if (questionType.includes('Contradict')) {
      setQaAnswer(`No direct contradiction detected. However, Section 4 notes that naive AST reflection introduces a 12% execution overhead, recommending the Common IR lowering approach defined in your idea blueprint.`);
    } else if (questionType.includes('Concept')) {
      setQaAnswer(`Key concepts to master: ${selectedPaper.connectedConcepts.map((c) => `[${c}]`).join(', ')}. The Contextual AI Teacher in Page 3 (Build) will explain these as you code.`);
    }
  };

  return (
    <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div className="badge badge-emerald" style={{ marginBottom: '8px' }}>
            <BookOpen size={14} style={{ marginRight: '6px' }} />
            Page 2 • Agentic Research & Relevance Engine
          </div>
          <h1 style={{ fontSize: '2.2rem', color: '#FFF', marginBottom: '6px' }}>
            Semantic Research Graph
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Evaluates Q (Original Idea Vector) vs K (Literature Sources) using multi-factor relevance scoring.
          </p>
        </div>

        {/* Live Search Input */}
        <div style={{ display: 'flex', gap: '8px', minWidth: '360px' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search papers, docs, or benchmarks..."
            value={newSearchQuery}
            onChange={(e) => setNewSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRunSearch()}
          />
          <button className="btn-cyan" onClick={handleRunSearch} disabled={isSearching}>
            <Search size={16} />
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Main Grid: Research List (Left) + Detailed Paper & Q&A Workspace (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
        {/* Left Column: Research Graph Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>RELEVANT LITERATURE & STANDARDS ({researchGraph.length})</span>
            <span style={{ fontSize: '0.78rem', color: '#10B981' }}>{researchGraph.filter(p => p.saved).length} Saved</span>
          </div>

          {researchGraph.map((paper) => {
            const isSelected = selectedPaper?.id === paper.id;
            return (
              <div
                key={paper.id}
                onClick={() => setSelectedPaper(paper)}
                className={`glass-panel ${isSelected ? 'glass-panel-glow' : ''}`}
                style={{
                  padding: '18px',
                  cursor: 'pointer',
                  borderLeft: isSelected ? '4px solid var(--accent-primary)' : '1px solid var(--border-color)',
                  background: isSelected ? 'rgba(26, 35, 56, 0.9)' : 'rgba(18, 24, 38, 0.7)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                    {paper.graphNode}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#67E8F9' }}>
                      {paper.semanticScore}% Match
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSaveResearch(paper.id);
                      }}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: paper.saved ? '#10B981' : 'var(--text-dim)' }}
                    >
                      <Bookmark size={18} fill={paper.saved ? '#10B981' : 'none'} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '1.02rem', color: '#FFF', lineHeight: '1.4', marginBottom: '6px' }}>
                  {paper.title}
                </h3>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  {paper.authors} ({paper.year}) • {paper.source}
                </div>

                {/* Score Breakdown Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: 'rgba(9, 13, 22, 0.6)', padding: '6px 10px', borderRadius: '6px', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                  <div>Sem: <strong style={{ color: '#A5B4FC' }}>{paper.semanticScore}%</strong></div>
                  <div>Prob: <strong style={{ color: '#67E8F9' }}>{paper.problemAlignment}%</strong></div>
                  <div>Tech: <strong style={{ color: '#6EE7B7' }}>{paper.techRelevance}%</strong></div>
                  <div>Arch: <strong style={{ color: '#FDE68A' }}>{paper.archRelevance}%</strong></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Selected Paper Deep Dive & AI Q&A */}
        {selectedPaper ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                <div>
                  <span className="badge badge-cyan" style={{ marginBottom: '4px' }}>Paper Deep Dive</span>
                  <h2 style={{ fontSize: '1.25rem', color: '#FFF' }}>{selectedPaper.title}</h2>
                </div>
                <button 
                  className={selectedPaper.saved ? 'btn-emerald' : 'btn-secondary'}
                  onClick={() => toggleSaveResearch(selectedPaper.id)}
                >
                  <Bookmark size={16} />
                  {selectedPaper.saved ? 'Saved in Graph' : 'Save to Graph'}
                </button>
              </div>

              {/* Relevance Multi-Factor Metrics */}
              <div style={{ background: 'rgba(15, 21, 33, 0.8)', padding: '16px', borderRadius: '10px', marginBottom: '20px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>
                  Q (IDEA) VS K (SOURCE) RELEVANCE EVALUATION
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#E2E8F0', marginBottom: '4px' }}>
                      <span>Semantic Relevance</span>
                      <strong style={{ color: '#6366F1' }}>{selectedPaper.semanticScore}%</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedPaper.semanticScore}%`, background: 'var(--accent-primary)', height: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#E2E8F0', marginBottom: '4px' }}>
                      <span>Problem Alignment</span>
                      <strong style={{ color: '#06B6D4' }}>{selectedPaper.problemAlignment}%</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedPaper.problemAlignment}%`, background: 'var(--accent-secondary)', height: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#E2E8F0', marginBottom: '4px' }}>
                      <span>Technical Relevance</span>
                      <strong style={{ color: '#10B981' }}>{selectedPaper.techRelevance}%</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedPaper.techRelevance}%`, background: 'var(--accent-emerald)', height: '100%' }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#E2E8F0', marginBottom: '4px' }}>
                      <span>Architecture Relevance</span>
                      <strong style={{ color: '#F59E0B' }}>{selectedPaper.archRelevance}%</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 255, 255, 0.1)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${selectedPaper.archRelevance}%`, background: 'var(--accent-amber)', height: '100%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Why This Matters Section */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: '600', color: '#67E8F9', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} />
                  Why This Research Matters For Your Project:
                </div>
                <p style={{ fontSize: '0.92rem', color: '#F1F5F9', lineHeight: '1.6', background: 'rgba(6, 182, 212, 0.08)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                  {selectedPaper.whyItMatters}
                </p>
              </div>

              {/* Connected Concepts Tags */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: '600' }}>
                  CONNECTED CONCEPTS (ADDED TO USER KNOWLEDGE MODEL):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {selectedPaper.connectedConcepts.map((concept) => (
                    <span key={concept} className="badge badge-indigo" style={{ textTransform: 'none', fontSize: '0.82rem' }}>
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Interactive AI Paper Q&A Buttons */}
              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '10px' }}>
                  ASK AI ABOUT THIS PAPER'S RELATIONSHIP TO YOUR PROJECT:
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  <button className="btn-secondary" style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }} onClick={() => handleAskQuestion('Why is this paper relevant to my project?')}>
                    <HelpCircle size={14} color="#6366F1" /> Why is this paper relevant?
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }} onClick={() => handleAskQuestion('Which part of my architecture does this research support?')}>
                    <Network size={14} color="#06B6D4" /> Which architecture part?
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }} onClick={() => handleAskQuestion('Does this research contradict my approach?')}>
                    <X size={14} color="#F43F5E" /> Does it contradict my approach?
                  </button>
                  <button className="btn-secondary" style={{ fontSize: '0.78rem', justifyContent: 'flex-start' }} onClick={() => handleAskQuestion('What concept should I learn from this research?')}>
                    <Brain size={14} color="#10B981" /> What concept to learn?
                  </button>
                </div>

                {qaAnswer && (
                  <div className="animate-fade-in" style={{ background: 'rgba(15, 21, 33, 0.95)', border: '1px solid var(--border-glow)', padding: '14px 18px', borderRadius: '10px', fontSize: '0.88rem', color: '#E2E8F0', lineHeight: '1.5' }}>
                    <strong style={{ color: '#67E8F9', display: 'block', marginBottom: '4px' }}>Q: {qaTopic}</strong>
                    {qaAnswer}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '32px' }}>
        <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setActiveStep('define')}>
          Define This Project <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
