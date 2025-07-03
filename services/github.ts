
import { Repository, GitHubUser } from '../types/github';

const GITHUB_API_BASE = 'https://api.github.com';

const apiFetch = async (url: string, token: string, options: RequestInit = {}) => {
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
    // For 422 (validation failed), e.g., repo exists
    if (response.status === 422 && errorData.errors) {
        throw new Error(errorData.errors[0].message);
    }
    throw new Error(errorData.message || `An unknown error occurred.`);
  }

  // Handle 204 No Content response for logout
  if (response.status === 204) {
    return null;
  }
  
  return response.json();
};

export const getUserRepos = (token: string): Promise<Repository[]> => {
    // Fetches repositories the user has push access to, sorted by most recently updated.
    return apiFetch('/user/repos?sort=pushed&per_page=100', token);
};

export const createRepo = (token: string, name: string): Promise<Repository> => {
    return apiFetch('/user/repos', token, {
        method: 'POST',
        headers: { // Explicitly set Content-Type for POST requests with a body.
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name,
            private: true,
            description: 'Documents created and managed by Zen Editor.',
            auto_init: true, // Creates with a README
        }),
    });
};

export const getUserProfile = (token: string): Promise<GitHubUser> => {
  return apiFetch('/user', token);
}

export const getUserEmails = (token: string): Promise<{email: string, primary: boolean}[]> => {
    return apiFetch('/user/emails', token);
}
