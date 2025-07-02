import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../hooks/useTheme';
import { ProfileIcon, SunIcon, MoonIcon, GitHubIcon } from './icons';

declare const netlify: any;

interface ProfileMenuProps {
  isSidePanelOpen: boolean;
}

interface GitHubUser {
  name: string;
  email: string;
  avatar_url: string;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ isSidePanelOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const menuRef = useRef<HTMLDivElement>(null);

  const [token, setToken] = useState<string | null>(localStorage.getItem('gh_token'));
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('gh_token');
    setToken(null);
    setUser(null);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    if (token) {
      const fetchUserData = async () => {
        try {
          const [userRes, emailsRes] = await Promise.all([
            fetch('https://api.github.com/user', { headers: { Authorization: `token ${token}` } }),
            fetch('https://api.github.com/user/emails', { headers: { Authorization: `token ${token}` } }),
          ]);

          if (userRes.status === 401) {
            handleLogout();
            return;
          }

          if (!userRes.ok || !emailsRes.ok) {
            throw new Error('Failed to fetch user data from GitHub.');
          }

          const userData = await userRes.json();
          const emailsData = await emailsRes.json();
          
          const primaryEmail = emailsData.find((e: any) => e.primary)?.email || emailsData[0]?.email || 'No public email';
          
          setUser({
            name: userData.name || userData.login,
            email: primaryEmail,
            avatar_url: userData.avatar_url,
          });
          setAuthError(null);
        } catch (error: any) {
          console.error("GitHub API Error:", error.message);
          setAuthError(error.message);
          handleLogout();
        }
      };
      fetchUserData();
    } else {
      setUser(null);
    }
  }, [token, handleLogout]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = () => {
    setAuthError(null);
    if (typeof netlify === 'undefined') {
        setAuthError('Authentication provider is not available.');
        return;
    }
    const authenticator = new netlify.default({});
    authenticator.authenticate(
      { provider: 'github', scope: 'read:user user:email' },
      (err: Error | null, data: { token: string } | null) => {
        setIsOpen(false);
        if (err || !data) {
          const errorMessage = 'GitHub authentication failed: ' + (err?.message || 'Unknown error');
          setAuthError(errorMessage);
          console.error(errorMessage);
          return;
        }
        localStorage.setItem('gh_token', data.token);
        setToken(data.token);
      }
    );
  };

  const handleThemeToggle = () => {
    toggleTheme();
    setIsOpen(false);
  };

  const isLoggedIn = !!user;

  return (
    <div className="relative" ref={menuRef}>
       {isOpen && (
        <div className="dropdown-panel absolute bottom-full left-0 mb-2 z-20 w-60 bg-white rounded-lg shadow-xl border border-gray-200 p-2">
          {isLoggedIn ? (
            <>
              <div className="flex items-center p-2 mb-2 border-b border-gray-100 dark:border-zinc-700">
                 <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-zinc-700" />
                 <div className="ml-3 flex-1 overflow-hidden">
                   <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate" title={user.name}>{user.name}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={user.email}>{user.email}</p>
                 </div>
              </div>
            </>
          ) : (
            <div className="p-1">
              <button
                onClick={handleLogin}
                className="dropdown-item w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3 justify-center bg-gray-50 dark:bg-zinc-800 font-semibold"
              >
                  <GitHubIcon />
                  <span>Login with GitHub</span>
              </button>
              {authError && <p className="text-xs text-red-500 mt-2 text-center px-1">{authError}</p>}
            </div>
          )}
          
          <div className="border-t border-gray-100 dark:border-zinc-700 my-1"></div>
          
          <div className="px-2 pt-1.5 pb-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Appearance</div>
          <button
            onClick={handleThemeToggle}
            className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
          >
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            <span>Switch to {theme === 'light' ? 'Dark' : 'Light'} Mode</span>
          </button>
          
          {isLoggedIn && (
            <>
              <div className="border-t border-gray-100 dark:border-zinc-700 my-2"></div>
              <button
                onClick={handleLogout}
                className="dropdown-item w-full text-left px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
              >
                Log Out
              </button>
            </>
          )}
        </div>
      )}
      <button
        title="Profile and settings"
        onClick={() => setIsOpen(!isOpen)}
        className={`profile-button w-full flex items-center p-2 rounded-md text-left ${isSidePanelOpen ? '' : 'justify-center'}`}
      >
        <div className="flex-shrink-0">
          {isLoggedIn && user.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} style={{ width: '16px', height: '16px' }} className="rounded-full" />
          ) : (
            <ProfileIcon />
          )}
        </div>
        {isSidePanelOpen && (
            <div className="ml-3 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{isLoggedIn ? user.name : 'Guest'}</p>
            </div>
        )}
      </button>
    </div>
  );
};

export default ProfileMenu;