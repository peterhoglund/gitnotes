
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Repository, GitHubUser, RepoContentNode, FileContent } from '../types/github';
import * as api from '../services/github';
import { INITIAL_CONTENT } from '../utils/constants';

declare const netlify: any;

// DEV_NOTE: Set this to `false` for deployment.
// When true, the app uses dummy data for local development without GitHub auth.
const DUMMY_MODE = false;

// --- DUMMY MODE PROVIDER ---
const dummyFileTreeData: RepoContentNode[] = ([
    {
        name: 'documentation', path: 'documentation', sha: 'dir-doc-sha', type: 'dir', isOpen: true,
        children: [
            { name: 'getting-started.md', path: 'documentation/getting-started.md', sha: 'file-gs-sha', type: 'file' },
            { name: 'advanced-features.mdx', path: 'documentation/advanced-features.mdx', sha: 'file-af-sha', type: 'file' },
        ]
    },
    {
        name: 'assets', path: 'assets', sha: 'dir-assets-sha', type: 'dir', isOpen: false,
        children: [
            { name: 'logo.svg', path: 'assets/logo.svg', sha: 'file-logo-sha', type: 'file' },
            { name: 'user-avatar.png', path: 'assets/user-avatar.png', sha: 'file-avatar-sha', type: 'file' },
        ]
    },
    {
        name: 'empty-folder', path: 'empty-folder', sha: 'dir-empty-sha', type: 'dir', isOpen: false,
        children: []
    },
    { name: 'README.md', path: 'README.md', sha: 'file-readme-sha', type: 'file' },
    { name: 'package.json', path: 'package.json', sha: 'file-pkg-sha', type: 'file' },
] as RepoContentNode[]).sort((a,b) => (a.type === 'dir' && b.type !== 'dir') ? -1 : (a.type !== 'dir' && b.type === 'dir') ? 1 : a.name.localeCompare(b.name));

const removeNodeFromTreeHelper = (nodes: RepoContentNode[], path: string): { newNodes: RepoContentNode[], foundNode: RepoContentNode | null } => {
    let foundNode: RepoContentNode | null = null;

    // First, try to find and remove the node at the current level.
    const remainingNodes = nodes.filter(node => {
        if (node.path === path) {
            foundNode = node;
            return false;
        }
        return true;
    });

    // If we found the node at the top level, we can return early.
    if (foundNode) {
        return { newNodes: remainingNodes, foundNode };
    }

    // If not found, recurse into the children of the remaining nodes.
    const newNodes = remainingNodes.map(node => {
        if (node.children && !foundNode) { // Check !foundNode to avoid unnecessary recursion after finding the node
            const result = removeNodeFromTreeHelper(node.children, path);
            if (result.foundNode) {
                foundNode = result.foundNode;
                return { ...node, children: result.newNodes };
            }
        }
        return node;
    });

    return { newNodes, foundNode };
};


