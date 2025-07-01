import React, { useEffect, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { EditorProvider } from './context/EditorContext';
import { GitHubProvider } from './context/GitHubContext';
import { useGitHub } from './hooks/useGitHub';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import CodeBlockMenu from './components/editor/CodeBlockMenu';
// import DeviceAuthModal from './components/DeviceAuthModal'; // Removed
import { useEditorContext } from './hooks/useEditorContext';
import { useTheme } from './hooks/useTheme';
import { useCodeHighlight } from './hooks/useCodeHighlight';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useFormatState } from './hooks/useFormatState';
import { INITIAL_CONTENT } from './utils/constants';

const ZenEditor: React.FC = () => {
    const { editorRef, editorWidth, setEditorWidth } = useEditorContext();
    const { theme } = useTheme();
    const { highlightAll } = useCodeHighlight();
    const { updateFormatState } = useFormatState();

    const { 
      fileContent, 
      setActiveFileContent,
      saveFile 
    } = useGitHub();

    const { handleKeyDown, handleKeyUp, handlePaste } = useKeyboardShortcuts({ saveFile });

    // Effect to load file content into editor
    useEffect(() => {
        if (editorRef.current) {
            const contentToLoad = fileContent ?? INITIAL_CONTENT;
            if (editorRef.current.innerHTML !== contentToLoad) {
                editorRef.current.innerHTML = contentToLoad;
                highlightAll(editorRef.current);
                updateFormatState();
            }
        }
    }, [fileContent, highlightAll, updateFormatState, editorRef]);
    
    const handleContentChange = useCallback((e: React.FormEvent<HTMLDivElement>) => {
       setActiveFileContent(e.currentTarget.innerHTML);
    }, [setActiveFileContent]);


    // Existing effects
    useEffect(() => {
        document.execCommand('styleWithCSS', false, 'true');
    }, []);

    useEffect(() => {
        // A short delay ensures the editor is fully rendered before initial highlighting.
        setTimeout(() => {
            if(editorRef.current) {
                highlightAll(editorRef.current);
                updateFormatState();
            }
        }, 50);
    }, [highlightAll, updateFormatState, editorRef]);


    return (
        <AppShell>
            <main className="relative flex-grow flex flex-col overflow-hidden">
                <div className="relative z-20 flex justify-center py-4">
                    <EditorToolbar />
                </div>
                <CodeBlockMenu />
                <EditorCanvas
                    ref={editorRef}
                    onSelectionChange={updateFormatState}
                    onKeyDown={handleKeyDown}
                    onKeyUp={handleKeyUp}
                    onPaste={handlePaste}
                    onInput={handleContentChange}
                    editorWidth={editorWidth}
                    onEditorWidthChange={setEditorWidth}
                />
            </main>
        </AppShell>
    );
};

const App: React.FC = () => {
	return (
		<ThemeProvider>
			<EditorProvider>
                <GitHubProvider>
                    <ZenEditor />
                </GitHubProvider>
			</EditorProvider>
		</ThemeProvider>
	);
};

export default App;