
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
}
