


import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { PenToSquareIcon, UnlinkIcon, ExternalLinkIcon, FileIcon, CopyIcon, CheckIcon, XMarkIcon } from '../icons';
import { useTiptapEditor } from './useTiptapEditor';
import { useGitHub } from '../../hooks/useGitHub';

interface LinkMenuProps {
  editor: NonNullable<ReturnType<typeof useTiptapEditor>>;
}

const LinkMenu: React.FC<LinkMenuProps> = ({ editor }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { allFilesForSearch, loadFile } = useGitHub();
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Update local URL state when link becomes active or selection changes
  useEffect(() => {
    if (editor.isActive('link')) {
      const existingUrl = editor.getAttributes('link').href;
      setUrl(existingUrl);
      // Automatically enter edit mode for new, empty links
      if (!existingUrl) {
        setIsEditing(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [editor.state.selection, editor]); // Depend on selection to re-evaluate

  const filteredFiles = useMemo(() => {
    if (!url || url.startsWith('http') || url.startsWith('//') || url.startsWith('#') || url.startsWith('mailto:')) {
      return [];
    }
    const lowerCaseUrl = url.toLowerCase();
    return allFilesForSearch.filter(file => 
      file.path.toLowerCase().includes(lowerCaseUrl)
    ).slice(0, 10);
  }, [allFilesForSearch, url]);

  const handleApply = useCallback(() => {
    const trimmedUrl = url.trim();
    if (trimmedUrl) {
      (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: trimmedUrl }).run();
    } else {
      (editor.chain().focus() as any).unsetLink().run();
    }
    setIsEditing(false);
    setShowSuggestions(false);
  }, [editor, url]);
  
  const handleUnlink = useCallback(() => {
    (editor.chain().focus() as any).unsetLink().run();
  }, [editor]);
  
  const handleOpenLink = useCallback(() => {
    if (!url) return;
    const isExternal = /^(https?:\/\/|mailto:|tel:)/.test(url);
    if (isExternal) {
        window.open(url, '_blank', 'noopener,noreferrer');
    } else {
        loadFile(url);
    }
  }, [url, loadFile]);

  const handleCopyLink = useCallback(() => {
    if (url) {
      navigator.clipboard.writeText(url);
    }
  }, [url]);

  const setLinkFromFile = useCallback((path: string) => {
    (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: path }).run();
    setUrl(path);
    setIsEditing(false);
    setShowSuggestions(false);
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        if (isEditing) {
          // If editing and clicking outside, apply the changes.
          handleApply();
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isEditing, handleApply]);
  
  const ViewMode = () => (
    <div className="p-2 flex items-center gap-1">
        <span className="text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-zinc-700 rounded-md px-3 py-1.5 truncate max-w-xs">
            {url}
        </span>
        <button onClick={() => setIsEditing(true)} title="Edit link" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"><PenToSquareIcon /></button>
        <button onClick={handleCopyLink} title="Copy link address" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"><CopyIcon /></button>
        <button onClick={handleOpenLink} title="Open link" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"><ExternalLinkIcon /></button>
        <button onClick={handleUnlink} title="Remove link" className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"><UnlinkIcon /></button>
    </div>
  );

  const EditMode = () => (
    <div className="flex flex-col w-96">
        <div className="p-2 flex items-center gap-2">
            <input 
                ref={inputRef}
                type="url" 
                value={url}
                onChange={(e) => { setUrl(e.target.value); if (!showSuggestions) setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleApply(); }
                    if (e.key === 'Escape') { e.preventDefault(); setIsEditing(false); }
                }}
                placeholder="Enter URL or search pages"
                className="bg-gray-100 dark:bg-zinc-700 text-sm text-gray-900 dark:text-gray-100 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleApply} title="Apply changes" className="p-1.5 rounded text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/50"><CheckIcon /></button>
            <button onClick={() => setIsEditing(false)} title="Cancel" className="p-1.5 rounded text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/50"><XMarkIcon /></button>
        </div>
        
        {showSuggestions && filteredFiles.length > 0 && (
            <div className="max-h-60 overflow-y-auto border-t border-gray-200 dark:border-zinc-700">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Link to a page
                </div>
                <ul>
                    {filteredFiles.map(file => (
                        <li key={file.path}>
                            <button 
                                onClick={() => setLinkFromFile(file.path)}
                                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                            >
                                <FileIcon />
                                <span className="truncate">{file.path}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            </div>
        )}
      </div>
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyProps={{
        duration: 100,
        placement: 'bottom',
        offset: [0, 8],
        interactive: true,
        appendTo: () => document.body,
        onHidden: () => {
          setIsEditing(false);
          setShowSuggestions(false);
        },
      }}
      shouldShow={({ editor }) => editor.isActive('link')}
    >
      <div 
        ref={menuRef}
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 flex"
      >
        {isEditing ? <EditMode /> : <ViewMode />}
      </div>
    </BubbleMenu>
  );
};

export default LinkMenu;