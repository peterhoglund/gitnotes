
import React from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { RefreshCwIcon, GitHubIcon, LockIcon } from './icons';

const ConnectRepo: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const { connectRepoAccess, isLoading, error } = useGitHub();

    return (
        <div className="flex flex-col h-full p-4 text-sm text-center text-gray-800 dark:text-gray-200 overflow-hidden">
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <h2 className="font-semibold text-base mb-2 whitespace-nowrap">Connect a Repository</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    To save and load documents, the editor needs permission to access your repositories.
                </p>
            </div>
            <button
                onClick={connectRepoAccess}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? <RefreshCwIcon className="animate-spin" /> : <GitHubIcon />}
                <span className={`whitespace-nowrap transition-opacity duration-100 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Connect with GitHub</span>
            </button>
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1.5 whitespace-nowrap">
                    <LockIcon /> You'll be asked to grant repository access.
                </p>
                {error && <p className="text-xs text-red-500 mt-2 text-center">{error}</p>}
            </div>
        </div>
    );
};

export default ConnectRepo;