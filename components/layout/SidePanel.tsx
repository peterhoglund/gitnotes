
import React, { useState } from 'react';
import ProfileMenu from '../ProfileMenu';
import { FileTree } from '../FileTree';
import RepoSelector from '../RepoSelector';
import { SidebarOpenIcon, SidebarCloseIcon } from '../icons';
import { useGitHub } from '../../hooks/useGitHub';

const SidePanel = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { user, selectedRepo } = useGitHub();

    const showFileTree = user && selectedRepo;
    const showRepoSelector = user && !selectedRepo;

    return (
        <aside className={`side-panel flex-shrink-0 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
            <header className="side-panel-header h-16 flex items-center px-4 flex-shrink-0">
                {isOpen && <span className="text-lg font-bold text-gray-800 dark:text-gray-200">Zen Editor</span>}
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 ml-auto"
                  aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
                </button>
            </header>

            <nav className="flex-grow overflow-y-auto overflow-x-hidden">
                {showRepoSelector && <RepoSelector isOpen={isOpen} />}
                {showFileTree && <FileTree isOpen={isOpen} repoName={selectedRepo.full_name} />}
            </nav>

            <footer className="side-panel-footer p-2 flex-shrink-0">
                <ProfileMenu isSidePanelOpen={isOpen} />
            </footer>
        </aside>
    );
}

export default SidePanel;
