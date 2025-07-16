
import React, { useState, useRef, useEffect } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { EMOJIS, TRANSPARENT } from '../../utils/constants';
import { SmileyIcon } from '../icons';

const BlockNodeView = ({ node, updateAttributes }) => {
    const { backgroundColor, emoji } = node.attrs;
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const hasBg = backgroundColor && backgroundColor !== TRANSPARENT;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectEmoji = (newEmoji: string) => {
        updateAttributes({ emoji: newEmoji });
        setIsOpen(false);
    };

    const getTagName = (): 'p' | 'h1' | 'h2' | 'h3' | 'h6' => {
        if (node.type.name === 'heading') {
            // As configured in useTiptapEditor, only levels 1, 2, 3, 6 are used.
            return `h${node.attrs.level}` as 'h1' | 'h2' | 'h3' | 'h6';
        }
        return 'p';
    };

    const wrapperClass = `relative group ${hasBg ? 'custom-bg-block' : ''} ${emoji ? 'has-emoji' : ''}`;
    
    // Pass the background color via style attribute, as Tiptap's renderHTML handles it for static output.
    const wrapperStyle = hasBg ? { backgroundColor } : {};

    return (
        <NodeViewWrapper
            as={getTagName()}
            className={wrapperClass}
            style={wrapperStyle}
            data-emoji={emoji || undefined}
        >
            <NodeViewContent as={'span' as any} />
            {hasBg && (
                <div
                    ref={menuRef}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200"
                    contentEditable={false}
                >
                    <button
                        type="button"
                        className="p-1.5 rounded-md bg-gray-200 text-gray-700 dark:bg-zinc-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-zinc-600"
                        onClick={() => setIsOpen(o => !o)}
                    >
                        <SmileyIcon />
                    </button>

                    {isOpen && (
                        <div className="dropdown-panel absolute z-10 mt-1 w-60 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800 right-0">
                            <div className="flex flex-wrap justify-center gap-1.5">
                                {EMOJIS.map(em => (
                                    <button
                                        key={em}
                                        title={em}
                                        onClick={() => selectEmoji(em)}
                                        className="flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
                                    >
                                        {em}
                                    </button>
                                ))}
                            </div>
                            <div className="color-picker-divider my-2 border-t dark:border-zinc-700"></div>
                            <button
                                onClick={() => selectEmoji('')}
                                className="color-picker-no-color-button w-full rounded px-4 py-2 text-center text-sm"
                            >
                                Remove Emoji
                            </button>
                        </div>
                    )}
                </div>
            )}
        </NodeViewWrapper>
    );
};

export default BlockNodeView;
