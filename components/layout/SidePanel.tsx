
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import ProfileMenu from '../ProfileMenu';
import { FileTree } from '../FileTree';
import RepoSelector from '../RepoSelector';
import ConnectRepo from '../ConnectRepo';
import { SidebarOpenIcon, SidebarCloseIcon } from '../icons';
import Logo from '../Logo';
import { useGitHub } from '../../hooks/useGitHub';
import LoginPrompt from '../LoginPrompt';

const SidePanel = () => {
    const [isOpen, setIsOpen] = useState(true);
    const [tooltip, setTooltip] = useState<{ text: string; top: number } | null>(null);
    const { user, selectedRepo, tokenScopes } = useGitHub();

    const handleMouseEnter = (e: React.MouseEvent, text: string) => {
        if (!isOpen) {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltip({ text, top: rect.top + rect.height / 2 });
        }
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const hasRepoScope = tokenScopes.includes('repo');
    const showLoginPrompt = !user;
    const showConnectRepo = user && !hasRepoScope;
    const showRepoSelector = user && hasRepoScope && !selectedRepo;
    const showFileTree = user && hasRepoScope && selectedRepo;

    const renderContent = () => {
        if (showLoginPrompt) return <LoginPrompt isOpen={isOpen} />;
        if (showConnectRepo) return <ConnectRepo isOpen={isOpen} />;
        if (showRepoSelector) return <RepoSelector isOpen={isOpen} />;
        if (showFileTree) return <FileTree isOpen={isOpen} onMouseEnterButton={handleMouseEnter} onMouseLeaveButton={handleMouseLeave} />;
        return null;
    }

    return (
        <>
            <aside className={`side-panel flex-shrink-0 flex flex-col transition-all duration-300 ${isOpen ? 'w-64' : 'w-14'}`}>
                <header className={`side-panel-header h-16 flex items-center flex-shrink-0 ${isOpen ? 'justify-between px-4' : 'justify-center'}`}>
                    <div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0'}`}>
                        <Logo className="w-[4.5rem] h-auto text-gray-700 dark:text-gray-300"/>
                    </div>
                    <button 
                      onClick={() => setIsOpen(!isOpen)} 
                      onMouseEnter={(e) => handleMouseEnter(e, isOpen ? 'Collapse sidebar' : 'Expand sidebar')}
                      onMouseLeave={handleMouseLeave}
                      className={`p-1 ${isOpen ? 'ml-auto' : 'm-auto'} rounded-md hover:bg-gray-300 dark:hover:bg-zinc-700 text-gray-600 dark:text-gray-300`}
                      aria-label={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                    >
                        {isOpen ? <SidebarCloseIcon /> : <SidebarOpenIcon />}
                    </button>
                </header>

                <nav className={`flex-grow overflow-y-auto overflow-x-hidden ${showLoginPrompt || showConnectRepo ? 'flex flex-col justify-center' : ''}`}>
                    {renderContent()}
                </nav>

                <footer className="side-panel-footer p-2 flex-shrink-0">
                    <ProfileMenu 
                        isSidePanelOpen={isOpen} 
                        onMouseEnter={(e) => handleMouseEnter(e, 'Profile and settings')}
                        onMouseLeave={handleMouseLeave}
                    />
                </footer>
            </aside>
            {tooltip && createPortal(
                <div
                    className="custom-tooltip"
                    style={{
                        top: `${tooltip.top}px`,
                        left: `56px`, // 56px (w-14) + 8px margin
                        transform: 'translateY(-50%)',
                    }}
                >
                    {tooltip.text}
                </div>,
                document.body
            )}
        </>
    );
}

export default SidePanel;