import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Editor, BubbleMenu } from '@tiptap/react';
import { SmileyIcon } from '../icons';
import { EMOJIS } from '../../utils/constants';

interface BlockEmojiMenuProps {
  editor: Editor;
}

const BlockEmojiMenu: React.FC<BlockEmojiMenuProps> = ({ editor }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const shouldShowMenu = useCallback(() => {
    const nodeTypes = ['paragraph', 'heading', 'listItem'];
    for (const type of nodeTypes) {
      if (editor.isActive(type)) {
        const hasBgColor = !!editor.getAttributes(type).backgroundColor;
        return hasBgColor;
      }
    }
    return false;
  }, [editor]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectEmoji = (emoji: string) => {
    const nodeTypes = ['paragraph', 'heading', 'listItem'];
    const chain = editor.chain().focus();
     nodeTypes.forEach(type => {
      if (editor.isActive(type)) {
        chain.updateAttributes(type, { emoji: emoji });
      }
    });
    chain.run();
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
      shouldShow={shouldShowMenu}
      className="relative"
    >
      <div ref={menuRef}>
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
              {EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  title={emoji}
                  onClick={() => selectEmoji(emoji)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
                >
                  {emoji}
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
    </BubbleMenu>
  );
};

export default BlockEmojiMenu;