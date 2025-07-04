
import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { EditorProvider } from './context/EditorContext';
import { GitHubProvider } from './context/GitHubContext';
import { useGitHub } from './hooks/useGitHub';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import CodeBlockMenu from './components/editor/CodeBlockMenu';
import BlockEmojiMenu from './components/editor/BlockEmojiMenu';
import { useEditorContext } from './hooks/useEditorContext';
import { useTheme } from './hooks/useTheme';
import { useCodeHighlight } from './hooks/useCodeHighlight';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFormatState } from './hooks/useFormatState';

const ZenEditor: React.FC = () => {
    const { editorRef, editorWidth, setEditorWidth } = useEditorContext();
    const { theme } = useTheme();
    const { highlightAll } = useCodeHighlight();
    const { handleKeyDown, handleKeyUp, handlePaste } = useKeyboardShortcuts();
    const { updateFormatState } = useFormatState();
    const { activeFile, initialContent, isDirty, setIsDirty } = useGitHub();

    useEffect(() => {
        document.execCommand('styleWithCSS', false, 'true');
    }, []);
    
    useEffect(() => {
        updateFormatState();
        highlightAll(editorRef.current);
    }, [theme, updateFormatState, highlightAll, editorRef]);

    useEffect(() => {
        if (editorRef.current) {
            const newContent = activeFile ? activeFile.content : initialContent;
            // Only update if content is actually different to avoid resetting cursor
            if (editorRef.current.innerHTML !== newContent) {
                editorRef.current.innerHTML = newContent;
            }
            // A short delay ensures the editor is fully rendered before highlighting.
            setTimeout(() => {
                if(editorRef.current) {
                    highlightAll(editorRef.current);
                    updateFormatState();
                }
            }, 50);
        }
    }, [activeFile, initialContent, editorRef, highlightAll, updateFormatState]);

    // Effect to track if the editor content is "dirty" (changed from saved state)
    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;

        const handleContentChange = () => {
            if (activeFile) {
                const isNowDirty = editor.innerHTML !== activeFile.content;
                if (isNowDirty !== isDirty) {
                    setIsDirty(isNowDirty);
                }
            } else if (isDirty) {
                // No active file, so it can't be dirty
                setIsDirty(false);
            }
        };

        const mutationObserver = new MutationObserver(handleContentChange);
        mutationObserver.observe(editor, {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true,
        });

        // Initial check
        handleContentChange();

        return () => mutationObserver.disconnect();
    }, [activeFile, editorRef, isDirty, setIsDirty]);


    return (
        <AppShell>
            <main className="relative flex-grow flex flex-col overflow-hidden">
                <div className="relative z-20 flex justify-center py-4">
                    <EditorToolbar />
                </div>
                <CodeBlockMenu />
                <BlockEmojiMenu />
                <EditorCanvas
                    // Use a key to force re-mount when switching files.
                    // This is crucial for correctly setting initial content in an uncontrolled component.
                    key={activeFile?.path || 'initial'}
                    ref={editorRef}
                    initialContent={activeFile ? activeFile.content : initialContent}
                    onSelectionChange={updateFormatState}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onPaste={handlePaste}
                    editorWidth={editorWidth}
                    onEditorWidthChange={setEditorWidth}
                />
            </main>
        </AppShell>
    );
};

const App: React.FC = () => {
	return (
		<GitHubProvider>
			<ThemeProvider>
				<EditorProvider>
					<ZenEditor />
				</EditorProvider>
			</ThemeProvider>
		</GitHubProvider>
	);
};

export default App;