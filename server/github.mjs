const API = 'https://api.github.com';

const githubRequest = async (path, options = {}) => {
  if (!process.env.GITHUB_TOKEN) throw new Error('GitHub publishing is not configured. Add GITHUB_TOKEN to the server environment.');
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || `GitHub request failed (${response.status}).`);
  return body;
};

const safePath = (path) => typeof path === 'string' && path.length <= 240 && !path.startsWith('/') && !path.includes('..');

export async function publishProject({ name, description, isPrivate = true, files = [], owner = process.env.GITHUB_DEFAULT_OWNER }) {
  if (!Array.isArray(files) || files.length === 0 || files.length > 100) throw new Error('Publish requires between 1 and 100 files.');
  if (files.some((file) => !safePath(file.path) || typeof file.content !== 'string' || file.content.length > 1000000)) throw new Error('Every file needs a safe path and must be smaller than 1MB.');
  const configuredUrl = process.env.GITHUB_REPOSITORY_URL;
  const configuredMatch = configuredUrl?.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/i);
  let repository;
  let targetOwner = owner;
  let targetName = name;
  if (configuredMatch) {
    targetOwner = configuredMatch[1];
    targetName = configuredMatch[2];
    repository = await githubRequest(`/repos/${encodeURIComponent(targetOwner)}/${encodeURIComponent(targetName)}`, { method: 'GET' });
  } else {
    if (!name || !/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error('Repository name must contain only letters, numbers, dots, underscores, or hyphens.');
    repository = await githubRequest('/user/repos', { method: 'POST', body: JSON.stringify({ name, description: description || 'Created by Project Notebook', private: isPrivate, auto_init: true }) });
    targetOwner = repository.owner?.login || owner;
  }
  if (!targetOwner) throw new Error('GitHub did not return a repository owner.');
  let latestCommitSha = null;
  for (const file of files) {
    const path = `/repos/${encodeURIComponent(targetOwner)}/${encodeURIComponent(targetName)}/contents/${file.path.split('/').map(encodeURIComponent).join('/')}`;
    let sha;
    try { sha = (await githubRequest(path, { method: 'GET' })).sha; } catch (error) { if (!error.message.includes('(404)') && !error.message.includes('Not Found')) throw error; }
    const update = await githubRequest(path, {
      method: 'PUT',
      body: JSON.stringify({ message: `${sha ? 'Update' : 'Add'} ${file.path}`, content: Buffer.from(file.content, 'utf8').toString('base64'), branch: repository.default_branch || 'main', ...(sha ? { sha } : {}) }),
    });
    latestCommitSha = update.commit?.sha || latestCommitSha;
  }
  return { url: repository.html_url, owner: targetOwner, name: targetName, branch: repository.default_branch || 'main', latestCommitSha, filesPublished: files.length };
}
