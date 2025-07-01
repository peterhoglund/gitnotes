import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useGitHub } from '../hooks/useGitHub';
import { ProfileIcon, SunIcon, MoonIcon, GitHubIcon } from './icons';

interface ProfileMenuProps {
  isSidePanelOpen: boolean;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isSidePanelOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, login, logout, isLoading } = useGitHub();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  const userName = user?.name || user?.login || 'Guest';
  const userHandle = user?.login ? `@${user.login}` : 'Not logged in';

  return (
    <div className="relative" ref={menuRef}>
       {isOpen && (
        <div className="dropdown-panel absolute bottom-full left-0 mb-2 z-20 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-2">
          {user && (
            <div className="flex items-center p-2 mb-2 border-b border-gray-100 dark:border-zinc-700">
               <img src={user.avatar_url} alt="GitHub Avatar" className="w-10 h-10 rounded-full" />
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userHandle}</p>
                </div>
            </div>
          )}
          
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Appearance</div>
          <button
            onClick={() => handleAction(toggleTheme)}
            className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
          
          <div className="border-t border-gray-100 dark:border-zinc-700 my-2"></div>

          {user ? (
            <button
                onClick={() => handleAction(logout)}
                className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
            >
                Log Out
            </button>
          ) : (
            <button
                onClick={() => handleAction(login)}
                disabled={isLoading}
                className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3 justify-center"
            >
                <GitHubIcon />
                <span>Sign in with GitHub</span>
            </button>
          )}
        </div>
      )}
      <button
        title="Profile and settings"
        onClick={() => setIsOpen(!isOpen)}
        className={`profile-button w-full flex items-center p-2 rounded-md text-left ${isSidePanelOpen ? '' : 'justify-center'}`}
      >
        <div className="flex-shrink-0">
          {user ? (
            <img src={user.avatar_url} alt="GitHub Avatar" className="w-6 h-6 rounded-full" />
          ) : (
            <div className="w-6 h-6 flex items-center justify-center">
              <ProfileIcon />
            </div>
          )}
        </div>
        {isSidePanelOpen && (
            <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{userName}</p>
            </div>
        )}
      </button>
    </div>
  );
};

export default ProfileMenu;