import React, { useEffect, useState } from 'react';
import { ArrowRight, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { isSupabaseConfigured, supabaseAuth } from '../integrations/supabaseClient';
import { saveAuthSession } from '../integrations/authSession';

export const AuthPage = ({ onAuthenticated }) => {
  const [mode, setMode] = useState('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  useEffect(() => {
    document.body.classList.add('notebook-body', 'page-grid');
    return () => document.body.classList.remove('notebook-body', 'page-grid');
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) { setState({ status: 'error', message: 'Supabase is not configured. Add the project URL and publishable key to .env.local.' }); return; }
    if (mode === 'signup' && !name.trim()) { setState({ status: 'error', message: 'Add your name so the notebook can personalize explanations.' }); return; }
    if (!email.trim() || !email.includes('@')) { setState({ status: 'error', message: 'Enter a valid email address.' }); return; }
    if (password.length < 8) { setState({ status: 'error', message: 'Use a password with at least 8 characters.' }); return; }
    setState({ status: 'loading', message: '' });
    try {
      const session = mode === 'signup'
        ? await supabaseAuth.signUp({ email: email.trim(), password, name: name.trim() })
        : await supabaseAuth.signIn({ email: email.trim(), password });
      if (!session.accessToken) {
        setState({ status: 'success', message: 'Account created. Check your email to confirm it, then sign in.' });
        setMode('signin');
        setPassword('');
        return;
      }
      saveAuthSession(session);
      onAuthenticated(session);
    } catch (error) {
      setState({ status: 'error', message: error.message || 'We could not complete that request.' });
    }
  };

  return <div className="auth-app">
    <aside className="auth-spine" aria-hidden="true"><div className="spine-thread" /><div className="auth-spine-mark">AEN</div><div className="auth-spine-label">START</div><div className="auth-spine-label muted">BUILD</div></aside>
    <header className="auth-header"><div className="notebook-brand"><span className="notebook-brand-mark">AEN</span><span className="notebook-brand-name">AI Engineering Notebook</span></div><span className="stage-flag">PRIVATE WORKSPACE</span></header>
    <main className="auth-main"><section className="auth-copy"><p className="eyebrow">A quiet place to build</p><h1 className="stage-title">Start with the idea.<br />Keep everything connected.</h1><p className="stage-sub">One notebook for your project idea, research, code, explanations, notes, and final presentation.</p><div className="auth-path"><span>01</span><div><strong>Write naturally</strong><small>Tell us what you want to make.</small></div></div><div className="auth-path"><span>02</span><div><strong>Build with context</strong><small>Your project state follows you between stages.</small></div></div><div className="auth-path"><span>03</span><div><strong>Understand the result</strong><small>Keep the code, notes, and evidence together.</small></div></div></section>
      <section className="card auth-card"><div className="auth-card-top"><span className="result-type">{mode === 'signup' ? 'NEW NOTEBOOK' : 'WELCOME BACK'}</span><span className="auth-lock"><LockKeyhole size={14} /> encrypted session</span></div><h2>{mode === 'signup' ? 'Create your account' : 'Open your notebook'}</h2><p className="auth-card-sub">{mode === 'signup' ? 'Your first project will be ready when you are.' : 'Continue where you left off.'}</p><form onSubmit={submit}>{mode === 'signup' && <label className="auth-field"><span><UserRound size={14} /> Your name</span><input className="notebook-input" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" placeholder="e.g. Alex Chen" /></label>}<label className="auth-field"><span><Mail size={14} /> Email</span><input className="notebook-input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" placeholder="you@example.com" /></label><label className="auth-field"><span><LockKeyhole size={14} /> Password</span><input className="notebook-input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder="At least 8 characters" /></label>{state.message && <div className={`auth-message ${state.status}`} role={state.status === 'error' ? 'alert' : 'status'}>{state.message}</div>}<button className="notebook-btn teal auth-submit" disabled={state.status === 'loading'}>{state.status === 'loading' ? 'Opening notebook…' : mode === 'signup' ? 'Create account' : 'Sign in'} <ArrowRight size={15} /></button></form><div className="auth-switch"><span>{mode === 'signup' ? 'Already have an account?' : 'New to the notebook?'}</span><button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setState({ status: 'idle', message: '' }); }}>{mode === 'signup' ? 'Sign in' : 'Create account'}</button></div><p className="auth-footnote">Your project data is stored in your Supabase workspace and is only available after you sign in.</p></section>
    </main>
  </div>;
};
