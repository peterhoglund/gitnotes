
import { Repository, GitHubUser, RepoContentNode, FileContent } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

const apiFetchWithHeaders = async (url: string, token: string, options: RequestInit = {}) => {
	const response = await fetch(`${GITHUB_API_BASE}${url}`, {
		cache: 'no-store',
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
		throw new Error(errorData.message || 'An unknown error occurred.');
	}

	return response;
};

const apiFetch = async (url: string, token: string, options: RequestInit = {}) => {
	const response = await apiFetchWithHeaders(url, token, options);
	if (response.status === 204) {
		return null;
	}
	return response.json();
};

export const getTokenScopes = async (token: string): Promise<string[]> => {
	try {
		const response = await apiFetchWithHeaders('/user', token);
		const scopesHeader = response.headers.get('X-OAuth-Scopes');
		return scopesHeader ? scopesHeader.split(',').map(s => s.trim()) : [];
	} catch (error) {
		console.error('Failed to get token scopes:', error);
		return [];
	}
};

export const getUserRepos = async (token: string): Promise<Repository[]> => {
	try {
		const repos = await apiFetch('/user/repos?sort=pushed&per_page=100', token);
		return repos || [];
	} catch (error: any) {
		if (error.message && error.message.includes('Not Found')) {
			console.warn('GET /user/repos returned 404. This might mean the user has no repositories. Returning empty list.');
			return [];
		}
		throw error;
	}
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
			description: 'Documents created and managed by Plita.',
			auto_init: false,
		}),
	});
};

export const getUserProfile = (token: string): Promise<GitHubUser> => {
	return apiFetch('/user', token);
};

export const getUserEmails = async (
	token: string,
): Promise<{ email: string; primary: boolean }[]> => {
	try {
		return await apiFetch('/user/emails', token);
	} catch (error: any) {
		if (error.message?.includes('Not Found')) {
			console.warn(
				'GET /user/emails returned 404 – token probably lacks "user:email" scope. Returning empty list.',
			);
			return [];
		}
		throw error;
	}
};

// Encodes each part of a path, preserving slashes.
const encodePath = (p: string) =>
	p
		.split('/')
		.map(encodeURIComponent)
		.join('/');

// Builds a valid /contents URL. When path is empty, omit the trailing slash.
const buildContentsUrl = (repoFullName: string, path = ''): string =>
	path ? `/repos/${repoFullName}/contents/${encodePath(path)}` : `/repos/${repoFullName}/contents`;

export const getRepoContents = async (
	token: string,
	repoFullName: string,
	path = '',
): Promise<RepoContentNode[]> => {
	try {
		const contents = await apiFetch(buildContentsUrl(repoFullName, path), token);
		return contents || [];
	} catch (error: any) {
		if (error.message && error.message.includes('Not Found')) {
			console.warn(`GET ${buildContentsUrl(repoFullName, path)} returned 404. This might be an empty repository or directory. Returning empty list.`);
			return [];
		}
		throw error;
	}
};

export const getFileContent = (
	token: string,
	repoFullName: string,
	path: string,
): Promise<FileContent> => {
	return apiFetch(buildContentsUrl(repoFullName, path), token);
};

export const updateFile = async (
	token: string,
	repoFullName: string,
	path: string,
	content: string,
	sha?: string,
): Promise<{ content: RepoContentNode }> => {
	const body: { message: string; content: string; sha?: string } = {
		message: `docs: update ${path}`,
		content: btoa(unescape(encodeURIComponent(content))),
	};
	if (sha) {
		body.sha = sha;
	}

	return apiFetch(buildContentsUrl(repoFullName, path), token, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
};

export const createFile = async (
	token: string,
	repoFullName: string,
	path: string,
	content: string,
): Promise<{ content: RepoContentNode }> => {
	const body = {
		message: `feat: create ${path}`,
		content: btoa(unescape(encodeURIComponent(content))),
	};

	return apiFetch(buildContentsUrl(repoFullName, path), token, {
		method: 'PUT',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
};

export const deleteFile = async (
	token: string,
	repoFullName: string,
	path: string,
	sha: string,
): Promise<void> => {
	const body = {
		message: `feat: delete ${path}`,
		sha,
	};
	await apiFetch(buildContentsUrl(repoFullName, path), token, {
		method: 'DELETE',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	});
};

export const getRepoDetails = (
    token: string,
    repoFullName: string,
): Promise<Repository> => {
    return apiFetch(`/repos/${repoFullName}`, token);
};

export const getRepoTreeRecursive = async (
	token: string,
	repoFullName: string,
	branch: string,
): Promise<{ path: string; type: string }[]> => {
	const commits = await apiFetch(`/repos/${repoFullName}/commits?sha=${branch}&per_page=1`, token);
	if (!commits || commits.length === 0) return [];
	
	const treeSha = commits[0].commit.tree.sha;
	const treeData = await apiFetch(`/repos/${repoFullName}/git/trees/${treeSha}?recursive=1`, token);
	
	return treeData.tree || [];
};