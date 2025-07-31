

import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent, ReactNodeViewProps } from '@tiptap/react';
import { LANGUAGES } from '../../utils/constants';
import { ChevronDownIcon } from '../icons';

const CodeBlockComponent: React.FC<ReactNodeViewProps> = (props) => {
    const { node, updateAttributes } = props;
    const { language: currentLanguage } = (node as any).attrs;
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const currentLabel = LANGUAGES.find(l => l.value === currentLanguage)?.label ?? 'Text';

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
        if (isOpen) {
            // Use a timeout to ensure the DOM is ready for scrolling.
            setTimeout(() => {
                const listElement = listRef.current;
                if (!listElement) return;

                const activeButton = listElement.querySelector('.active') as HTMLButtonElement;
                if (activeButton && activeButton.parentElement) {
                    // Scroll the parent `li` into view.
                    activeButton.parentElement.scrollIntoView({ block: 'start' });
                }
            }, 0);
        }
    }, [isOpen]);

    const selectLanguage = (lang: string) => {
        updateAttributes({ language: lang });
        setIsOpen(false);
    };

    return (
        <NodeViewWrapper as="pre" className="relative group">
            <NodeViewContent as={'code' as any} />
            <div
                ref={menuRef}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                contentEditable={false}
            >
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
                        <ul
                            ref={listRef}
                            className="not-prose max-h-60 overflow-y-auto py-1"
                        >
                            {LANGUAGES.map(lang => (
                                <li key={lang.value}>
                                    <button
                                        type="button"
                                        onClick={() => selectLanguage(lang.value)}
                                        className={`dropdown-item block w-full px-4 py-2 text-left text-sm ${
                                            lang.value === currentLanguage ? 'active' : ''
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
        </NodeViewWrapper>
    );
};

export default CodeBlockComponent;