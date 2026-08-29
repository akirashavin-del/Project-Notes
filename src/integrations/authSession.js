const AUTH_STORAGE_KEY = 'project-notebook:auth:v1';

export const readAuthSession = () => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

export const saveAuthSession = (session) => {
  if (typeof window !== 'undefined') window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const clearAuthSession = () => {
  if (typeof window !== 'undefined') window.localStorage.removeItem(AUTH_STORAGE_KEY);
};
