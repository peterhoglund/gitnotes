



import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { FileIcon, UnlinkIcon } from '../icons';
import { useTiptapEditor } from './useTiptapEditor';
import { useGitHub } from '../../hooks/useGitHub';

interface LinkMenuProps {
  editor: NonNullable<ReturnType<typeof useTiptapEditor>>;
}

const LinkMenu: React.FC<LinkMenuProps> = ({ editor }) => {
  const [url, setUrl] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { allFilesForSearch } = useGitHub();
  const menuRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  const filteredFiles = useMemo(() => {
    // Don't show suggestions for what looks like an external URL or an anchor
    if (!url || url.startsWith('http') || url.startsWith('//') || url.startsWith('#') || url.startsWith('mailto:')) {
      return [];
    }
    const lowerCaseUrl = url.toLowerCase();
    // Return up to 10 suggestions
    return allFilesForSearch.filter(file => 
      file.path.toLowerCase().includes(lowerCaseUrl)
    ).slice(0, 10);
  }, [allFilesForSearch, url]);

  const updateLink = useCallback(() => {
    const previousUrl = editor.getAttributes('link').href;
    const newUrl = url.trim();

    if (newUrl === previousUrl) {
        return; // No change
    }
    
    const chain = editor.chain().focus().extendMarkRange('link') as any;

    if (newUrl) {
      chain.setLink({ href: newUrl }).run();
    } else {
      chain.unsetLink().run();
    }
  }, [editor, url]);
  
  const setLinkFromFile = useCallback((path: string) => {
    setUrl(path);
    (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: path }).run();
    setShowSuggestions(false);
  }, [editor]);
  
  const clearLink = useCallback(() => {
    (editor.chain().focus() as any).unsetLink().run();
  }, [editor]);

  // Update local URL state when link becomes active or selection changes
  useEffect(() => {
    if (editor.isActive('link')) {
      setUrl(editor.getAttributes('link').href);
      cancelRef.current = false;
    }
  }, [editor, editor.state.selection]);

  const onHide = () => {
    setShowSuggestions(false);
  };

  const handleInputBlur = () => {
    if (cancelRef.current) {
        cancelRef.current = false;
        return;
    }
    updateLink();
  };

  // Handle clicks outside the menu to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor, state }) => editor.isActive('link') && !state.selection.empty}
      tippyOptions={{
        placement: 'bottom',
        offset: [0, 8],
        zIndex: 40,
      }}
      onHide={onHide}
    >
      <div 
        ref={menuRef}
        className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 flex flex-col w-96"
      >
        <div className="p-2 flex items-center gap-2">
            <input 
                type="url" 
                value={url}
                onBlur={handleInputBlur}
                onChange={(e) => {
                    setUrl(e.target.value);
                    if (!showSuggestions) {
                        setShowSuggestions(true);
                    }
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        updateLink();
                        (e.target as HTMLInputElement).blur();
                    }
                    if(e.key === 'Escape') {
                        e.preventDefault();
                        cancelRef.current = true;
                        setUrl(editor.getAttributes('link').href);
                        (e.target as HTMLInputElement).blur();
                    }
                }}
                placeholder="Enter URL or search pages"
                className="bg-gray-100 dark:bg-zinc-700 text-sm text-gray-900 dark:text-gray-100 rounded-md px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
                onClick={clearLink}
                title="Clear link"
                className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
                <UnlinkIcon />
            </button>
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
                                onMouseDown={(e) => e.preventDefault()}
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
    </BubbleMenu>
  );
};

export default LinkMenu;