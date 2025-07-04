
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Repository, GitHubUser, RepoContentNode, FileContent } from '../types/github';
import * as api from '../services/github';
import { INITIAL_CONTENT } from '../utils/constants';

declare const netlify: any;

// Helper to recursively find and update a node in the tree, and keep it sorted
const updateNodeInTree = (nodes: RepoContentNode[], path: string, updates: Partial<RepoContentNode>): RepoContentNode[] => {
    return nodes.map(node => {
        if (node.path === path) {
            return { ...node, ...updates };
        }
        if (node.children && path.startsWith(node.path + '/')) {
            return { ...node, children: updateNodeInTree(node.children, path, updates) };
        }
        return node;
    }).sort((a,b) => { // Keep folders on top
        if (a.type === 'dir' && b.type !== 'dir') return -1;
        if (a.type !== 'dir' && b.type === 'dir') return 1;
        return a.name.localeCompare(b.name);
    });
};

const removeNodeFromTree = (nodes: RepoContentNode[], path: string): RepoContentNode[] => {
    return nodes.filter(node => node.path !== path).map(node => {
        if (node.children) {
            return { ...node, children: removeNodeFromTree(node.children, path) };
        }
        return node;
    });
};

interface GitHubContextType {
    token: string | null;
    user: GitHubUser | null;
    repositories: Repository[];
    selectedRepo: Repository | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    tokenScopes: string[];
    fileTree: RepoContentNode[];
    activeFile: { path: string; content: string; sha: string; } | null;
    initialContent: string;
    
    login: () => void;
    logout: () => void;
    switchAccount: () => void;
    connectRepoAccess: () => void;
    selectRepo: (repo: Repository) => void;
    clearRepoSelection: () => void;
    createAndSelectRepo: (repoName: string) => Promise<void>;
    loadFile: (path: string) => Promise<void>;
    saveFile: (content: string) => Promise<void>;
    toggleFolder: (path: string) => Promise<void>;
    createFile: (path: string, content?: string) => Promise<void>;
    createFolder: (path: string) => Promise<void>;
    deleteNode: (node: RepoContentNode) => Promise<void>;
}

