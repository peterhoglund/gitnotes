// In a real app, this would be handled by an environment variable.
const CLIENT_ID = 'e2b347201c13d6a6549a';
const GH_OAUTH_URL = 'https://github.com/login/oauth';
export const API_URL = 'https://api.github.com';

// --- Types ---
export interface GitHubUser {
  login: string;
  avatar_url: string;
  name: string | null;
}

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  expires_in: number;
  interval: number;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: string;
  scope: string;
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

// --- OAuth Device Flow ---

export async function getDeviceCode(): Promise<DeviceCodeResponse> {
  const response = await fetch(`${GH_OAUTH_URL}/device/code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ client_id: CLIENT_ID, scope: 'repo' }),
  });
  if (!response.ok) throw new Error('Failed to get device code');
  return response.json();
}

export async function pollForToken(deviceCode: string): Promise<AccessTokenResponse> {
  const response = await fetch(`${GH_OAUTH_URL}/access_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      device_code: deviceCode,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });
  if (!response.ok) throw new Error('Polling for token failed');
  const data = await response.json();
  if (data.error) {
    if (data.error === 'authorization_pending') {
      // This is expected, the caller should handle polling
      throw new Error('authorization_pending');
    }
    throw new Error(data.error_description || 'An unknown error occurred');
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