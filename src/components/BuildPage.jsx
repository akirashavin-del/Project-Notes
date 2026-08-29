import React, { useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { 
  Code2, 
  Brain, 
  Cpu, 
  AlertTriangle, 
  Sparkles, 
  Check, 
  X, 
  Play, 
  RotateCcw, 
  Layers, 
  GitBranch, 
  Layout, 
  Zap, 
  ArrowRight,
  HelpCircle,
  Terminal,
  ShieldAlert
} from 'lucide-react';

const LANGUAGES = [
  { id: 'python', name: 'Python 3.12', badge: 'badge-emerald' },
  { id: 'java', name: 'Java 21 (JVM)', badge: 'badge-amber' },
  { id: 'c', name: 'C17 (GCC)', badge: 'badge-cyan' },
];

export const BuildPage = () => {
  const {
    activeLanguage,
    switchLanguage,
    code,
    updateCode,
    selectedCode,
    setSelectedCode,
    profile,
    getKnowledgeLevel,
    isOptimizerActive,
    suggestedCode,
    generateOptimization,
    acceptOptimization,
    rejectOptimization,
    activeError,
    triggerSimulatedError,
    clearError,
    setActiveStep
  } = useProject();

  const [activeTab, setActiveTab] = useState('teacher'); // teacher, optimizer, ir, xai, liveui
  const [executionOutput, setExecutionOutput] = useState(null);
  const [liveInputs, setLiveInputs] = useState({ blockA: 'Python_AST_Block_01', blockB: 'Java_JVM_Boundary_02' });

  // Handle code selection for Contextual AI Teacher
  const handleCodeMouseUp = (e) => {
    const text = window.getSelection().toString().trim();
    if (text.length > 5) {
      setSelectedCode(text);
      setActiveTab('teacher');
    }
  };

  // Run code simulation
  const handleRunCode = () => {
    setExecutionOutput({
      status: 'SUCCESS',
      time: '14ms',
      result: {
        compatibility_score: 92.5,
        is_compatible: true,
        requires_isolated_node: false,
        matched_types: 3,
        ir_node: 'Node_Polyglot_IR_0x4092'
      }
    });
  };

  const userLevel = getKnowledgeLevel(activeLanguage === 'python' ? 'Python' : activeLanguage === 'java' ? 'Java' : 'C');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }} className="animate-fade-in">
      {/* Top Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="badge badge-indigo" style={{ marginBottom: '6px' }}>
            <Code2 size={14} style={{ marginRight: '6px' }} />
            Page 3 • Polyglot Build & AI Teacher Workspace
          </div>
          <h1 style={{ fontSize: '2rem', color: '#FFF' }}>
            Interactive Engineering Development Environment
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick Action Buttons */}
          <button className="btn-secondary" style={{ fontSize: '0.84rem' }} onClick={generateOptimization}>
            <Zap size={15} color="#F59E0B" /> Baseline Optimizer
          </button>
          <button className="btn-secondary" style={{ fontSize: '0.84rem' }} onClick={triggerSimulatedError}>
            <AlertTriangle size={15} color="#F43F5E" /> Simulate Runtime Error
          </button>
          <button className="btn-primary" style={{ padding: '8px 18px', fontSize: '0.88rem' }} onClick={handleRunCode}>
            <Play size={16} /> Execute IR Code
          </button>
        </div>
      </div>

      {/* Main Dual-Panel Split View */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Column: Modern Code Editor */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '740px', overflow: 'hidden' }}>
          {/* Editor Header & Language Selector */}
          <div style={{ background: 'rgba(9, 13, 22, 0.9)', padding: '12px 18px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => switchLanguage(lang.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: activeLanguage === lang.id ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    background: activeLanguage === lang.id ? 'rgba(99, 102, 241, 0.25)' : 'transparent',
                    color: activeLanguage === lang.id ? '#FFF' : 'var(--text-muted)',
                    fontSize: '0.82rem',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {lang.name}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Knowledge Level: <strong style={{ color: '#67E8F9' }}>{userLevel}</strong>
            </div>
          </div>

          {/* Code Textarea / Line-Numbered Editor Area */}
          <div style={{ position: 'relative', flex: 1, display: 'flex', background: '#070B14' }}>
            {/* Line numbers column */}
            <div style={{
              width: '44px',
              padding: '16px 0',
              textAlign: 'right',
              color: 'var(--text-dim)',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-code)',
              lineHeight: '1.6',
              userSelect: 'none',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRight: '1px solid var(--border-color)',
              paddingRight: '10px'
            }}>
              {code.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Editable code text area with selection highlight listener */}
            <textarea
              value={code}
              onChange={(e) => updateCode(e.target.value)}
              onMouseUp={handleCodeMouseUp}
              onKeyUp={handleCodeMouseUp}
              spellCheck="false"
              style={{
                flex: 1,
                padding: '16px 18px',
                background: 'transparent',
                border: 'none',
                color: '#E2E8F0',
                fontFamily: 'var(--font-code)',
                fontSize: '0.92rem',
                lineHeight: '1.6',
                outline: 'none',
                resize: 'none',
                whiteSpace: 'pre',
                tabSize: 4
              }}
            />
          </div>

          {/* Execution Output Footer */}
          {executionOutput && (
            <div style={{ background: 'rgba(9, 13, 22, 0.95)', borderTop: '1px solid var(--border-color)', padding: '12px 18px', fontSize: '0.84rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: '#10B981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Terminal size={14} /> Execution Result ({executionOutput.time})
                </span>
                <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={() => setExecutionOutput(null)}>Clear</button>
              </div>
              <pre style={{ color: '#67E8F9', fontFamily: 'var(--font-code)', fontSize: '0.82rem' }}>
                {JSON.stringify(executionOutput.result, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Right Column: AI Teacher & Engine Tabs */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', height: '740px', overflow: 'hidden' }}>
          {/* Sub-header Navigation Tabs */}
          <div style={{ background: 'rgba(9, 13, 22, 0.9)', padding: '10px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
            <button
              onClick={() => setActiveTab('teacher')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'teacher' ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                color: activeTab === 'teacher' ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Brain size={14} color="#6366F1" /> AI Teacher
            </button>

            <button
              onClick={() => setActiveTab('optimizer')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'optimizer' ? 'rgba(245, 158, 11, 0.3)' : 'transparent',
                color: activeTab === 'optimizer' ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Zap size={14} color="#F59E0B" /> Baseline Optimizer
            </button>

            <button
              onClick={() => setActiveTab('ir')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'ir' ? 'rgba(6, 182, 212, 0.3)' : 'transparent',
                color: activeTab === 'ir' ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Cpu size={14} color="#06B6D4" /> AST & Semantic IR
            </button>

            <button
              onClick={() => setActiveTab('xai')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'xai' ? 'rgba(244, 63, 94, 0.3)' : 'transparent',
                color: activeTab === 'xai' ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ShieldAlert size={14} color="#F43F5E" /> XAI Debugger
            </button>

            <button
              onClick={() => setActiveTab('liveui')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeTab === 'liveui' ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                color: activeTab === 'liveui' ? '#FFF' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layout size={14} color="#10B981" /> Live UI Preview
            </button>
          </div>

          {/* Tab Content Panel */}
          <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
            {/* 1. Contextual AI Teacher */}
            {activeTab === 'teacher' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-indigo">Contextual Explanation Engine</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target: {profile.name} ({userLevel})</span>
                  </div>
                </div>

                {selectedCode ? (
                  <div style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.78rem', color: '#A5B4FC', fontWeight: '600', marginBottom: '4px' }}>SELECTED CODE SNIPPET:</div>
                    <pre style={{ color: '#FFF', fontFamily: 'var(--font-code)', fontSize: '0.85rem' }}>{selectedCode}</pre>
                  </div>
                ) : (
                  <div style={{ background: 'rgba(15, 21, 33, 0.6)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                    💡 <em>Tip: Highlight any line or block of code in the editor to trigger a contextual AI explanation tailored to your knowledge level.</em>
                  </div>
                )}

                {/* Adapted Context Explanation Card */}
                <div style={{ background: 'rgba(15, 21, 33, 0.9)', padding: '18px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#67E8F9', marginBottom: '10px' }}>
                    Contextual Analysis ({userLevel} Level Adaptation):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.88rem', color: '#E2E8F0', lineHeight: '1.6' }}>
                    <div>
                      <strong style={{ color: '#A5B4FC' }}>What this code does:</strong>
                      <p style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                        {userLevel === 'Beginner' 
                          ? 'This function acts like a filter checking if two code modules can understand each other\'s data.' 
                          : 'Performs semantic type set intersection between exported schema signatures and imported runtime dependencies.'}
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: '#67E8F9' }}>Why it exists:</strong>
                      <p style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                        Connected to <strong>Research Paper #1 (GraalVM Polyglot Boundary)</strong> to prevent runtime type exceptions across foreign function calls.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: '#6EE7B7' }}>Data Inputs & Outputs:</strong>
                      <p style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                        Inputs: <code>block_a: dict</code>, <code>block_b: dict</code> → Output: <code>CompatibilityResult object</code> with percentage score.
                      </p>
                    </div>

                    <div>
                      <strong style={{ color: '#FDE68A' }}>How it connects to rest of program:</strong>
                      <p style={{ marginTop: '2px', color: 'var(--text-muted)' }}>
                        If score &lt; 80%, system delegates execution to an <code>Isolated Execution Node</code> to protect the global Project Semantic Graph.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Baseline Optimizer */}
            {activeTab === 'optimizer' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFF' }}>Baseline Code Optimizer</h3>
                  <span className="badge badge-amber">Side-by-Side Equivalence Check</span>
                </div>

                {isOptimizerActive && suggestedCode ? (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#FDA4AF', fontWeight: '700', marginBottom: '6px' }}>CURRENT CODE</div>
                        <pre style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)', color: '#FFF' }}>{code}</pre>
                      </div>

                      <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '12px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.78rem', color: '#6EE7B7', fontWeight: '700', marginBottom: '6px' }}>SUGGESTED OPTIMIZED CODE</div>
                        <pre style={{ fontSize: '0.78rem', fontFamily: 'var(--font-code)', color: '#FFF' }}>{suggestedCode}</pre>
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 21, 33, 0.8)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px', fontSize: '0.84rem' }}>
                      <div style={{ color: '#FDE68A', fontWeight: '600', marginBottom: '4px' }}>Optimization Rationale:</div>
                      - Replaced O(N*M) linear search with O(1) set intersection.<br/>
                      - Added explicit Python 3.12 type hints.<br/>
                      - Semantic Equivalence Score: <strong style={{ color: '#10B981' }}>100%</strong> (No behavioral change, lower memory overhead).
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button className="btn-emerald" onClick={acceptOptimization}>
                        <Check size={16} /> Accept Refactor
                      </button>
                      <button className="btn-secondary" onClick={rejectOptimization}>
                        <X size={16} /> Reject Suggestion
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 21, 33, 0.5)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                    <Zap size={32} color="#F59E0B" style={{ marginBottom: '10px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      Analyze current code for readability, performance bottlenecks, and language idioms.
                    </p>
                    <button className="btn-cyan" onClick={generateOptimization}>
                      Run Baseline Optimizer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 3. AST & Common Semantic IR Engine */}
            {activeTab === 'ir' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFF' }}>AST & Common Semantic IR Visualizer</h3>
                  <span className="badge badge-cyan">Universal Polyglot IR</span>
                </div>

                {/* Structured IR Node Visualization */}
                <div style={{ background: '#070B14', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '10px', fontFamily: 'var(--font-code)', fontSize: '0.82rem', color: '#A5B4FC' }}>
                  <div style={{ color: '#67E8F9', fontWeight: '700', marginBottom: '8px' }}>// Common Semantic IR Node [ID: IR_0x4092]</div>
                  <div>Operation: <span style={{ color: '#FFF' }}>"TYPE_SCHEMA_INTERSECTION"</span></div>
                  <div>Operands: <span style={{ color: '#FFF' }}>["block_a.exported_types", "block_b.imported_types"]</span></div>
                  <div>Type Schema: <span style={{ color: '#FFF' }}>"Dict&#123;compatibility_score: Float, is_compatible: Bool&#125;"</span></div>
                  <div>Control Flow: <span style={{ color: '#FFF' }}>"Sequential Reduction with Early Exit"</span></div>
                  <div>Memory Effects: <span style={{ color: '#FFF' }}>["Pure Function / Zero Heap Side-Effects"]</span></div>
                  <div>Runtime Requirement: <span style={{ color: '#FFF' }}>"WASM / JVM Sandboxed Boundary"</span></div>
                </div>

                {/* Cross-Language Compatibility Matrix */}
                <div style={{ background: 'rgba(15, 21, 33, 0.9)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#FFF', marginBottom: '10px' }}>
                    Cross-Language Block Compatibility Handshake
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
                      <strong style={{ color: '#A5B4FC', fontSize: '0.8rem' }}>Block A (Python)</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Exports: List[TypeSignature]</div>
                    </div>
                    <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(6, 182, 212, 0.25)' }}>
                      <strong style={{ color: '#67E8F9', fontSize: '0.8rem' }}>Block B (Java JVM)</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Imports: PolyglotExecutionNode</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    <span style={{ fontSize: '0.84rem', color: '#6EE7B7', fontWeight: '600' }}>Compatibility Status: COMPATIBLE (92.5%)</span>
                    <span className="badge badge-emerald">Direct IR Merge</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. XAI Error System */}
            {activeTab === 'xai' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFF' }}>Explainable AI (XAI) Debugger</h3>
                  <span className="badge badge-rose">Structured Error IR</span>
                </div>

                {activeError ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.35)', padding: '16px', borderRadius: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ color: '#FDA4AF', fontWeight: '700', fontSize: '0.9rem' }}>{activeError.error_id} • {activeError.source_location}</span>
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }} onClick={clearError}>Dismiss</button>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#FFF', fontFamily: 'var(--font-code)', marginBottom: '8px' }}>
                        {activeError.compiler_message}
                      </div>
                    </div>

                    <div style={{ background: 'rgba(15, 21, 33, 0.9)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.86rem', lineHeight: '1.6' }}>
                      <strong style={{ color: '#67E8F9', display: 'block', marginBottom: '6px' }}>XAI Root Cause Analysis:</strong>
                      {activeError.xai_explanation}
                    </div>

                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '14px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '0.86rem' }}>
                      <strong style={{ color: '#6EE7B7', display: 'block', marginBottom: '4px' }}>Recommended Fix:</strong>
                      {activeError.fix_suggestion}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(15, 21, 33, 0.5)', borderRadius: '10px', border: '1px dashed var(--border-color)' }}>
                    <ShieldAlert size={32} color="#10B981" style={{ marginBottom: '10px' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      No active errors in compilation context. Click below to simulate a cross-language type boundary error.
                    </p>
                    <button className="btn-secondary" onClick={triggerSimulatedError}>
                      Trigger Simulated Compatibility Error
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. Live UI Schema Preview */}
            {activeTab === 'liveui' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h3 style={{ fontSize: '1.05rem', color: '#FFF' }}>Auto-Generated Live Interface</h3>
                  <span className="badge badge-emerald">AST Schema Driven</span>
                </div>

                <div className="glass-panel-glow" style={{ padding: '20px' }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px', fontWeight: '600' }}>
                    INTERACTIVE UI GENERATED FROM COMPATIBILITY CHECK FUNCTION:
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Block A Identifier</label>
                      <input
                        type="text"
                        className="input-field"
                        value={liveInputs.blockA}
                        onChange={(e) => setLiveInputs({ ...liveInputs, blockA: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Block B Identifier</label>
                      <input
                        type="text"
                        className="input-field"
                        value={liveInputs.blockB}
                        onChange={(e) => setLiveInputs({ ...liveInputs, blockB: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ background: 'rgba(9, 13, 22, 0.9)', padding: '16px', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>LIVE EVALUATION RESULT</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#10B981' }}>92.5% Compatibility</div>
                    </div>
                    <span className="badge badge-emerald">Direct Execution Ready</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '28px' }}>
        <button className="btn-primary" style={{ padding: '12px 28px', fontSize: '1rem' }} onClick={() => setActiveStep('ui')}>
          Create Project UI <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};