export const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('gh_token'));
    const [tokenScopes, setTokenScopes] = useState<string[]>([]);
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
    const [fileTree, setFileTree] = useState<RepoContentNode[]>([]);
    const [activeFile, setActiveFile] = useState<{path: string, content: string, sha: string} | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const clearState = useCallback((fullLogout = true) => {
        if (fullLogout) {
            localStorage.removeItem('gh_token');
            setToken(null);
            setUser(null);
        }
        localStorage.removeItem('gh_repo');
        setRepositories([]);
        setSelectedRepo(null);
        setFileTree([]);
        setActiveFile(null);
        setTokenScopes([]);
        setError(null);
    }, []);
    
    const performAuth = useCallback((scope: string, callback: (err: Error | null, data: { token: string } | null) => void) => {
        setError(null);
        setIsLoading(true);
        if (typeof netlify === 'undefined') {
            setError('Authentication provider is not available.');
            setIsLoading(false);
            return;
        }
        const authenticator = new netlify.default({});
        authenticator.authenticate({ provider: 'github', scope }, (err, data) => {
            setIsLoading(false);
            callback(err, data);
        });
    }, []);

    const login = useCallback(() => {
        performAuth('read:user user:email', (err, data) => {
            if (err) {
                setError(`GitHub auth failed: ${err.message}`);
                clearState();
            } else if (data) {
                localStorage.setItem('gh_token', data.token);
                setToken(data.token);
            }
        });
    }, [performAuth, clearState]);

    const connectRepoAccess = useCallback(() => {
        performAuth('repo', (err, data) => {
            if (err) {
                setError(`GitHub repo access failed: ${err.message}`);
            } else if (data) {
                localStorage.setItem('gh_token', data.token);
                setToken(data.token); 
            }
        });
    }, [performAuth]);

    const fetchUserDataAndRepos = useCallback(async (authToken: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const [profile, emails, scopes] = await Promise.all([
                api.getUserProfile(authToken),
                api.getUserEmails(authToken),
                api.getTokenScopes(authToken),
            ]);
            
            const primaryEmail = emails.find(e => e.primary)?.email;
            setUser({ ...profile, email: primaryEmail || `${profile.login}@users.noreply.github.com` });
            setTokenScopes(scopes);

            if (scopes.includes('repo')) {
                const repos = await api.getUserRepos(authToken);
                setRepositories(repos);
            } else {
                 setRepositories([]);
                 setSelectedRepo(null);
                 localStorage.removeItem('gh_repo');
            }
        } catch (err: any) {
            setError(err.message);
            if (err.message.includes('token is invalid')) {
                 clearState();
            }
        } finally {
            setIsLoading(false);
        }
    }, [clearState]);
    
    useEffect(() => {
        if (token) {
            fetchUserDataAndRepos(token);
        } else {
            clearState();
        }
    }, [token, fetchUserDataAndRepos, clearState]);

    const fetchFileTree = useCallback(async (repo: Repository) => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const contents = await api.getRepoContents(token, repo.full_name, '');
            const filteredContents = contents.filter(item => !item.name.startsWith('.'));
            setFileTree(updateNodeInTree(filteredContents, '', {})); // Initial sort and filter
            setActiveFile(null);
        } catch (err: any) {
            setError(err.message);
            setFileTree([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (selectedRepo && token && tokenScopes.includes('repo')) {
            fetchFileTree(selectedRepo);
        }
    }, [selectedRepo, token, tokenScopes, fetchFileTree]);
    
    const selectRepo = useCallback((repo: Repository) => {
        setSelectedRepo(repo);
        localStorage.setItem('gh_repo', JSON.stringify(repo));
        setActiveFile(null);
        setFileTree([]);
    }, []);

    const clearRepoSelection = useCallback(() => {
        localStorage.removeItem('gh_repo');
        setSelectedRepo(null);
        setFileTree([]);
        setActiveFile(null);
    }, []);

    const logout = useCallback(() => {
        clearState();
    }, [clearState]);

    const switchAccount = useCallback(() => {
        const ghLogout = window.open('https://github.com/logout', '_blank', 'width=300,height=200');
        let timeout: ReturnType<typeof setTimeout> | null = null;
        
        const checkWindow = () => {
            if (ghLogout?.closed) {
                if (timeout) clearTimeout(timeout);
                clearState();
                setTimeout(login, 100);
            } else {
                requestAnimationFrame(checkWindow);
            }
        };

        timeout = setTimeout(() => {
            if (ghLogout && !ghLogout.closed) {
                ghLogout.close();
                clearState();
                setTimeout(login, 100);
            }
        }, 30000);

        checkWindow();
    }, [clearState, login]);

    const createAndSelectRepo = useCallback(async (repoName: string) => {
        if (!token) throw new Error("Not logged in");
        setIsLoading(true);
        setError(null);
        try {
            const newRepo = await api.createRepo(token, repoName);
            setRepositories(prev => [newRepo, ...prev].sort((a,b) => b.updated_at.localeCompare(a.updated_at)));
            selectRepo(newRepo);
        } catch(err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [token, selectRepo]);

    const loadFile = useCallback(async (path: string) => {
        if (!token || !selectedRepo) return;
        setIsLoading(true);
        setError(null);
        try {
            const fileData = await api.getFileContent(token, selectedRepo.full_name, path);
            const content = fileData.encoding === 'base64' ? decodeURIComponent(escape(atob(fileData.content))) : fileData.content;
            setActiveFile({ path, content, sha: fileData.sha });
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedRepo]);

    const saveFile = useCallback(async (content: string) => {
        if (!token || !selectedRepo || !activeFile) return;
        setIsSaving(true);
        setError(null);
        try {
            const response = await api.updateFile(
                token, 
                selectedRepo.full_name, 
                activeFile.path, 
                content, 
                activeFile.sha
            );
            setActiveFile(prev => prev ? { ...prev, content, sha: response.content.sha } : null);
        } catch(err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, activeFile]);

    const toggleFolder = useCallback(async (path: string) => {
        if (!token || !selectedRepo) return;
        
        let nodeToToggle: RepoContentNode | null = null;
        const findNode = (nodes: RepoContentNode[]): RepoContentNode | null => {
            for (const node of nodes) {
                if (node.path === path) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        nodeToToggle = findNode(fileTree);
        
        if (nodeToToggle?.isOpen) {
            setFileTree(currentTree => updateNodeInTree(currentTree, path, { isOpen: false }));
            return;
        }

        if (nodeToToggle?.children) {
            setFileTree(currentTree => updateNodeInTree(currentTree, path, { isOpen: true }));
            return;
        }
        
        if (nodeToToggle && !nodeToToggle.children) {
             setFileTree(currentTree => updateNodeInTree(currentTree, path, { isLoading: true, isOpen: true }));
            try {
                const contents = await api.getRepoContents(token, selectedRepo.full_name, path);
                const filteredContents = contents.filter(item => !item.name.startsWith('.'));
                setFileTree(currentTree => updateNodeInTree(currentTree, path, { children: filteredContents, isLoading: false }));
            } catch (err: any) {
                setError(err.message);
                setFileTree(currentTree => updateNodeInTree(currentTree, path, { isLoading: false, isOpen: false }));
            }
        }
    }, [token, selectedRepo, fileTree]);

    const refreshPath = useCallback(async (path: string) => {
        if (!token || !selectedRepo) return;
        
        const parentPath = path.includes('/') ? path.substring(0, path.lastIndexOf('/')) : '';
        try {
            const contents = await api.getRepoContents(token, selectedRepo.full_name, parentPath);
            const filteredContents = contents.filter(item => !item.name.startsWith('.'));
            if (parentPath === '') {
                setFileTree(updateNodeInTree(filteredContents, '', {}));
            } else {
                setFileTree(currentTree => updateNodeInTree(currentTree, parentPath, { children: filteredContents, isLoading: false, isOpen: true }));
            }
        } catch (err: any) {
            setError(err.message);
        }
    }, [token, selectedRepo]);

    const createFile = useCallback(async (path: string, content = '<!-- New file -->') => {
        if (!token || !selectedRepo) return;
        setIsSaving(true);
        setError(null);
        try {
            await api.createFile(token, selectedRepo.full_name, path, content);
            await refreshPath(path);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, refreshPath]);

    const createFolder = useCallback(async (path: string) => {
        if (!token || !selectedRepo) return;
        const gitkeepPath = `${path}/.gitkeep`;
        setIsSaving(true);
        setError(null);
        try {
            await api.createFile(token, selectedRepo.full_name, gitkeepPath, '');
            await refreshPath(path);
        } catch(err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, refreshPath]);

    const deleteNode = useCallback(async (node: RepoContentNode) => {
        if (!token || !selectedRepo) return;
        setIsSaving(true);
        setError(null);

        try {
            if (node.type === 'dir') {
                const itemsToDelete: { path: string; sha: string }[] = [];
                const collectItems = async (path: string) => {
                    // Important: Do not filter dotfiles here, as we need to delete them.
                    const contents = await api.getRepoContents(token, selectedRepo.full_name, path);
                    for (const item of contents) {
                        if (item.type === 'dir') {
                            await collectItems(item.path);
                        } else {
                            itemsToDelete.push({ path: item.path, sha: item.sha });
                        }
                    }
                };
                await collectItems(node.path);
                
                for (const item of itemsToDelete.reverse()) { // Delete from deepest first
                    await api.deleteFile(token, selectedRepo.full_name, item.path, item.sha);
                }
            } else { // file
                await api.deleteFile(token, selectedRepo.full_name, node.path, node.sha);
            }

            if (activeFile?.path.startsWith(node.path)) {
                setActiveFile(null);
            }
            
            await refreshPath(node.path);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, activeFile, refreshPath]);

    const value = {
        token, user, repositories, selectedRepo, isLoading, isSaving, error, tokenScopes, fileTree, activeFile, initialContent: INITIAL_CONTENT,
        login, logout, switchAccount, connectRepoAccess, selectRepo, clearRepoSelection, createAndSelectRepo,
        loadFile, saveFile, toggleFolder, createFile, createFolder, deleteNode
    };

    return (
        <GitHubContext.Provider value={value}>
            {children}
        </GitHubContext.Provider>
    );
};
