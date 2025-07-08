import React, { useEffect, useMemo } from 'react';
import { Editor } from '@tiptap/core';
import { ThemeProvider } from './context/ThemeContext';
import { GitHubProvider } from './context/GitHubContext';
import { useGitHub } from './hooks/useGitHub';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import { useTiptapEditor } from './components/editor/useTiptapEditor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import CodeBlockMenu from './components/editor/CodeBlockMenu';
import BlockEmojiMenu from './components/editor/BlockEmojiMenu';
import LinkMenu from './components/editor/LinkMenu';
import { ModalProvider } from './context/ModalContext';

const PlitaEditor: React.FC = () => {
    const { activeFile, initialContent, isDirty, setIsDirty, saveFile } = useGitHub();
    const editor = useTiptapEditor(initialContent);

    const { handleKeyDown } = useKeyboardShortcuts(editor);

    // Effect to load content into the editor when the active file changes
    useEffect(() => {
        if (!editor) return;

        // isReady is not an official flag, we use a small timeout to ensure commands are available
        const timeoutId = setTimeout(() => {
            const newContent = activeFile ? activeFile.content : initialContent;
            
            if (editor.isDestroyed || editor.getHTML() === newContent) {
                return;
            }

            // `setContent` resets the history and dirty state
            editor.commands.setContent(newContent, false);
            // After setting content, it's no longer dirty
            setIsDirty(false); 
        }, 10);
        
        return () => clearTimeout(timeoutId);

    }, [activeFile, initialContent, editor, setIsDirty]);

    // Effect to track if the editor content is "dirty" (changed from saved state)
    useEffect(() => {
        if (!editor) return;

        const handleUpdate = ({ editor }: { editor: Editor }) => {
            const savedContent = activeFile ? activeFile.content : initialContent;
            const isNowDirty = editor.getHTML() !== savedContent;
            if (isNowDirty !== isDirty) {
                setIsDirty(isNowDirty);
            }
        };

        editor.on('update', handleUpdate);

        return () => {
            editor.off('update', handleUpdate);
        };
    }, [editor, activeFile, initialContent, isDirty, setIsDirty]);

    if (!editor) {
        return null; // or a loading spinner
    }

    return (
        <AppShell>
            <main className="relative flex-grow flex flex-col overflow-hidden">
                <div className="relative z-20 flex justify-center py-4">
                    <EditorToolbar editor={editor} />
                </div>
                <CodeBlockMenu editor={editor} />
                <BlockEmojiMenu editor={editor} />
                <LinkMenu editor={editor} />
                <EditorCanvas
                    editor={editor}
                    onKeyDown={handleKeyDown}
                />
            </main>
        </AppShell>
    );
};

const App: React.FC = () => {
	return (
		<GitHubProvider>
			<ThemeProvider>
                <ModalProvider>
                    <PlitaEditor />
                </ModalProvider>
			</ThemeProvider>
		</GitHubProvider>
	);
};

export default App;