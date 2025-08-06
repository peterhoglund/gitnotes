


import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useGitHub } from '../hooks/useGitHub';
import { ProfileIcon, SunIcon, MoonIcon, GitHubIcon, LogOutIcon, BookIcon, RefreshCwIcon, TextSizeIcon, PenNibIcon } from './icons';
import { useFontSize } from '../hooks/useFontSize';
import type { FontSize } from '../context/FontSizeContext';
import { useFontFamily } from '../hooks/useFontFamily';
import type { FontFamily } from '../context/FontFamilyContext';

interface ProfileMenuProps {
  isSidePanelOpen: boolean;
  onMouseEnter?: (e: React.MouseEvent) => void;
  onMouseLeave?: () => void;
}

const FontFamilyControl: React.FC = () => {
    const { fontFamily, setFontFamily } = useFontFamily();
    const families: { id: FontFamily; title: string; style: React.CSSProperties }[] = [
        { id: 'sans', title: 'Sans-Serif', style: { fontFamily: "'Inter', sans-serif" } },
        { id: 'serif', title: 'Serif', style: { fontFamily: "'Lora', serif" } },
    ];

    return (
        <div className="flex items-center p-0.5 rounded-md bg-gray-200 dark:bg-zinc-700">
            {families.map(family => (
                <button
                    key={family.id}
                    onClick={() => setFontFamily(family.id)}
                    title={family.title}
                    style={family.style}
                    className={`px-3 py-0 text-xl rounded transition-colors ${
                        fontFamily === family.id
                            ? 'bg-white dark:bg-zinc-600 text-gray-800 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    Ab
                </button>
            ))}
        </div>
    );
};

const TextSizeControl: React.FC = () => {
    const { fontSize, setFontSize } = useFontSize();
    const sizes: { id: FontSize, label: string, title: string }[] = [
        { id: 'sm', label: 'S', title: 'Small' },
        { id: 'md', label: 'M', title: 'Normal' },
        { id: 'lg', label: 'L', title: 'Large' },
    ];

    return (
        <div className="flex items-center p-0.5 rounded-md bg-gray-200 dark:bg-zinc-700">
            {sizes.map(size => (
                <button
                    key={size.id}
                    onClick={() => setFontSize(size.id)}
                    title={size.title}
                    className={`px-3 py-0.5 text-sm font-medium rounded transition-colors ${
                        fontSize === size.id
                            ? 'bg-white dark:bg-zinc-600 text-gray-800 dark:text-gray-100 shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                >
                    {size.label}
                </button>
            ))}
        </div>
    );
};


const ProfileMenu: React.FC<ProfileMenuProps> = ({ isSidePanelOpen, onMouseEnter, onMouseLeave }) => {
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
        <div className="dropdown-panel absolute bottom-full left-0 mb-2 z-30 w-64 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-2">
          {/* User Info / Login Button */}
          <div className="p-1 mb-1">
            {isLoggedIn ? (
              <div className="flex items-center p-2 border-b border-gray-100 dark:border-zinc-700 pb-3">
                <img src={user.avatar_url} alt={user.name || user.login} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700" />
                <div className="ml-3 flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate" title={user.name || user.login}>{user.name || user.login}</p>
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => handleAction(login)} className="dropdown-item w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3 justify-center bg-gray-50 dark:bg-zinc-800 font-semibold">
                  <GitHubIcon /> <span>Connect with GitHub</span>
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
          <div className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-center gap-3">
                <PenNibIcon />
                <span>Font Style</span>
            </div>
            <FontFamilyControl />
          </div>
          <div className="flex items-center justify-between px-2 py-1.5 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-center gap-3">
                <TextSizeIcon />
                <span>Text Size</span>
            </div>
            <TextSizeControl />
          </div>
          
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

      <button 
        title={isSidePanelOpen ? "Profile and settings" : ""}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="profile-button w-full flex items-center p-2 rounded-md text-left text-gray-600 dark:text-gray-300"
      >
        <div className="flex-shrink-0 h-4 flex items-center justify-center">
          {isLoggedIn && user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name || user.login} style={{ width: '24px', height: '24px' }} className="rounded-full" />
          ) : (
            <ProfileIcon />
          )}
        </div>
        <div className={`overflow-hidden whitespace-nowrap transition-all duration-200 ${isSidePanelOpen ? 'flex-1 ml-3 opacity-100' : 'w-0 ml-0 opacity-0'}`}>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">{isLoggedIn ? (user.name || user.login) : 'Guest'}</p>
        </div>
      </button>
    </div>
  );
};

export default ProfileMenu;