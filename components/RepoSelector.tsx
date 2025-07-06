
import React, { useState, useMemo } from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { BookIcon, LockIcon, PlusIcon, RefreshCwIcon } from './icons';

const DEFAULT_REPO_NAME = 'plita-docs';

const RepoSelector: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const { repositories, selectRepo, createAndSelectRepo, isLoading, error: contextError } = useGitHub();
    const [searchTerm, setSearchTerm] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const filteredRepos = useMemo(() => {
        return repositories.filter(repo => 
            repo.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [repositories, searchTerm]);

    const defaultRepoExists = useMemo(() => {
        return repositories.some(repo => repo.name === DEFAULT_REPO_NAME);
    }, [repositories]);

    const handleCreateRepo = async () => {
        setIsCreating(true);
        setLocalError(null);
        try {
            if (defaultRepoExists) {
                const repo = repositories.find(r => r.name === DEFAULT_REPO_NAME);
                if(repo) selectRepo(repo);
            } else {
                await createAndSelectRepo(DEFAULT_REPO_NAME);
            }
        } catch(err: any) {
            setLocalError(err.message);
        } finally {
            setIsCreating(false);
        }
    }

    if (isLoading && repositories.length === 0) {
        return (
            <div className="flex justify-center items-center h-full p-4">
                <RefreshCwIcon className="animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full text-sm text-gray-800 dark:text-gray-200 overflow-hidden">
            <div className={`p-2 border-b border-gray-200 dark:border-zinc-800 transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <h2 className="font-semibold text-center mb-2 whitespace-nowrap">Select Repository</h2>
                <input
                    type="text"
                    placeholder="Filter repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-2 py-1.5 bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="p-2">
                <button
                    onClick={handleCreateRepo}
                    disabled={isCreating}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed transition-colors"
                    title={defaultRepoExists ? `Select your existing '${DEFAULT_REPO_NAME}' repository.` : `Create and use a new private repository named '${DEFAULT_REPO_NAME}'.`}
                >
                    {isCreating ? <RefreshCwIcon className="animate-spin" /> : <PlusIcon />}
                    <span className={`whitespace-nowrap transition-opacity duration-100 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
                        {defaultRepoExists ? 'Use Default Repo' : 'Create Default Repo'}
                    </span>
                </button>
                {(localError || contextError) && <p className="text-xs text-red-500 mt-2 text-center">{localError || contextError}</p>}
            </div>

            <div className="flex-grow overflow-y-auto px-2">
                {filteredRepos.map(repo => (
                    <div
                        key={repo.id}
                        onClick={() => selectRepo(repo)}
                        className={`flex items-center p-2 my-0.5 rounded-md cursor-pointer hover:bg-gray-200 dark:hover:bg-zinc-700 ${isOpen ? 'gap-3' : ''} ${!isOpen && 'justify-center'}`}
                        title={repo.full_name}
                    >
                        <BookIcon />
                        <span className={`truncate flex-1 whitespace-nowrap transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>{repo.name}</span>
                        <div className={`transition-all duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                            {repo.private && <LockIcon />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RepoSelector;