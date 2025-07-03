
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Repository, GitHubUser } from '../types/github';
import * as api from '../services/github';

declare const netlify: any;

interface GitHubContextType {
    token: string | null;
    user: GitHubUser | null;
    repositories: Repository[];
    selectedRepo: Repository | null;
    isLoading: boolean;
    error: string | null;
    login: () => void;
    logout: () => void;
    switchAccount: () => void;
    selectRepo: (repo: Repository) => void;
    clearRepoSelection: () => void;
    createAndSelectRepo: (repoName: string) => Promise<void>;
}

export const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('gh_token'));
    const [user, setUser] = useState<GitHubUser | null>(null);
    const [repositories, setRepositories] = useState<Repository[]>([]);
    const [selectedRepo, setSelectedRepo] = useState<Repository | null>(() => {
        try {
            const saved = localStorage.getItem('gh_repo');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const clearState = useCallback(() => {
        localStorage.removeItem('gh_token');
        localStorage.removeItem('gh_repo');
        setToken(null);
        setUser(null);
        setRepositories([]);
        setSelectedRepo(null);
        setError(null);
    }, []);
    
    useEffect(() => {
        if (token) {
            setIsLoading(true);
            setError(null);
            Promise.all([
                api.getUserProfile(token),
                api.getUserEmails(token),
                api.getUserRepos(token)
            ]).then(([profile, emails, repos]) => {
                const primaryEmail = emails.find(e => e.primary)?.email || emails[0]?.email || 'No public email';
                setUser({ ...profile, email: primaryEmail });
                setRepositories(repos);
            }).catch(err => {
                console.error(err);
                setError(err.message);
                if (err.message.includes('token is invalid')) {
                    clearState();
                }
            }).finally(() => {
                setIsLoading(false);
            });
        }
    }, [token, clearState]);

    useEffect(() => {
        if (selectedRepo) {
            localStorage.setItem('gh_repo', JSON.stringify(selectedRepo));
        } else {
            localStorage.removeItem('gh_repo');
        }
    }, [selectedRepo]);

    const login = useCallback(() => {
        setError(null);
        if (typeof netlify === 'undefined') {
            setError('Authentication provider is not available.');
            return;
        }
        const authenticator = new netlify.default({});
        authenticator.authenticate({ provider: 'github', scope: 'repo read:user user:email' }, (err: Error | null, data: { token: string } | null) => {
            if (err || !data) {
                setError('GitHub authentication failed: ' + (err?.message || 'Unknown error'));
                return;
            }
            localStorage.setItem('gh_token', data.token);
            setToken(data.token);
        });
    }, []);

    const logout = useCallback(() => {
        clearState();
    }, [clearState]);

    const switchAccount = useCallback(() => {
        logout();
        const logoutWindow = window.open('https://github.com/logout', '_blank', 'width=600,height=400');
        const timer = setInterval(() => {
            if (logoutWindow && logoutWindow.closed) {
                clearInterval(timer);
                login();
            }
        }, 500);
        setTimeout(() => { // Timeout fallback
            clearInterval(timer);
            if(logoutWindow && !logoutWindow.closed) login();
        }, 30000);
    }, [login, logout]);

    const selectRepo = (repo: Repository) => {
        setSelectedRepo(repo);
    };
    
    const clearRepoSelection = () => {
        setSelectedRepo(null);
    };

    const createAndSelectRepo = async (repoName: string) => {
        if (!token) {
            setError("Authentication token not found.");
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const newRepo = await api.createRepo(token, repoName);
            setSelectedRepo(newRepo);
            setRepositories(prev => [newRepo, ...prev]);
        } catch(err: any) {
            setError(err.message || "Failed to create repository.");
            throw err; // re-throw to be caught in component
        } finally {
            setIsLoading(false);
        }
    };

    const value: GitHubContextType = {
        token,
        user,
        repositories,
        selectedRepo,
        isLoading,
        error,
        login,
        logout,
        switchAccount,
        selectRepo,
        clearRepoSelection,
        createAndSelectRepo
    };

    return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
};
