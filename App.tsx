

import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/core';
import { ThemeProvider } from './context/ThemeContext';
import { GitHubProvider } from './context/GitHubContext';
import { useGitHub } from './hooks/useGitHub';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import { useTiptapEditor } from './components/editor/useTiptapEditor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ModalProvider } from './context/ModalContext';
import LinkMenu from './components/editor/LinkMenu';
import TableMenu from './components/editor/TableMenu';
import { TableControls } from './components/editor/TableControls';
import { TableSelectionControls } from './components/editor/TableSelectionControls';
import { FontSizeProvider } from './context/FontSizeContext';
import { useFontSize } from './hooks/useFontSize';
import { FontFamilyProvider } from './context/FontFamilyContext';
import { useFontFamily } from './hooks/useFontFamily';

const AUTOSAVE_DELAY = 2500; // 2.5 seconds

const PlitaEditor: React.FC = () => {
    const { activeFile, initialContent, isDirty, setIsDirty, saveFile, isSaving, loadFile } = useGitHub();
    const editor = useTiptapEditor(initialContent);
    const { fontSize } = useFontSize();
    const { fontFamily } = useFontFamily();
    const autosaveTimerRef = useRef<number | null>(null);

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
            editor.commands.setContent(newContent, { emitUpdate: false });
            // After setting content, it's no longer dirty
            setIsDirty(false); 
        }, 10);
        
        return () => clearTimeout(timeoutId);

    }, [activeFile, initialContent, editor, setIsDirty]);

    // Effect to track if the editor content is "dirty" and to handle autosaving
    useEffect(() => {
        if (!editor) {
            return;
        }

        // If a save operation is in progress, cancel any pending autosave to prevent race conditions.
        if (isSaving) {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
                autosaveTimerRef.current = null;
            }
            return; // Do not set up new listeners while a save is in progress.
        }

        const handleUpdate = ({ editor: updatedEditor }: { editor: Editor }) => {
            const savedContent = activeFile ? activeFile.content : initialContent;
            const currentContent = updatedEditor.getHTML();
            const isNowDirty = currentContent !== savedContent;

            // Always update the dirty status if it has changed.
            if (isNowDirty !== isDirty) {
                setIsDirty(isNowDirty);
            }

            // Clear the previous timer on each update to debounce.
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }

            // If the document is dirty and part of the repo, set a new autosave timer.
            if (isNowDirty && activeFile) {
                autosaveTimerRef.current = window.setTimeout(() => {
                    saveFile(currentContent);
                }, AUTOSAVE_DELAY);
            }
        };

        editor.on('update', handleUpdate);

        // Cleanup function for the effect.
        return () => {
            editor.off('update', handleUpdate);
            // Ensure the timer is cleared on unmount or re-run.
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [editor, activeFile, initialContent, isDirty, setIsDirty, saveFile, isSaving]);


    if (!editor) {
        return null; // or a loading spinner
    }

    return (
        <AppShell>
            <main className={`relative flex-grow flex flex-col overflow-hidden text-size-${fontSize} font-family-${fontFamily}`}>
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-center py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <EditorToolbar editor={editor} />
                    </div>
                </div>
                
                <LinkMenu editor={editor} />
                <TableMenu editor={editor} />
                <TableControls editor={editor} />
                <TableSelectionControls editor={editor} />

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
                <FontSizeProvider>
                    <FontFamilyProvider>
                        <ModalProvider>
                            <PlitaEditor />
                        </ModalProvider>
                    </FontFamilyProvider>
                </FontSizeProvider>
			</ThemeProvider>
		</GitHubProvider>
	);
};

export default App;