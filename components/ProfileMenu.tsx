import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ProfileIcon, SunIcon, MoonIcon } from './icons';

interface ProfileMenuProps {
  isSidePanelOpen: boolean;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isSidePanelOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Mock login state
  const { theme, toggleTheme } = useTheme();
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

  const handleLoginToggle = () => {
    setIsLoggedIn(prev => !prev);
    setIsOpen(false); // Close menu after action
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setIsOpen(false); // Close menu after action
  };

  return (
    <div className="relative" ref={menuRef}>
       {isOpen && (
        <div className="dropdown-panel absolute bottom-full left-0 mb-2 z-20 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-2">
          <div className="flex items-center p-2 mb-2 border-b border-gray-100 dark:border-zinc-700">
             <div className="p-1.5 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300">
                <ProfileIcon />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{isLoggedIn ? 'Jane Doe' : 'Guest'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{isLoggedIn ? 'jane.doe@example.com' : 'Not logged in'}</p>
              </div>
          </div>
          <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Appearance</div>
          <button
            onClick={handleThemeToggle}
            className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
          
          <div className="border-t border-gray-100 dark:border-zinc-700 my-2"></div>

          <button
            onClick={handleLoginToggle}
            className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            {isLoggedIn ? 'Log Out' : 'Log In'}
          </button>
        </div>
      )}
      <button
        title="Profile and settings"
        onClick={() => setIsOpen(!isOpen)}
        className={`profile-button w-full flex items-center p-2 rounded-md text-left ${isSidePanelOpen ? '' : 'justify-center'}`}
      >
        <div className="flex-shrink-0">
          <ProfileIcon />
        </div>
        {isSidePanelOpen && (
            <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{isLoggedIn ? 'Jane Doe' : 'Guest'}</p>
            </div>
        )}
      </button>
    </div>
  );
};

export default ProfileMenu;