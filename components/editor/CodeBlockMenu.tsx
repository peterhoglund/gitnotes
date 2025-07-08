import React, { useState, useRef, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { LANGUAGES } from '../../utils/constants';
import { ChevronDownIcon } from '../icons';

interface CodeBlockMenuProps {
  editor: any;
}

const CodeBlockMenu: React.FC<CodeBlockMenuProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  
  const currentLang = editor.getAttributes('codeBlock').language || 'text';
  const currentLabel = LANGUAGES.find(l => l.value === currentLang)?.label ?? 'Text';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && listRef.current) {
        const activeItem = listRef.current.querySelector<HTMLButtonElement>('.dropdown-item.active');
        if (activeItem) {
            // Use a timeout to allow the DOM to update before scrolling
            setTimeout(() => {
                 activeItem.scrollIntoView({
                    block: 'start',
                });
            }, 0);
        }
    }
  }, [isOpen, currentLang]);

  const selectLanguage = (lang: string) => {
    editor.chain().focus().updateAttributes('codeBlock', { language: lang }).run();
    setIsOpen(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'top-end',
        offset: [0, 8],
      }}
      shouldShow={({ editor }) => editor.isActive('codeBlock')}
      className="relative"
    >
      <div ref={menuRef}>
        <button
          type="button"
          className="flex items-center gap-2 px-2 py-1 rounded-md bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-200 text-sm hover:bg-gray-300 dark:hover:bg-zinc-600"
          onClick={() => setIsOpen(o => !o)}
        >
          <span>{currentLabel}</span>
          <ChevronDownIcon />
        </button>

        {isOpen && (
          <div className="dropdown-panel absolute z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 right-0">
            <ul ref={listRef} className="max-h-60 overflow-y-auto py-1">
              {LANGUAGES.map(lang => (
                <li key={lang.value}>
                  <button
                    type="button"
                    onClick={() => selectLanguage(lang.value)}
                    className={`dropdown-item block w-full px-4 py-2 text-left text-sm ${
                      lang.value === currentLang ? 'active' : ''
                    }`}
                  >
                    {lang.label}
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

export default CodeBlockMenu;