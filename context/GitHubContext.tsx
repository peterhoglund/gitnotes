import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import * as gh from '../utils/github';
import { API_URL } from '../utils/github';

const REPO_NAME = 'web-docs';

type GitHubState = {
  token: string | null;
  user: gh.GitHubUser | null;
  tree: (gh.GitHubContent & { children?: gh.GitHubContent[] })[] | null;
  activeFile: {
    path: string;
    sha: string;
    url: string;
    isDirty: boolean;
  } | null;
  fileContent: string | null;
  isLoading: boolean;
  isSaving: boolean;
  error: Error | null;
  login: () => void;
  logout: () => void;
  loadFile: (file: gh.GitHubFile) => Promise<void>;
  saveFile: () => Promise<void>;
  setActiveFileContent: (content: string) => void;
  expandFolder: (path: string) => Promise<void>;
};

export const GitHubContext = createContext<GitHubState | undefined>(undefined);

export const GitHubProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<gh.GitHubUser | null>(null);
  const [tree, setTree] = useState<GitHubState['tree']>(null);
  const [activeFile, setActiveFile] = useState<GitHubState['activeFile']>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const clearState = useCallback(() => {
    setUser(null);
    setTree(null);
    setActiveFile(null);
    setFileContent(null);
    setIsLoading(false);
    setError(null);
    setIsSaving(false);
  }, []);

  const init = useCallback(async (authToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const ghUser = await gh.getUser(authToken);
      setUser(ghUser);

      const repo = await gh.getRepo(authToken, ghUser.login, REPO_NAME);
      if (!repo) {
        await gh.createRepo(authToken, REPO_NAME);
      }

      const contents = await gh.getContents(authToken, ghUser.login, REPO_NAME, '');
      setTree(contents.sort((a, b) => (a.type > b.type ? -1 : a.name < b.name ? -1 : 1)));
    } catch (e: any) {
      console.error('Initialization error:', e);
      setError(e);
      setToken(null);
      localStorage.removeItem('gh_token');
      clearState();
    } finally {
        setIsLoading(false);
    }
  }, [clearState]);

  useEffect(() => {
    const handleAuth = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const savedToken = localStorage.getItem('gh_token');
      
      if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        setIsLoading(true);
        try {
          const { token: accessToken } = await gh.exchangeCodeForToken(code);
          localStorage.setItem('gh_token', accessToken);
          setToken(accessToken);
          await init(accessToken);
        } catch(e: any) {
          console.error("Auth Error:", e);
          setError(e);
          setIsLoading(false);
        }
      } else if (savedToken) {
        setToken(savedToken);
        await init(savedToken);
      } else {
        setIsLoading(false);
      }
    };
    
    handleAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(() => {
    window.location.href = gh.getLoginUrl();
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    localStorage.removeItem('gh_token');
    clearState();
  }, [clearState]);

  const loadFile = useCallback(async (file: gh.GitHubFile) => {
    if (!token || !user) return;
    if (activeFile?.isDirty) {
        if (!window.confirm('You have unsaved changes that will be lost. Are you sure?')) {
            return;
        }
    }
    setIsLoading(true);
    try {
      const { content, sha } = await gh.loadFile(token, file.url);
      setFileContent(content);
      setActiveFile({ path: file.path, sha, url: file.url, isDirty: false });
    } catch (e: any) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  }, [token, user, activeFile]);

  const saveFile = useCallback(async () => {
    if ((!activeFile || !activeFile.isDirty) || fileContent === null) {
        return;
    }

    if (!token || !user) {
        login();
        return;
    }

    setIsSaving(true);
    try {
        const isNewFile = activeFile.path === 'Untitled';
        let path = activeFile.path;
        let sha = isNewFile ? undefined : activeFile.sha;

        if (isNewFile) {
            const newPath = prompt("Enter a file path for your new document:", "untitled.html");
            if (!newPath) {
                setIsSaving(false);
                return;
            }
            path = newPath;
        }

        const { sha: newSha } = await gh.saveFile(token, user.login, REPO_NAME, path, fileContent, sha);

        setActiveFile(prev => ({
            ...(prev!),
            path: path,
            sha: newSha,
            isDirty: false,
            url: `${API_URL}/repos/${user.login}/${REPO_NAME}/contents/${path}`,
        }));

        if (isNewFile) {
            await init(token);
        }
    } catch (e: any) {
        setError(e);
    } finally {
        setIsSaving(false);
    }
}, [token, user, activeFile, fileContent, login, init]);
  
  const setActiveFileContent = useCallback((content: string) => {
      setFileContent(content);
      if (activeFile) {
        if (!activeFile.isDirty) {
            setActiveFile(prev => prev ? {...prev, isDirty: true} : null);
        }
      } else {
        // Create a temporary "Untitled" file to track changes locally
        setActiveFile({
            path: 'Untitled',
            sha: '',
            url: '',
            isDirty: true
        });
      }
  }, [activeFile]);

  const expandFolder = useCallback(async (path: string) => {
    if (!token || !user || !tree) return;
    
    try {
        const contents = await gh.getContents(token, user.login, REPO_NAME, path);
        
        setTree(currentTree => {
            if (!currentTree) return null;
            
            const newTree = JSON.parse(JSON.stringify(currentTree)); // Deep copy to ensure re-render
            
            const findAndAddChildren = (nodes: (gh.GitHubContent & {children?: gh.GitHubContent[]})[]): boolean => {
                for (let i = 0; i < nodes.length; i++) {
                    if (nodes[i].path === path) {
                        nodes[i].children = contents.sort((a,b) => (a.type > b.type) ? -1 : (a.name < b.name) ? -1 : 1);
                        return true;
                    }
                    if (nodes[i].children && findAndAddChildren(nodes[i].children as any)) {
                        return true;
                    }
                }
                return false;
            }

            findAndAddChildren(newTree);
            return newTree;
        });

    } catch (e: any) {
        setError(e);
    }
  }, [token, user, tree]);


  const value: GitHubState = {
    token,
    user,
    tree,
    activeFile,
    fileContent,
    isLoading,
    isSaving,
    error,
    login,
    logout,
    loadFile,
    saveFile,
    setActiveFileContent,
    expandFolder,
  };

  return (
    <GitHubContext.Provider value={value}>
      {children}
    </GitHubContext.Provider>
  );
};