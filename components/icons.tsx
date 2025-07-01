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