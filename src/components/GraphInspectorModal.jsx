import React from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  X, 
  Network, 
  User, 
  Lightbulb, 
  BookOpen, 
  Code2, 
  Cpu, 
  AlertTriangle, 
  CheckCircle, 
  Presentation,
  ArrowRight
} from 'lucide-react';

export const GraphInspectorModal = () => {
  const { isInspectorOpen, setIsInspectorOpen, profile, idea, researchGraph, activeLanguage, activeError } = useProject();

  if (!isInspectorOpen) return null;

  const savedPapers = researchGraph.filter((p) => p.saved).length;

  const nodes = [
    { label: 'User Profile', val: `${profile.name} (${profile.overallLevel})`, icon: User, color: '#6366F1' },
    { label: 'Problem / Idea', val: idea.problem.substring(0, 45) + '...', icon: Lightbulb, color: '#06B6D4' },
    { label: 'Research Graph', val: `${savedPapers} Papers Saved`, icon: BookOpen, color: '#10B981' },
    { label: 'Architecture', val: idea.domain, icon: Cpu, color: '#8B5CF6' },
    { label: 'Active Code', val: `${activeLanguage.toUpperCase()} Workspace`, icon: Code2, color: '#F59E0B' },
    { label: 'Execution / XAI', val: activeError ? `Error: ${activeError.error_id}` : 'Clean AST & IR state', icon: activeError ? AlertTriangle : CheckCircle, color: activeError ? '#F43F5E' : '#10B981' },
    { label: 'Presentation Deck', val: 'LaTeX Beamer Ready', icon: Presentation, color: '#EC4899' },
  ];

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '28px',
        border: '1px solid var(--border-glow)'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', pb: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Network size={24} color="#06B6D4" />
            <div>
              <h2 style={{ fontSize: '1.25rem', color: '#FFF' }}>Central Project Semantic Graph</h2>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Persistent state engine linking all steps of your notebook
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsInspectorOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Graph Pipeline Visualization */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {nodes.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  flex: 1,
                  background: 'rgba(15, 21, 33, 0.8)',
                  border: `1px solid ${node.color}40`,
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      background: `${node.color}20`,
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Icon size={18} color={node.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                        {node.label}
                      </div>
                      <div style={{ fontSize: '0.92rem', color: '#FFF', fontWeight: '500' }}>
                        {node.val}
                      </div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: `${node.color}20`, color: node.color, border: `1px solid ${node.color}40` }}>
                    Active Context
                  </span>
                </div>
                {i < nodes.length - 1 && (
                  <ArrowRight size={18} color="var(--text-dim)" style={{ transform: 'rotate(90deg)', margin: '0 auto' }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Traceability Summary */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.08)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '0.86rem',
          color: '#E2E8F0',
          lineHeight: '1.5'
        }}>
          <strong>Semantic Traceability Guarantee:</strong> Every AI suggestion, code explanation, AST lowers, error remediation, and slide generation references this shared context graph. You never need to re-explain your project intent.
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
          <button className="btn-primary" onClick={() => setIsInspectorOpen(false)}>
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
