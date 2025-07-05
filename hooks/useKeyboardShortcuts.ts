import { useCallback } from 'react';
import { useGitHub } from './useGitHub';
import { Editor } from '@tiptap/core';

export const useKeyboardShortcuts = (editor: Editor | null) => {
    const { activeFile, isSaving, saveFile } = useGitHub();

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		if (!editor) return;

		// Save command
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			if (activeFile && !isSaving) {
				saveFile(editor.getHTML());
			}
			return;
		}

	}, [editor, activeFile, isSaving, saveFile]);

    return { handleKeyDown };
};
