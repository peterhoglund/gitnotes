
import React, { useState } from 'react';
import ProfileMenu from '../ProfileMenu';
import { FileTree } from '../FileTree';
import RepoSelector from '../RepoSelector';
import ConnectRepo from '../ConnectRepo';
import { SidebarOpenIcon, SidebarCloseIcon } from '../icons';
import Logo from '../Logo';
import { useGitHub } from '../../hooks/useGitHub';

const SidePanel = () => {
    const [isOpen, setIsOpen] = useState(true);
    const { user, selectedRepo, tokenScopes } = useGitHub();

    const hasRepoScope = tokenScopes.includes('repo');
    const showConnectRepo = user && !hasRepoScope;
    const showRepoSelector = user && hasRepoScope && !selectedRepo;
    const showFileTree = user && hasRepoScope && selectedRepo;

    const renderContent = () => {
        if (showConnectRepo) return <ConnectRepo isOpen={isOpen} />;
        if (showRepoSelector) return <RepoSelector isOpen={isOpen} />;
        if (showFileTree) return <FileTree isOpen={isOpen} />;
        return null;
    }

    return (
        <aside className={`side-panel flex-shrink-0 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
            <header className="side-panel-header h-16 flex items-center px-4 flex-shrink-0">
                <div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'opacity-100' : 'opacity-0 w-0'}`}>
                    <Logo className="w-[4.5rem] h-auto text-gray-700 dark:text-gray-300"/>
                </div>
                <button 
                  onClick={() => setIsOpen(!isOpen)} 
                  className="p-2 rounded-md hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300 ml-auto"
                  aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {isOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
                </button>
            </header>

            <nav className="flex-grow overflow-y-auto overflow-x-hidden">
                {renderContent()}
            </nav>

            <footer className="side-panel-footer p-2 flex-shrink-0">
                <ProfileMenu isSidePanelOpen={isOpen} />
            </footer>
        </aside>
    );
}

export default SidePanel;