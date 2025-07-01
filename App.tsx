import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { EditorProvider } from './context/EditorContext';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import CodeBlockMenu from './components/editor/CodeBlockMenu';
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
    const { handleKeyDown, handleKeyUp, handlePaste } = useKeyboardShortcuts();
    const { updateFormatState } = useFormatState();

    useEffect(() => {
        document.execCommand('styleWithCSS', false, 'true');
    }, []);
    
    useEffect(() => {
        updateFormatState();
        highlightAll(editorRef.current);
    }, [theme, updateFormatState, highlightAll, editorRef]);

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
                    initialContent={INITIAL_CONTENT}
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
		<ThemeProvider>
			<EditorProvider>
                <ZenEditor />
			</EditorProvider>
		</ThemeProvider>
	);
};

export default App;