
import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { Editor } from '@tiptap/core';
import { Selection } from 'prosemirror-state';
import { ThemeProvider } from './context/ThemeContext';
import { GitHubProvider } from './context/GitHubContext';
import { useGitHub } from './hooks/useGitHub';
import AppShell from './components/layout/AppShell';
import EditorToolbar from './components/editor/EditorToolbar';
import EditorCanvas from './components/editor/EditorCanvas';
import { useTiptapEditor } from './components/editor/useTiptapEditor';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { ModalProvider } from './context/ModalContext';
import { useModal } from './hooks/useModal';
import LinkMenu from './components/editor/LinkMenu';
import LinkHoverMenu from './components/editor/LinkHoverMenu';
import TableMenu from './components/editor/TableMenu';
import { TableControls } from './components/editor/TableControls';
import { TableSelectionControls } from './components/editor/TableSelectionControls';
import { FontSizeProvider } from './context/FontSizeContext';
import { useFontSize } from './hooks/useFontSize';
import { FontFamilyProvider } from './context/FontFamilyContext';
import { useFontFamily } from './hooks/useFontFamily';
import { RepoContentNode } from './types/github';

const AUTOSAVE_DELAY = 3500; // milliseconds

interface LinkHoverState {
    rect: DOMRect;
    href: string;
    from: number;
    to: number;
}

const findNodeByPath = (nodes: RepoContentNode[], path: string): RepoContentNode | null => {
    for (const node of nodes) {
        if (node.path === path) {
            return node;
        }
        if (node.type === 'dir' && node.children && path.startsWith(node.path + '/')) {
            const foundInChild = findNodeByPath(node.children, path);
            if (foundInChild) {
                return foundInChild;
            }
        }
    }
    return null;
};

