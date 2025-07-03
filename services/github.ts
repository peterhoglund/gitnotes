
import { Repository, GitHubUser, RepoContentNode, FileContent } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

const apiFetchWithHeaders = async (url: string, token: string, options: RequestInit = {}) => {
  const response = await fetch(`${GITHUB_API_BASE}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `API request failed with status ${response.status}` }));
    if (response.status === 401) {
      throw new Error('GitHub token is invalid or expired. Please log in again.');
    }
     if (response.status === 404) {
      throw new Error('Not Found. The requested resource could not be found.');
    }
    if (response.status === 422 && errorData.errors) {
        throw new Error(errorData.errors[0].message);
    }
    throw new Error(errorData.message || `An unknown error occurred.`);
  }
  
  return response;
};

const apiFetch = async (url: string, token: string, options: RequestInit = {}) => {
    const response = await apiFetchWithHeaders(url, token, options);
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

export const getTokenScopes = async (token: string): Promise<string[]> => {
    try {
        const response = await apiFetchWithHeaders('/user', token);
        const scopesHeader = response.headers.get('X-OAuth-Scopes');
        return scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];
    } catch (error) {
        console.error("Failed to get token scopes:", error);
        return [];
    }
};

export const getUserRepos = (token: string): Promise<Repository[]> => {
    return apiFetch('/user/repos?sort=pushed&per_page=100', token);
};

export const createRepo = (token: string, name: string): Promise<Repository> => {
    return apiFetch('/user/repos', token, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            private: true,
            description: 'Documents created and managed by Zen Editor.',
            auto_init: true,
        }),
    });
};

export const getUserProfile = (token: string): Promise<GitHubUser> => {
  return apiFetch('/user', token);
}

export const getUserEmails = (token: string): Promise<{email: string, primary: boolean}[]> => {
    return apiFetch('/user/emails', token);
}

export const getRepoContents = (token: string, repoFullName: string, path: string): Promise<RepoContentNode[]> => {
    return apiFetch(`/repos/${repoFullName}/contents/${encodeURIComponent(path)}`, token);
};

export const getFileContent = (token: string, repoFullName: string, path: string): Promise<FileContent> => {
    return apiFetch(`/repos/${repoFullName}/contents/${encodeURIComponent(path)}`, token);
};

export const updateFile = async (token: string, repoFullName: string, path: string, content: string, sha?: string): Promise<{content: RepoContentNode}> => {
    const encodedContent = btoa(unescape(encodeURIComponent(content)));

    const body: { message: string; content: string; sha?: string } = {
        message: `docs: update ${path}`,
        content: encodedContent,
    };
    if (sha) {
        body.sha = sha;
    }
    
    return apiFetch(`/repos/${repoFullName}/contents/${encodeURIComponent(path)}`, token, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
};
