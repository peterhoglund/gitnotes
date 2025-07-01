// In a real app, this would be handled by an environment variable.
const CLIENT_ID = 'e2b347201c13d6a6549a';
// A public gatekeeper for demo purposes.
// In a real app, you would host your own.
const GATEKEEPER_URL = 'https://gatekeeper.probot.dev';
export const API_URL = 'https://api.github.com';

// --- Types ---
export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface AccessTokenResponse {
  token: string;
}

export type GitHubFile = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'file';
  download_url: string | null;
  url: string;
};

export type GitHubDir = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: 'dir';
  url: string;
};

export type GitHubContent = GitHubFile | GitHubDir;

// --- OAuth Web Application Flow ---

export function getLoginUrl(): string {
  const ghOauthUrl = 'https://github.com/login/oauth/authorize';
  return `${ghOauthUrl}?client_id=${CLIENT_ID}&scope=repo`;
}

export async function exchangeCodeForToken(code: string): Promise<AccessTokenResponse> {
  const response = await fetch(`${GATEKEEPER_URL}/authenticate/${code}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }
  const data = await response.json();
  if (!data.token) {
    throw new Error('Token not found in gatekeeper response');
  }
  return data;
}


// --- GitHub API Helpers ---

async function githubApi(url: string, token: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
}

export async function getUser(token: string): Promise<GitHubUser> {
  const response = await githubApi('/user', token);
  if (!response.ok) throw new Error('Failed to fetch user');
  return response.json();
}

export async function getRepo(token: string, owner: string, repo: string): Promise<any> {
  const response = await githubApi(`/repos/${owner}/${repo}`, token);
  // 404 is a valid response meaning the repo doesn't exist.
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Failed to get repo: ${response.statusText}`);
  return response.json();
}

export async function createRepo(token: string, repoName: string): Promise<any> {
    const response = await githubApi('/user/repos', token, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            name: repoName,
            private: true,
            auto_init: true, // Creates with a README
        }),
    });
    if (!response.ok) throw new Error('Failed to create repository');
    return response.json();
}


export async function getContents(token: string, owner: string, repo: string, path: string = ''): Promise<GitHubContent[]> {
  const response = await githubApi(`/repos/${owner}/${repo}/contents/${path}`, token);
  if (!response.ok) throw new Error('Failed to list contents');
  return response.json();
}

export async function loadFile(token: string, url: string): Promise<{content: string; sha: string}> {
    const response = await githubApi(url.replace(API_URL, ''), token);
    if (!response.ok) throw new Error('Failed to load file content');
    const data = await response.json();
    const content = decodeURIComponent(escape(atob(data.content)));
    return { content, sha: data.sha };
}

export async function saveFile(
    token: string,
    owner: string,
    repo: string,
    path: string,
    content: string,
    sha?: string
): Promise<{ sha: string }> {
    const response = await githubApi(`/repos/${owner}/${repo}/contents/${path}`, token, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            message: `docs: update ${path}`,
            content: btoa(unescape(encodeURIComponent(content))),
            branch: 'main',
            sha, // Include SHA if updating an existing file
        }),
    });
    if (!response.ok) throw new Error(`Failed to save file: ${response.statusText}`);
    const data = await response.json();
    return { sha: data.content.sha };
}