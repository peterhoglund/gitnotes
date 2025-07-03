
import React from 'react';

// Using Font Awesome icons - using fa-solid (free) instead of fa-light (pro).
// Using inline styles for size and fa-fw for fixed-width.
const faStyle = { width: '22px', height: '22px', textAlign: 'center', fontSize: '18px', paddingTop: "0.1em" } as const;

export const BoldIcon = () => <i className="fa-solid fa-bold fa-fw" style={faStyle} aria-hidden="true"></i>;
export const ItalicIcon = () => <i className="fa-solid fa-italic fa-fw" style={faStyle} aria-hidden="true"></i>;
export const UnderlineIcon = () => <i className="fa-solid fa-underline fa-fw" style={faStyle} aria-hidden="true"></i>;
export const StrikethroughIcon = () => <i className="fa-solid fa-strikethrough fa-fw" style={faStyle} aria-hidden="true"></i>;
export const CodeIcon = () => <i className="fa-solid fa-code fa-fw" style={faStyle} aria-hidden="true"></i>;
export const ListIcon = () => <i className="fa-solid fa-list-ul fa-fw" style={faStyle} aria-hidden="true"></i>;
export const ListOrderedIcon = () => <i className="fa-solid fa-list-ol fa-fw" style={faStyle} aria-hidden="true"></i>;
export const EllipsisVerticalIcon = () => <i className="fa-solid fa-ellipsis-vertical fa-fw" style={faStyle} aria-hidden="true"></i>;
export const TextColorIcon = () => <i className="fa-solid fa-font fa-fw" style={faStyle} aria-hidden="true"></i>;
export const HighlighterIcon = () => <i className="fa-solid fa-highlighter fa-fw" style={faStyle} aria-hidden="true"></i>;
export const SunIcon = () => <i className="fa-solid fa-sun fa-fw" style={faStyle} aria-hidden="true"></i>;
export const MoonIcon = () => <i className="fa-solid fa-moon fa-fw" style={faStyle} aria-hidden="true"></i>;

// Profile & GitHub icons
export const ProfileIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        style={{ width: '16px', height: '16px' }} 
        aria-hidden="true"
    >
        <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);
export const GitHubIcon = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="22" 
        height="22" 
        viewBox="0 0 24 24" 
        fill="currentColor"
    >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
);
export const LogOutIcon = () => <i className="fa-solid fa-right-from-bracket fa-fw" style={{...faStyle, fontSize: '16px'}} aria-hidden="true"></i>;
export const RefreshCwIcon = ({ className = '' }) => <i className={`fa-solid fa-rotate fa-fw ${className}`} style={{...faStyle, fontSize: '16px'}} aria-hidden="true"></i>;
export const BookIcon = () => <i className="fa-solid fa-book fa-fw" style={{...faStyle, fontSize: '16px', width: 'auto'}} aria-hidden="true"></i>;
export const PlusIcon = () => <i className="fa-solid fa-plus fa-fw" style={{...faStyle, fontSize: '16px'}} aria-hidden="true"></i>;
export const LockIcon = () => <i className="fa-solid fa-lock fa-fw" style={{...faStyle, fontSize: '14px', width: 'auto', color: 'inherit'}} aria-hidden="true"></i>;


export const BlockBackgroundColorIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="2" width="20" height="20" rx="4" fill="currentColor" fillOpacity="0.5" />
    <text x="12" y="17" fontFamily="sans-serif" fontSize="12" fontWeight="bold" fill="currentColor" textAnchor="middle">
      Ab
    </text>
  </svg>
);


// For consistency, SVGs are also made slightly larger.
export const AlignLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="15" x2="3" y1="12" y2="12"></line><line x1="17" x2="3" y1="18" y2="18"></line></svg>;
export const AlignCenterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="17" x2="7" y1="12" y2="12"></line><line x1="19" x2="5" y1="18" y2="18"></line></svg>;
export const AlignRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" x2="3" y1="6" y2="6"></line><line x1="21" x2="9" y1="12" y2="12"></line><line x1="21" x2="7" y1="18" y2="18"></line></svg>;
export const AlignJustifyIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
export const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"></path></svg>;

// --- Side Panel & File Tree Icons ---
export const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"></path></svg>;

export const SidebarCloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <polyline points="16 16 12 12 16 8"></polyline>
    </svg>
);
export const SidebarOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="9" y1="3" x2="9" y2="21"></line>
        <polyline points="13 8 17 12 13 16"></polyline>
    </svg>
);

const fileTreeIconStyle = { width: '16px', height: '16px' } as const;
export const FolderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={fileTreeIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>;
export const FolderOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={fileTreeIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"></path></svg>;
export const FileIcon = () => <svg xmlns="http://www.w3.org/2000/svg" style={fileTreeIconStyle} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>;
