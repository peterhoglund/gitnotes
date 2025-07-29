
import React from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { RefreshCwIcon, GitHubIcon, LockIcon } from './icons';

const LoginPrompt: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const { login, isLoading, error } = useGitHub();

    return (
        <div className={`flex flex-col text-sm text-center text-gray-800 dark:text-gray-200 overflow-hidden ${isOpen ? 'p-4' : 'p-2'}`}>
            <div className={`transition-all duration-300 overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <h2 className="font-semibold text-base mb-2 whitespace-nowrap">Welcome to Plita</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Save, load, and manage your documents with GitHub.
                </p>
            </div>
            <button
                onClick={login}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 px-2 py-2 rounded-md font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-500 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? <RefreshCwIcon className="animate-spin" /> : <GitHubIcon />}
                <span className={`whitespace-nowrap transition-opacity duration-100 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>Connect with GitHub</span>
            </button>
        </div>
    );
};

export default LoginPrompt;