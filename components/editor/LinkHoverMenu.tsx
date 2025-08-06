

import React from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/core';
import { CopyIcon, PenToSquareIcon, UnlinkIcon } from '../icons';

interface LinkHoverMenuProps {
    editor: Editor;
    state: { rect: DOMRect; href: string; from: number; to: number };
    onClose: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const LinkHoverMenu: React.FC<LinkHoverMenuProps> = ({ editor, state, onClose, onMouseEnter, onMouseLeave }) => {

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        navigator.clipboard.writeText(state.href);
        onClose();
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        // Set the selection to the link's range, which will trigger the main LinkMenu to appear
        editor.chain().focus().setTextSelection({ from: state.from, to: state.to }).run();
        onClose();
    };

    const handleUnlink = (e: React.MouseEvent) => {
        e.preventDefault();
        // Set the selection to the link's range and unset the link
        (editor.chain().focus().setTextSelection({ from: state.from, to: state.to }) as any).unsetLink().run();
        onClose();
    };

    const menuStyle: React.CSSProperties = {
        position: 'fixed',
        top: `${state.rect.bottom}px`,
        left: `${state.rect.left + state.rect.width / 2}px`,
        transform: 'translate(-50%, 8px)',
        zIndex: 40,
    };

    return createPortal(
        <div
            style={menuStyle}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 flex items-center p-1 gap-1"
            aria-hidden="true"
        >
            <button
                onClick={handleCopy}
                title="Copy link address"
                className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
                <CopyIcon />
            </button>
            <button
                onClick={handleEdit}
                title="Edit link"
                className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
                <PenToSquareIcon />
            </button>
            <button
                onClick={handleUnlink}
                title="Clear link"
                className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700"
            >
                <UnlinkIcon />
            </button>
        </div>,
        document.body
    );
};

export default LinkHoverMenu;