
import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useGitHub } from '../hooks/useGitHub';
import { ProfileIcon, SunIcon, MoonIcon, GitHubIcon, LogOutIcon, BookIcon, RefreshCwIcon } from './icons';

interface ProfileMenuProps {
  isSidePanelOpen: boolean;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isSidePanelOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { 
    user, 
    error, 
    isLoading,
    selectedRepo,
    login, 
    logout, 
    switchAccount,
    clearRepoSelection,
  } = useGitHub();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const isLoggedIn = !!user;

  return (
    <div className="relative" ref={menuRef}>
      {isOpen && (
        <div className="dropdown-panel absolute bottom-full left-0 mb-2 z-20 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-2">
          {/* User Info / Login Button */}
          <div className="p-1 mb-1">
            {isLoggedIn ? (
              <div className="flex items-center p-2 border-b border-gray-100 dark:border-zinc-700 pb-3">
                <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700" />
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={user.name}>{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => handleAction(login)} className="dropdown-item w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3 justify-center bg-gray-50 dark:bg-zinc-800 font-semibold">
                  <GitHubIcon /> <span>Login with GitHub</span>
                </button>
                {(error && !isLoading) && <p className="text-xs text-red-500 mt-2 text-center px-1">{error}</p>}
                {isLoading && <div className="flex justify-center mt-2"><RefreshCwIcon className="animate-spin" /></div>}
              </>
            )}
          </div>
          
          {isLoggedIn && selectedRepo && (
             <>
                <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Repository</div>
                 <div className="px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-3">
                    <BookIcon />
                    <span className="truncate font-medium" title={selectedRepo.full_name}>{selectedRepo.name}</span>
                </div>
                <button onClick={() => handleAction(clearRepoSelection)} className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md">
                    Switch Repository
                </button>
             </>
          )}

          {/* Appearance Section */}
          <div className="border-t border-gray-100 dark:border-zinc-700 my-1"></div>
          <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Appearance</div>
          <button onClick={() => handleAction(toggleTheme)} className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />} <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
          
          {/* Account Actions */}
          {isLoggedIn && (
            <>
              <div className="border-t border-gray-100 dark:border-zinc-700 my-1"></div>
              <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Account</div>
              <button onClick={() => handleAction(switchAccount)} className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md">Switch GitHub Account</button>
              <button onClick={() => handleAction(logout)} className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md flex items-center gap-3">
                <LogOutIcon /> <span>Log Out</span>
              </button>
            </>
          )}
        </div>
      )}

      <button title="Profile and settings" onClick={() => setIsOpen(!isOpen)} className={`profile-button w-full flex items-center p-2 rounded-md text-left ${isSidePanelOpen ? '' : 'justify-center'}`}>
        <div className="flex-shrink-0">
          {isLoggedIn && user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} style={{ width: '16px', height: '16px' }} className="rounded-full" />
          ) : (
            <ProfileIcon />
          )}
        </div>
        {isSidePanelOpen && (
            <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{isLoggedIn ? user?.name : 'Guest'}</p>
            </div>
        )}
      </button>
    </div>
  );
};

export default ProfileMenu;