const DummyGitHubProvider = ({ children }) => {
    const [isDirty, setIsDirty] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [fileTree, setFileTree] = useState<RepoContentNode[]>(dummyFileTreeData);
    const [activeFile, setActiveFile] = useState<{ path: string; content: string; sha: string; } | null>({
        path: 'documentation/getting-started.md',
        content: '# Getting Started\n\nThis is a dummy file. You can edit the content and save your changes.',
        sha: 'file-gs-sha',
    });

    const toggleFolder = useCallback(async (path: string) => {
        const update = (nodes: RepoContentNode[]): RepoContentNode[] => {
            return nodes.map(node => {
                if (node.path === path) return { ...node, isOpen: !node.isOpen };
                if (node.children && path.startsWith(node.path + '/')) {
                    return { ...node, children: update(node.children) };
                }
                return node;
            });
        };
        setFileTree(prev => update(prev));
    }, []);

    const loadFile = useCallback(async (path: string) => {
        console.log('DUMMY: loadFile', path);
        if (isDirty && !window.confirm("You have unsaved changes. Are you sure you want to discard them?")) return;
        setActiveFile({ path, content: `# Dummy Content: ${path}`, sha: `dummy-sha-for-${path}`});
        setIsDirty(false);
    }, [isDirty]);

    const saveFile = useCallback(async (content: string) => {
        if (!activeFile) return;
        console.log('DUMMY: saveFile', activeFile.path);
        setIsSaving(true);
        await new Promise(res => setTimeout(res, 500)); // Simulate network delay
        setActiveFile(prev => prev ? { ...prev, content } : null);
        setIsDirty(false);
        setIsSaving(false);
    }, [activeFile]);

    const deleteNode = useCallback(async (node: RepoContentNode) => {
        console.log('DUMMY: deleteNode', node.path);
        setFileTree(currentTree => removeNodeFromTree(currentTree, node.path));
        if (activeFile?.path.startsWith(node.path)) {
            setActiveFile(null);
        }
    }, [activeFile]);

    const moveNode = useCallback(async (nodeToMove, targetFolderPath) => {
        console.log('DUMMY: moveNode', nodeToMove.path, 'to', targetFolderPath);

        const updatePaths = (node, newParentPath) => {
            const newPath = newParentPath ? `${newParentPath}/${node.name}` : node.name;
            const updatedNode = { ...node, path: newPath };
            if (updatedNode.children) {
                updatedNode.children = updatedNode.children.map(child => updatePaths(child, newPath));
            }
            return updatedNode;
        };

        const addNodeToTree = (nodes, path, nodeToAdd) => {
            if (path === '') { // Root
                const newNodes = [...nodes, nodeToAdd];
                return newNodes.sort((a,b) => (a.type === 'dir' && b.type !== 'dir') ? -1 : (a.type !== 'dir' && b.type === 'dir') ? 1 : a.name.localeCompare(b.name));
            }
            return nodes.map(node => {
                if (node.path === path) {
                    const newChildren = node.children ? [...node.children, nodeToAdd] : [nodeToAdd];
                    return { ...node, isOpen: true, children: newChildren.sort((a,b) => (a.type === 'dir' && b.type !== 'dir') ? -1 : (a.type !== 'dir' && b.type === 'dir') ? 1 : a.name.localeCompare(b.name)) };
                }
                if (node.children && path.startsWith(node.path + '/')) {
                    return { ...node, children: addNodeToTree(node.children, path, nodeToAdd) };
                }
                return node;
            });
        };
        
        setFileTree(currentTree => {
            const { newNodes, foundNode } = removeNodeFromTreeHelper(currentTree, nodeToMove.path);
            if (!foundNode) return currentTree;

            const updatedNode = updatePaths(foundNode, targetFolderPath);
            const finalTree = addNodeToTree(newNodes, targetFolderPath, updatedNode);
            
            return finalTree;
        });

        // Update active file if it was moved
        if (activeFile && activeFile.path.startsWith(nodeToMove.path)) {
            const oldPath = nodeToMove.path;
            const newPath = targetFolderPath ? `${targetFolderPath}/${nodeToMove.name}` : nodeToMove.name;
            const newActiveFilePath = activeFile.path.replace(oldPath, newPath);
            setActiveFile(af => af ? { ...af, path: newActiveFilePath } : null);
        }

    }, [activeFile]);
    
    const value = {
        token: 'dummy-token',
        user: { name: 'Dummy User', email: 'dummy@example.com', avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4', login: 'dummy-user' },
        repositories: [],
        selectedRepo: { id: 1, full_name: 'dummy/plita-docs', name: 'plita-docs', private: true, owner: { login: 'dummy' }, html_url: '', description: '', updated_at: '' },
        isLoading: false, isSaving, error: null, tokenScopes: ['repo', 'read:user'],
        fileTree, allFilesForSearch: [], activeFile, initialContent: INITIAL_CONTENT,
        isDirty, setIsDirty,
        login: () => alert('Dummy Login'),
        logout: () => alert('Dummy Logout'),
        switchAccount: () => alert('Dummy Switch Account'),
        connectRepoAccess: () => alert('Dummy Connect Repo Access'),
        selectRepo: (repo) => console.log('DUMMY: selectRepo', repo),
        clearRepoSelection: () => console.log('DUMMY: clearRepoSelection'),
        createAndSelectRepo: async (repoName) => console.log('DUMMY: createAndSelectRepo', repoName),
        loadFile, saveFile, toggleFolder, deleteNode, moveNode,
        createFile: async (path, content) => console.log('DUMMY: createFile', path, content),
        createFolder: async (path) => console.log('DUMMY: createFolder', path),
        renameNode: async (node, newName) => console.log(`DUMMY: renameNode ${node.path} to ${newName}`),
    };

    return <GitHubContext.Provider value={value}>{children}</GitHubContext.Provider>;
}


// --- ORIGINAL PROVIDER ---

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

// Helper to recursively update the path of a node and all its descendants.
const recursivelyUpdateNodePaths = (node: RepoContentNode, oldPath: string, newPath: string): RepoContentNode => {
    let currentPath = node.path;
    if (currentPath === oldPath) {
        currentPath = newPath;
    } else if (currentPath.startsWith(oldPath + '/')) {
        currentPath = newPath + currentPath.substring(oldPath.length);
    }
    
    const updatedNode: RepoContentNode = {
        ...node,
        path: currentPath,
        name: currentPath.split('/').pop() || currentPath,
    };
    
    if (updatedNode.children) {
        updatedNode.children = updatedNode.children.map(child => recursivelyUpdateNodePaths(child, oldPath, newPath));
    }
    
    return updatedNode;
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
    allFilesForSearch: { path: string, name: string }[];
    activeFile: { path: string; content: string; sha: string; } | null;
    initialContent: string;
    isDirty: boolean;
    setIsDirty: React.Dispatch<React.SetStateAction<boolean>>;
    
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
    moveNode: (nodeToMove: RepoContentNode, targetFolderPath: string) => Promise<void>;
    renameNode: (nodeToRename: RepoContentNode, newName: string) => Promise<void>;
}

export const GitHubContext = createContext<GitHubContextType | undefined>(undefined);

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // --- START DUMMY MODE ---
    if (DUMMY_MODE) {
        return <DummyGitHubProvider>{children}</DummyGitHubProvider>;
    }
    // --- END DUMMY MODE ---

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
    const [allFilesForSearch, setAllFilesForSearch] = useState<{ path: string; name: string }[]>([]);
    const [activeFile, setActiveFile] = useState<{path: string, content: string, sha: string} | null>(null);

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [isDirty, setIsDirty] = useState<boolean>(false);
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
        setAllFilesForSearch([]);
        setActiveFile(null);
        setTokenScopes([]);
        setError(null);
        setIsDirty(false);
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
            setIsDirty(false);
        } catch (err: any) {
            setError(err.message);
            setFileTree([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const fetchAllFiles = useCallback(async (repo: Repository) => {
        if (!token) return;
        try {
            const repoDetails = await api.getRepoDetails(token, repo.full_name);
            const defaultBranch = repoDetails.default_branch;
            if (!defaultBranch) {
                console.warn("Could not determine default branch for repo:", repo.full_name);
                return;
            }

            const tree = await api.getRepoTreeRecursive(token, repo.full_name, defaultBranch);
            const files = tree
                .filter(item => item.type === 'blob' && !item.path.split('/').some(part => part.startsWith('.')))
                .map(item => ({
                    path: item.path,
                    name: item.path.split('/').pop() || item.path
                }));
            setAllFilesForSearch(files);
        } catch (err) {
            console.error("Failed to fetch all files for search:", err);
            setAllFilesForSearch([]);
        }
    }, [token]);

    useEffect(() => {
        if (selectedRepo && token && tokenScopes.includes('repo')) {
            fetchFileTree(selectedRepo);
            fetchAllFiles(selectedRepo);
        } else {
            setAllFilesForSearch([]);
        }
    }, [selectedRepo, token, tokenScopes, fetchFileTree, fetchAllFiles]);
    
    const selectRepo = useCallback((repo: Repository) => {
        setSelectedRepo(repo);
        localStorage.setItem('gh_repo', JSON.stringify(repo));
        setActiveFile(null);
        setIsDirty(false);
        setFileTree([]);
        setAllFilesForSearch([]);
    }, []);

    const clearRepoSelection = useCallback(() => {
        localStorage.removeItem('gh_repo');
        setSelectedRepo(null);
        setFileTree([]);
        setActiveFile(null);
        setIsDirty(false);
        setAllFilesForSearch([]);
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
        if (isDirty) {
            if (!window.confirm("You have unsaved changes. Are you sure you want to discard them?")) {
                return;
            }
        }
        setIsLoading(true);
        setError(null);
        try {
            const fileData = await api.getFileContent(token, selectedRepo.full_name, path);
            const content = fileData.encoding === 'base64' ? decodeURIComponent(escape(atob(fileData.content))) : fileData.content;
            setActiveFile({ path, content, sha: fileData.sha });
            setIsDirty(false);
        } catch(err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedRepo, isDirty]);

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
            setIsDirty(false);
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
            const response = await api.createFile(token, selectedRepo.full_name, path, content);
            await refreshPath(path);
            setActiveFile({
                path: response.content.path,
                content: content,
                sha: response.content.sha
            });
            setIsDirty(false);
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
                setIsDirty(false);
            }
            
            await refreshPath(node.path);

        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, activeFile, refreshPath]);

    const _moveOrRenameNode = useCallback(async (sourceNode: RepoContentNode, newPath: string) => {
        if (!token || !selectedRepo) throw new Error("Not authenticated or no repo selected.");
    
        const sourcePath = sourceNode.path;
        if (sourcePath === newPath) return; // No change
    
        const getParent = (p: string) => p.includes('/') ? p.substring(0, p.lastIndexOf('/')) : '';
        const isRenameOnly = getParent(sourcePath) === getParent(newPath);
    
        const nodeName = newPath.split('/').pop() || newPath;
    
        setIsSaving(true);
        setError(null);
    
        try {
            // Check for collision
            const targetFolderPath = getParent(newPath);
            const destinationContents = await api.getRepoContents(token, selectedRepo.full_name, targetFolderPath);
            if (destinationContents.some(item => item.name === nodeName)) {
                throw new Error(`An item named "${nodeName}" already exists in the destination.`);
            }
    
            if (sourceNode.type === 'file') {
                const sourceFile = await api.getFileContent(token, selectedRepo.full_name, sourcePath);
                // Note: This reads from GitHub. If the file is dirty in the editor, changes will be lost.
                // A robust implementation would disable rename/move for dirty files or pass editor content.
                // For now, we prioritize a smooth UX for non-dirty files.
                const content = sourceFile.encoding === 'base64' ? decodeURIComponent(escape(atob(sourceFile.content))) : sourceFile.content;
                const createResponse = await api.createFile(token, selectedRepo.full_name, newPath, content);
                await api.deleteFile(token, selectedRepo.full_name, sourcePath, sourceFile.sha);
                
                if (activeFile?.path === sourcePath) {
                    // If the active file was renamed, update its state directly
                    // without a full reload, keeping the content in the editor intact.
                    setActiveFile({ path: newPath, content, sha: createResponse.content.sha });
                }
    
            } else { // 'dir'
                const filesToMove: { path: string; sha: string }[] = [];
                const emptyFoldersToCreate: string[] = [];
    
                const collectItems = async (currentPath: string) => {
                    const contents = await api.getRepoContents(token, selectedRepo.full_name, currentPath);
                    if (contents.length === 0 && currentPath !== sourcePath) {
                        emptyFoldersToCreate.push(currentPath);
                    }
                    for (const item of contents) {
                        if (item.type === 'file') {
                            filesToMove.push({ path: item.path, sha: item.sha });
                        } else if (item.type === 'dir') {
                            await collectItems(item.path);
                        }
                    }
                };
    
                await collectItems(sourcePath);
    
                // Create structure for empty sub-folders
                for (const emptyFolderPath of emptyFoldersToCreate) {
                    const relativePath = emptyFolderPath.substring(sourcePath.length);
                    const newDirPath = newPath + relativePath;
                    await api.createFile(token, selectedRepo.full_name, `${newDirPath}/.gitkeep`, '');
                }
    
                // Move each file individually
                for (const file of filesToMove) {
                    const relativePath = file.path.substring(sourcePath.length);
                    const newFilePath = newPath + relativePath;
                    const sourceFile = await api.getFileContent(token, selectedRepo.full_name, file.path);
                    const content = sourceFile.encoding === 'base64' ? decodeURIComponent(escape(atob(sourceFile.content))) : sourceFile.content;
                    
                    await api.createFile(token, selectedRepo.full_name, newFilePath, content);
                    await api.deleteFile(token, selectedRepo.full_name, file.path, file.sha);
                }
    
                // If the source folder itself was empty, create the new empty folder.
                if (filesToMove.length === 0 && emptyFoldersToCreate.length === 0) {
                    await api.createFile(token, selectedRepo.full_name, `${newPath}/.gitkeep`, '');
                    // And delete the old .gitkeep if it existed
                    try {
                        const oldGitkeep = await api.getFileContent(token, selectedRepo.full_name, `${sourcePath}/.gitkeep`);
                        await api.deleteFile(token, selectedRepo.full_name, oldGitkeep.path, oldGitkeep.sha);
                    } catch (e) { /* .gitkeep may not exist, ignore */ }
                }
    
                if (activeFile?.path.startsWith(sourcePath + '/')) {
                    const relativePath = activeFile.path.substring(sourcePath.length);
                    const newActiveFilePath = newPath + relativePath;
    
                    if (isRenameOnly) {
                        // Folder containing active file was renamed.
                        // Fetch the new SHA for the active file to keep state consistent,
                        // but don't do a full `loadFile` which would be disruptive.
                        const newFileData = await api.getFileContent(token, selectedRepo.full_name, newActiveFilePath);
                        setActiveFile(af => af ? { ...af, path: newActiveFilePath, sha: newFileData.sha } : null);
                    } else {
                        // It's a move, which is more complex. A reload is acceptable here.
                        await loadFile(newActiveFilePath);
                    }
                }
            }
    
            if (isRenameOnly) {
                // For renames, update the file tree in-place for a smooth experience.
                setFileTree(currentTree => {
                    const updateTree = (nodes: RepoContentNode[]): RepoContentNode[] => {
                        return nodes.map(node => {
                            if (node.path === sourcePath) {
                                return recursivelyUpdateNodePaths(node, sourcePath, newPath);
                            }
                            if (node.children && sourcePath.startsWith(node.path + '/')) {
                                return { ...node, children: updateTree(node.children) };
                            }
                            return node;
                        }).sort((a,b) => {
                            if (a.type === 'dir' && b.type !== 'dir') return -1;
                            if (a.type !== 'dir' && b.type === 'dir') return 1;
                            return a.name.localeCompare(b.name);
                        });
                    };
                    return updateTree(currentTree);
                });
            } else {
                // For moves, refresh the entire tree.
                await fetchFileTree(selectedRepo);
            }
    
        } catch (err: any) {
            setError(err.message);
            // Re-throw to be caught in the component for alerts
            throw err;
        } finally {
            setIsSaving(false);
        }
    }, [token, selectedRepo, activeFile, fetchFileTree, loadFile]);
    
    const moveNode = useCallback(async (nodeToMove: RepoContentNode, targetFolderPath: string) => {
        const sourcePath = nodeToMove.path;
        if (nodeToMove.type === 'dir' && (targetFolderPath === sourcePath || targetFolderPath.startsWith(sourcePath + '/'))) {
            throw new Error("Cannot move a folder into itself or a subfolder.");
        }
        
        const newPath = targetFolderPath ? `${targetFolderPath}/${nodeToMove.name}` : nodeToMove.name;
        await _moveOrRenameNode(nodeToMove, newPath);
    }, [_moveOrRenameNode]);

    const renameNode = useCallback(async (nodeToRename: RepoContentNode, newName: string) => {
        const parentPath = nodeToRename.path.includes('/') ? nodeToRename.path.substring(0, nodeToRename.path.lastIndexOf('/')) : '';
        const newPath = parentPath ? `${parentPath}/${newName}` : newName;
        await _moveOrRenameNode(nodeToRename, newPath);
    }, [_moveOrRenameNode]);

    const value = {
        token, user, repositories, selectedRepo, isLoading, isSaving, error, tokenScopes, fileTree, allFilesForSearch, activeFile, initialContent: INITIAL_CONTENT,
        isDirty, setIsDirty,
        login, logout, switchAccount, connectRepoAccess, selectRepo, clearRepoSelection, createAndSelectRepo,
        loadFile, saveFile, toggleFolder, createFile, createFolder, deleteNode, moveNode, renameNode,
    };

    return (
        <GitHubContext.Provider value={value}>
            {children}
        </GitHubContext.Provider>
    );
};
