
import { useContext } from 'react';
import { GitHubContext } from '../context/GitHubContext';

export const useGitHub = () => {
  const context = useContext(GitHubContext);
  if (context === undefined) {
    throw new Error('useGitHub must be used within a GitHubProvider');
  }
  return context;
};
