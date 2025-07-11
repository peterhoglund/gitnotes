import React, { useState, useEffect, useCallback } from 'react';
import { BubbleMenu } from '@tiptap/react';
import { PenToSquareIcon, UnlinkIcon, ExternalLinkIcon } from '../icons';

interface LinkMenuProps {
  editor: any;
}

const LinkMenu: React.FC<LinkMenuProps> = ({ editor }) => {
  const [url, setUrl] = useState('');

  const handleUpdate = useCallback(() => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    }
  }, [editor, url]);
  
  const handleUnlink = useCallback(() => {
      editor.chain().focus().unsetLink().run();
  }, [editor]);

  const handleOpenLink = useCallback(() => {
    if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url]);

  useEffect(() => {
    if (editor.isActive('link')) {
      setUrl(editor.getAttributes('link').href);
    }
  }, [editor.state]);

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 100,
        placement: 'bottom',
        offset: [0, 8],
      }}
      shouldShow={({ editor }) => editor.isActive('link')}
      className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 flex items-center gap-2"
    >
        <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleUpdate();
                }
            }}
            placeholder="Enter URL"
            className="bg-gray-100 dark:bg-zinc-700 text-sm text-gray-900 dark:text-gray-100 rounded-md px-2 py-1 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
            onClick={handleOpenLink}
            title="Open link in new tab"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"
        >
            <ExternalLinkIcon />
        </button>
        <button
            onClick={handleUpdate}
            title="Update link"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"
        >
            <PenToSquareIcon />
        </button>
        <button
            onClick={handleUnlink}
            title="Remove link"
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 text-gray-700 dark:text-gray-200"
        >
            <UnlinkIcon />
        </button>
    </BubbleMenu>
  );
};

export default LinkMenu;