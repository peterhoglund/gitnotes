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
  deviceAuthInfo: { user_code: string; verification_uri: string } | null;
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
  const [authPolling, setAuthPolling] = useState<{ deviceCode: string; interval: number } | null>(null);
  const [deviceAuthInfo, setDeviceAuthInfo] = useState<GitHubState['deviceAuthInfo']>(null);

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
    const savedToken = localStorage.getItem('gh_token');
    if (savedToken) {
      setToken(savedToken);
      init(savedToken);
    } else {
      setIsLoading(false);
    }
  }, [init]);

  const login = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { device_code, interval, user_code, verification_uri } = await gh.getDeviceCode();
      setDeviceAuthInfo({ user_code, verification_uri });
      setAuthPolling({ deviceCode: device_code, interval });
    } catch (e: any) {
      console.error("GitHub sign-in failed:", e);
      const friendlyError = new Error(
          "Sign-in failed. This could be due to a network issue or browser security restrictions (CORS). This authentication method may not be suitable for a web application."
      );
      setError(friendlyError);
      alert(friendlyError.message);
      setAuthPolling(null);
      setIsLoading(false);
      setDeviceAuthInfo(null);
    }
  }, []);

  useEffect(() => {
    if (!authPolling) {
        setDeviceAuthInfo(null);
        return;
    };
    
    const poller = setInterval(async () => {
      try {
        const { access_token } = await gh.pollForToken(authPolling.deviceCode);
        setAuthPolling(null);
        setToken(access_token);
        localStorage.setItem('gh_token', access_token);
        await init(access_token);
      } catch (e: any) {
        if (e.message !== 'authorization_pending') {
          console.error('Polling error', e);
          setError(e);
          setAuthPolling(null);
        }
      }
    }, (authPolling.interval + 1) * 1000);

    return () => clearInterval(poller);
  }, [authPolling, init]);

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
    isLoading: isLoading || !!authPolling,
    isSaving,
    error,
    deviceAuthInfo,
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