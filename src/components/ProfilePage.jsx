import React from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  UserCheck, 
  BrainCircuit, 
  Sparkles, 
  ArrowRight, 
  Code, 
  GraduationCap, 
  Target,
  BookOpenCheck
} from 'lucide-react';

const KNOWLEDGE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const LANGUAGES = ['Python', 'Java', 'JavaScript', 'Rust', 'C++'];
const SUBJECTS = ['AI', 'Compiler', 'Algorithms', 'Web', 'DistributedSystems'];

export const ProfilePage = () => {
  const { profile, setProfile, setActiveStep } = useProject();

  const handleLevelChange = (langOrSubject, level, type = 'languages') => {
    setProfile((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [langOrSubject]: level,
      },
    }));
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }} className="animate-fade-in">
      {/* Title Header */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div className="badge badge-indigo" style={{ marginBottom: '12px', padding: '6px 14px' }}>
          <BrainCircuit size={14} style={{ marginRight: '6px' }} />
          User Knowledge Model Setup
        </div>
        <h1 style={{ fontSize: '2.4rem', color: '#FFF', marginBottom: '10px' }}>
          Personalize Your AI Engineering Assistant
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto', lineHeight: '1.6' }}>
          The AI Engineering Notebook tailors research depth, code explanations, AST breakdowns, and error tutorials specifically to your technical background.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Basic Info */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <GraduationCap size={20} color="#6366F1" />
            <h3 style={{ fontSize: '1.15rem', color: '#FFF' }}>1. Developer Identity</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Your Name</label>
              <input
                type="text"
                className="input-field"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Role / Class</label>
                <input
                  type="text"
                  className="input-field"
                  value={profile.role}
                  onChange={(e) => setProfile({ ...profile, role: e.target.value })}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Academic Year / Status</label>
                <input
                  type="text"
                  className="input-field"
                  value={profile.year}
                  onChange={(e) => setProfile({ ...profile, year: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>General Proficiency Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {KNOWLEDGE_LEVELS.map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setProfile({ ...profile, overallLevel: lvl })}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: profile.overallLevel === lvl ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: profile.overallLevel === lvl ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 21, 33, 0.6)',
                      color: profile.overallLevel === lvl ? '#FFF' : 'var(--text-muted)',
                      fontSize: '0.82rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Project Target */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Target size={20} color="#06B6D4" />
            <h3 style={{ fontSize: '1.15rem', color: '#FFF' }}>2. Objective & Preferences</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>What You Want To Build</label>
              <textarea
                className="textarea-field"
                style={{ minHeight: '80px' }}
                value={profile.goal}
                onChange={(e) => setProfile({ ...profile, goal: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.86rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Preferred AI Explanation Depth</label>
              <select
                className="input-field"
                value={profile.preferredExplanation}
                onChange={(e) => setProfile({ ...profile, preferredExplanation: e.target.value })}
              >
                <option value="Beginner Friendly (Analogy + High Level)">Beginner Friendly (Analogy + High Level)</option>
                <option value="Balanced (Concepts + Code + Metrics)">Balanced (Concepts + Code + Metrics)</option>
                <option value="Advanced Technical (Formal Complexity + AST + Low-level IR)">Advanced Technical (Formal Complexity + AST + Low-level IR)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Language & Subject Knowledge Matrix */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
          <Code size={20} color="#10B981" />
          <h3 style={{ fontSize: '1.15rem', color: '#FFF' }}>3. User Knowledge Matrix</h3>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Controls AI teaching density (no redundant explanations for Expert skills)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Languages */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#A5B4FC', marginBottom: '12px' }}>Programming Languages</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {LANGUAGES.map((lang) => (
                <div key={lang} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 21, 33, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#FFF' }}>{lang}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {KNOWLEDGE_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleLevelChange(lang, lvl, 'languages')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: profile.languages[lang] === lvl ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                          color: profile.languages[lang] === lvl ? '#FFF' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {lvl.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div>
            <h4 style={{ fontSize: '0.95rem', color: '#67E8F9', marginBottom: '12px' }}>Technical Subjects</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {SUBJECTS.map((subj) => (
                <div key={subj} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 21, 33, 0.6)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#FFF' }}>{subj}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {KNOWLEDGE_LEVELS.map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => handleLevelChange(subj, lvl, 'subjects')}
                        style={{
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          background: profile.subjects[subj] === lvl ? 'var(--accent-secondary)' : 'rgba(255, 255, 255, 0.05)',
                          color: profile.subjects[subj] === lvl ? '#FFF' : 'var(--text-muted)',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        {lvl.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Generated Summary Card & Continue Button */}
      <div className="glass-panel-glow" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6EE7B7', fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>
            <BookOpenCheck size={18} />
            User Knowledge Model Active
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            AI will teach only concepts required for your target project: <strong>{profile.goal}</strong>
          </p>
        </div>
        <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setActiveStep('idea')}>
          Save & Proceed to Idea <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
