import React from 'react';
import { ProjectProvider } from './context/ProjectContext';
import { ReferenceNotebook } from './components/ReferenceNotebook';
import { AuthPage } from './components/AuthPage';
import { clearAuthSession, readAuthSession, saveAuthSession } from './integrations/authSession';
import { supabaseAuth } from './integrations/supabaseClient';
import { useEffect, useState } from 'react';

export function App() {
  const [session, setSession] = useState(readAuthSession);
  const [authStatus, setAuthStatus] = useState(() => session?.accessToken ? 'checking' : 'signed-out');

  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (!session?.accessToken) { setAuthStatus('signed-out'); return; }
      try {
        const expiresAt = Number(session.expiresAt || 0);
        const refreshed = session.refreshToken && expiresAt && expiresAt <= Math.floor(Date.now() / 1000) + 60
          ? await supabaseAuth.refreshSession(session.refreshToken)
          : session;
        if (refreshed.accessToken) await supabaseAuth.getUser(refreshed.accessToken);
        if (!cancelled) { saveAuthSession(refreshed); setSession(refreshed); setAuthStatus('signed-in'); }
      } catch {
        if (!cancelled) { clearAuthSession(); setSession(null); setAuthStatus('signed-out'); }
      }
    };
    restore();
    return () => { cancelled = true; };
  }, [session]);

  const signOut = async () => {
    try { if (session?.accessToken) await supabaseAuth.signOut(session.accessToken); } catch { /* local session is still cleared */ }
    clearAuthSession();
    setSession(null);
    setAuthStatus('signed-out');
  };

  if (authStatus === 'checking') return <div className="auth-loading">Restoring your notebook…</div>;
  if (authStatus !== 'signed-in') return <AuthPage onAuthenticated={(nextSession) => { saveAuthSession(nextSession); setSession(nextSession); setAuthStatus('signed-in'); }} />;
  return <ProjectProvider session={session}><ReferenceNotebook onSignOut={signOut} /></ProjectProvider>;
}

export default App;
