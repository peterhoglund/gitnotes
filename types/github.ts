

export interface GitHubUser {
  name: string;
  email: string;
  avatar_url: string;
  login: string;
}

export interface Repository {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  owner: {
    login: string;
  };
  html_url: string;
  description: string | null;
  updated_at: string;
  default_branch: string;
}

// Represents a file or directory in the file tree.
export interface RepoContentNode {
  name: string;
  path: string;
  sha: string;
  type: 'file' | 'dir';
  // Properties for interactive tree
  children?: RepoContentNode[];
  isOpen?: boolean;
  isLoading?: boolean;
}

// Represents the response when fetching a single file's content.
export interface FileContent extends RepoContentNode {
  content: string; // Base64 encoded string
  encoding: 'base64';
}