const PlitaEditor: React.FC = () => {
    const { activeFile, initialContent, isDirty, setIsDirty, saveFile, isSaving, loadFile, fileTree, renameNode, setEditor } = useGitHub();
    const editor = useTiptapEditor(initialContent);
    const { fontSize } = useFontSize();
    const { fontFamily } = useFontFamily();
    const { showAlert } = useModal();
    const autosaveTimerRef = useRef<number | null>(null);
    const [linkHoverState, setLinkHoverState] = useState<LinkHoverState | null>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    const previousSelectionRef = useRef<Selection>();

    const { handleKeyDown } = useKeyboardShortcuts(editor);

    // Effect to register the editor instance with the context
    useEffect(() => {
        if (editor) {
            setEditor(editor);
        }
        // Cleanup function to avoid stale editor instances
        return () => {
            setEditor(null);
        };
    }, [editor, setEditor]);

    const handleRenameOnTitleExit = useCallback(async () => {
        if (isSaving || !activeFile || !editor) {
            return;
        }

        const { doc } = editor.state;
        const firstNode = doc.firstChild;
        if (!firstNode || firstNode.type.name !== 'heading') {
            return;
        }

        const fileName = activeFile.path.split('/').pop() || '';
        
        if (!/^New Page( \(\d+\))?$/.test(fileName)) {
            return;
        }

        const titleText = firstNode.textContent.trim();
        
        if (!titleText) {
            return;
        }
        
        const newFileName = titleText
            .toLowerCase()
            .replace(/\s+/g, '-') // replace spaces with -
            .replace(/[^\w-]+/g, '') // remove all non-word chars except -
            .replace(/--+/g, '-') // replace multiple - with single -
            .replace(/^-+/, '') // trim - from start of text
            .replace(/-+$/, ''); // trim - from end of text

        if (!newFileName || newFileName === fileName) {
            return;
        }
        
        const nodeToRename = findNodeByPath(fileTree, activeFile.path);
        if (nodeToRename) {
            try {
                // The context's renameNode will now automatically handle grabbing dirty content
                await renameNode(nodeToRename, newFileName);
            } catch (err: any) {
                showAlert({ title: 'Automatic Rename Failed', message: err.message, confirmButtonText: 'OK' });
            }
        }
    }, [activeFile, editor, fileTree, isSaving, renameNode, showAlert]);

    const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const selection = window.getSelection();

        // If the user has selected text, we assume they want to edit, not navigate.
        if (selection && !selection.isCollapsed) {
            // Prevent default navigation if the browser tries to act on mouseUp after a selection.
            const target = event.target as HTMLElement;
            if (target.closest('a')) {
                 event.preventDefault();
            }
            return;
        }

        const target = event.target as HTMLElement;
        const link = target.closest('a');
        
        if (link && link.href) {
            const href = link.getAttribute('href');
            if (href) {
                const isExternal = /^(https?:\/\/|mailto:|tel:)/.test(href);
                if (!isExternal) {
                    // For internal links, prevent default and load the file.
                    event.preventDefault();
                    loadFile(href);
                }
                // For external links, we do NOT preventDefault, allowing the browser to open it in a new tab
                // as configured in the Link extension's HTMLAttributes (`target="_blank"`).
            }
        }
    }, [loadFile]);

    const scheduleHide = useCallback(() => {
        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = window.setTimeout(() => {
            setLinkHoverState(null);
        }, 100); // A small delay to allow moving cursor between elements
    }, []);

    const cancelHide = useCallback(() => {
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }
    }, []);

    const handleMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (!editor) return;

        const target = event.target as HTMLElement;
        const linkElement = target.closest('a');

        if (linkElement) {
            cancelHide();

            const posAtCoords = editor.view.posAtCoords({ left: event.clientX, top: event.clientY });
            if (!posAtCoords) return;

            const { pos } = posAtCoords;
            const { doc } = editor.state;
            let linkMarkDetails: { from: number; to: number; href: string } | null = null;
            
            doc.nodesBetween(pos, pos, (node, nodePos) => {
                if (linkMarkDetails) return false; // Already found
                const linkMark = node.marks.find(mark => mark.type.name === 'link');
                if (linkMark) {
                    const from = nodePos;
                    const to = nodePos + node.nodeSize;

                    linkMarkDetails = {
                        from,
                        to,
                        href: linkMark.attrs.href,
                    };

                    // Check if the cursor is actually within the text range of the link mark
                    const textNode = node.firstChild;
                    if(textNode) {
                        const domNode = editor.view.nodeDOM(from);
                        if (domNode instanceof HTMLElement) {
                            const range = document.createRange();
                            range.selectNodeContents(domNode);
                            const rects = range.getClientRects();
                            let cursorInside = false;
                            for (let i = 0; i < rects.length; i++) {
                                const r = rects[i];
                                if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) {
                                    cursorInside = true;
                                    break;
                                }
                            }
                            if(!cursorInside) linkMarkDetails = null;
                        }
                    }

                    return false; 
                }
            });

            if (linkMarkDetails) {
                 if (linkHoverState?.href !== linkMarkDetails.href || linkHoverState?.from !== linkMarkDetails.from) {
                    setLinkHoverState({
                        rect: linkElement.getBoundingClientRect(),
                        ...linkMarkDetails,
                    });
                }
            } else {
                 scheduleHide();
            }
        } else {
            scheduleHide();
        }
    }, [editor, linkHoverState, cancelHide, scheduleHide]);


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
            editor.commands.setContent(newContent, { emitUpdate: true }); // emitUpdate to ensure active states are correct
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

    // Effect to handle automatic renaming of new pages based on their title
    useEffect(() => {
        if (!editor) return;

        const handleTransaction = ({ transaction }) => {
            const { doc, selection } = transaction;
            const prevSelection = previousSelectionRef.current;
            previousSelectionRef.current = selection;

            if (isSaving || !activeFile || !prevSelection) {
                return;
            }

            const firstNode = doc.firstChild;
            if (!firstNode || firstNode.type.name !== 'heading') {
                return;
            }

            // -2 to account for start/end tokens of the node
            const titleRange = { from: 1, to: 1 + firstNode.nodeSize - 2 };
            const prevSelectedInsideTitle = prevSelection.from >= titleRange.from && prevSelection.to <= titleRange.to;
            const currentSelectedInsideTitle = selection.from >= titleRange.from && selection.to <= titleRange.to;

            if (prevSelectedInsideTitle && !currentSelectedInsideTitle) {
                handleRenameOnTitleExit();
            }
        };

        editor.on('transaction', handleTransaction);
        editor.on('blur', handleRenameOnTitleExit);

        return () => {
            editor.off('transaction', handleTransaction);
            editor.off('blur', handleRenameOnTitleExit);
        };
    }, [editor, activeFile, handleRenameOnTitleExit, isSaving]);


    if (!editor) {
        return null; // or a loading spinner
    }

    // The Link Edit menu is visible only when a link is active AND text is selected.
    const isLinkEditMenuVisible = editor.isActive('link') && !editor.state.selection.empty;

    return (
        <AppShell>
            <main className={`relative flex-grow flex flex-col overflow-hidden text-size-${fontSize} font-family-${fontFamily}`}>
                <div className="absolute top-0 left-0 right-0 z-20 flex justify-center py-4 pointer-events-none">
                    <div className="pointer-events-auto">
                        <EditorToolbar editor={editor} />
                    </div>
                </div>
                
                <LinkMenu editor={editor} />
                {linkHoverState && !isLinkEditMenuVisible && (
                    <LinkHoverMenu
                        editor={editor}
                        state={linkHoverState}
                        onClose={() => setLinkHoverState(null)}
                        onMouseEnter={cancelHide}
                        onMouseLeave={scheduleHide}
                    />
                )}
                <TableMenu editor={editor} />
                <TableControls editor={editor} />
                <TableSelectionControls editor={editor} />

                <EditorCanvas
                    editor={editor}
                    onKeyDown={handleKeyDown}
                    onClick={handleCanvasClick}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={scheduleHide}
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
