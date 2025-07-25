
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { 
    FolderIcon, FolderOpenIcon, FileIcon, ChevronDownIcon, ChevronRightIcon, BookIcon, RefreshCwIcon,
    PenToSquareIcon, NewFileIcon, FolderPlusIcon, TrashIcon, EllipsisVerticalIcon, PlusIcon, SearchIcon
} from './icons';
import { RepoContentNode } from '../types/github';
import { useModal } from '../hooks/useModal';

/**
 * Recursively filters a file tree based on a search term.
 * @param nodes The array of nodes to filter.
 * @param searchTerm The term to filter by.
 * @returns A new array of nodes that match the search term.
 */
const filterFileTree = (nodes: RepoContentNode[], searchTerm: string): RepoContentNode[] => {
    if (!searchTerm.trim()) {
        return nodes;
    }

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filterNode = (node: RepoContentNode): RepoContentNode | null => {
        const isNameMatch = node.name.toLowerCase().includes(lowerCaseSearchTerm);

        if (node.type === 'dir') {
            const filteredChildren = node.children?.map(filterNode).filter(Boolean) as RepoContentNode[] || [];

            if (isNameMatch || filteredChildren.length > 0) {
                return { ...node, children: filteredChildren, isOpen: true };
            }
        } else { // 'file'
            if (isNameMatch) {
                return node;
            }
        }

        return null;
    };
    
    return nodes.map(filterNode).filter(Boolean) as RepoContentNode[];
};


interface FileTreeProps {
    isOpen: boolean;
    onMouseEnterButton: (e: React.MouseEvent, text: string) => void;
    onMouseLeaveButton: () => void;
}

export const FileTree: React.FC<FileTreeProps> = ({ isOpen, onMouseEnterButton, onMouseLeaveButton }) => {
    const { 
        selectedRepo, 
        fileTree, 
        activeFile,
        isLoading, 
        isSaving,
        loadFile, 
        toggleFolder,
        createFile,
        createFolder,
        deleteNode,
        moveNode,
        renameNode,
    } = useGitHub();
    const { showPrompt, showConfirm, showAlert } = useModal();
    const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
    const [newItemMenuPath, setNewItemMenuPath] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const newItemMenuRef = useRef<HTMLDivElement>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Drag and Drop State
    const [draggedNode, setDraggedNode] = useState<RepoContentNode | null>(null);
    const [dropTargetPath, setDropTargetPath] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenuPath(null);
            }
            if (newItemMenuRef.current && !newItemMenuRef.current.contains(event.target as Node)) {
                setNewItemMenuPath(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isSearching && isOpen) {
            searchInputRef.current?.focus();
        } else {
            setSearchTerm('');
            setIsSearching(false);
        }
    }, [isSearching, isOpen]);

    const displayedTree = useMemo(() => {
        return filterFileTree(fileTree, searchTerm);
    }, [fileTree, searchTerm]);

    const handleFileClick = (path: string) => {
        loadFile(path);
        setIsSearching(false);
        setSearchTerm('');
    };

    const handleCreate = async (type: 'file' | 'folder', basePath: string) => {
        setNewItemMenuPath(null);
        const defaultName = type === 'file' ? 'new-page' : 'new-folder';
        
        const name = await showPrompt({
            title: `Create New ${type === 'file' ? 'Page' : 'Folder'}`,
            message: `Enter the name for the new ${type}${basePath ? ` in '${basePath}'` : ''}:`,
            defaultValue: defaultName,
            confirmButtonText: 'Create'
        });

        if (!name || name.trim() === '') return;

        if (name.includes('/')) {
            await showAlert({
                title: 'Invalid Name',
                message: 'Name cannot contain slashes.',
                confirmButtonText: 'OK'
            });
            return;
        }

        const path = basePath ? `${basePath}/${name}` : name;

        try {
            if (type === 'file') {
                const content = name.endsWith('.md') || name.endsWith('.mdx') ? `# ${name.replace(/\.mdx?$/, '')}\n\n` : `<!-- ${name} -->`;
                await createFile(path, content);
            } else {
                await createFolder(path);
            }
        } catch (e) {
            // Error is handled and displayed by the context
        }
    };

    const handleRename = async (node: RepoContentNode) => {
        setContextMenuPath(null);
        const newName = await showPrompt({
            title: `Rename "${node.name}"`,
            message: `Enter the new name for this ${node.type}:`,
            defaultValue: node.name,
            confirmButtonText: 'Rename'
        });

        if (!newName || newName.trim() === '' || newName === node.name) return;

        if (newName.includes('/')) {
            await showAlert({
                title: 'Invalid Name',
                message: 'Name cannot contain slashes.',
                confirmButtonText: 'OK'
            });
            return;
        }

        try {
            await renameNode(node, newName);
        } catch (err: any) {
            showAlert({ title: 'Rename Failed', message: err.message, confirmButtonText: 'OK' });
        }
    };


    const handleRemove = async (node: RepoContentNode) => {
        setContextMenuPath(null);
        const confirmDelete = await showConfirm({
            title: `Delete "${node.name}"`,
            message: `Are you sure you want to delete this ${node.type}? This action cannot be undone.`,
            confirmButtonText: 'Delete',
            variant: 'danger',
        });

        if (confirmDelete) {
            deleteNode(node);
        }
    };

    // --- Drag and Drop Handlers ---
    const handleDragStart = (e: React.DragEvent, node: RepoContentNode) => {
        if (isSaving) {
            e.preventDefault();
            return;
        }
        e.dataTransfer.setData('sourceNode', JSON.stringify(node));
        e.dataTransfer.effectAllowed = 'move';
        setDraggedNode(node);
    };

    const handleDragEnd = () => {
        setDraggedNode(null);
        setDropTargetPath(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDragEnter = (e: React.DragEvent, targetNode: RepoContentNode, parentNode: RepoContentNode | null) => {
        e.preventDefault();
        e.stopPropagation();
        if (!draggedNode) return;

        const destinationFolderNode = targetNode.type === 'dir' ? targetNode : parentNode;
        if (!destinationFolderNode) {
            setDropTargetPath(null); // Can't drop on a root file
            return;
        }
    
        // Prevent dropping a folder into itself or a descendant
        if (draggedNode.type === 'dir' && destinationFolderNode.path.startsWith(draggedNode.path + '/')) {
            setDropTargetPath(null);
            return;
        }
        if (draggedNode.path === destinationFolderNode.path) {
            setDropTargetPath(null);
            return;
        }
        
        setDropTargetPath(destinationFolderNode.path);
    };

    const handleDrop = async (e: React.DragEvent, dropOnNode: RepoContentNode | null, parentOfDropOnNode: RepoContentNode | null) => {
        e.preventDefault();
        e.stopPropagation();
        setDropTargetPath(null);
        setDraggedNode(null);

        const sourceNodeJSON = e.dataTransfer.getData('sourceNode');
        if (!sourceNodeJSON) return;

        const sourceNode = JSON.parse(sourceNodeJSON) as RepoContentNode;
        if (!sourceNode || isSaving) return;

        // Determine the actual destination folder path
        const destinationFolderNode = dropOnNode ? (dropOnNode.type === 'dir' ? dropOnNode : parentOfDropOnNode) : null;
        const targetFolderPath = destinationFolderNode ? destinationFolderNode.path : '';
        
        // Prevent dropping a folder into itself or a descendant
        if (sourceNode.type === 'dir' && (targetFolderPath === sourceNode.path || targetFolderPath.startsWith(sourceNode.path + '/'))) {
            return;
        }
        
        // Prevent dropping a file into its own parent folder (no change)
        const sourceParentPath = sourceNode.path.includes('/') ? sourceNode.path.substring(0, sourceNode.path.lastIndexOf('/')) : '';
        if (sourceParentPath === targetFolderPath) {
            return;
        }
        
        try {
            await moveNode(sourceNode, targetFolderPath);
        } catch(err: any) {
            showAlert({ title: 'Move Failed', message: err.message, confirmButtonText: 'OK' });
        }
    };

    const handleRootDrop = (e: React.DragEvent) => {
        // Check if dropping on the root container, not on a child element
        if (e.target === e.currentTarget) {
            handleDrop(e, null, null);
        }
    };

    const handleRootDragEnter = (e: React.DragEvent) => {
        if (e.target === e.currentTarget) {
             e.preventDefault();
             e.stopPropagation();
             if (draggedNode) {
                setDropTargetPath('__root__');
             }
        }
    };
    
    const handleRootDragLeave = (e: React.DragEvent) => {
        if (e.target === e.currentTarget) {
            e.preventDefault();
            e.stopPropagation();
            setDropTargetPath(null);
        }
    };
    
    const renderNode = (node: RepoContentNode, level: number, parent: RepoContentNode | null) => {
        const isFolder = node.type === 'dir';
        const isExpanded = isFolder && node.isOpen;
        const isActive = !isFolder && activeFile?.path === node.path;
        const showContextMenu = contextMenuPath === node.path;
        const showNewItemMenu = newItemMenuPath === node.path;

        const isBeingDragged = draggedNode?.path === node.path;

        const isFolderDropTarget = dropTargetPath === node.path && node.type === 'dir';
        
        // Highlight the folder item itself only if it's collapsed.
        const isCollapsedFolderDropTarget = isFolderDropTarget && !isExpanded;
        // The wrapper for an expanded folder is the drop target, creating a unified highlight.
        const isExpandedFolderDropTarget = isFolderDropTarget && isExpanded;

        return (
            <div key={node.path} className={isExpandedFolderDropTarget ? 'drop-target rounded-md' : ''}>
                <div
                    draggable={!isSaving}
                    onDragStart={e => handleDragStart(e, node)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    onDragEnter={e => handleDragEnter(e, node, parent)}
                    onDragLeave={e => {
                        e.preventDefault();
                        e.stopPropagation();
                        // This logic handles leaving a collapsed folder that is a drop target.
                        // It does NOT clear the highlight when leaving a file that is inside
                        // a drop target folder, which fixes the flickering.
                        if (dropTargetPath === node.path && !(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                            setDropTargetPath(null);
                        }
                    }}
                    onDrop={e => handleDrop(e, node, parent)}
                    className={`group relative ${isBeingDragged ? 'is-dragging' : ''} ${isCollapsedFolderDropTarget ? 'drop-target rounded-md' : ''}`}
                >
                    <div 
                        className={`file-tree-item flex items-center text-sm py-1 px-2 rounded-md cursor-pointer text-gray-600 dark:text-gray-400 transition-colors duration-200 ${isActive ? 'active' : ''}`}
                        onClick={() => isFolder ? toggleFolder(node.path) : handleFileClick(node.path)}
                        title={node.name}
                    >
                        <div 
                            className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 transition-all duration-300"
                            style={{ marginLeft: isOpen ? `${level * 10}px` : '0px' }}
                        >
                             {isFolder ? (
                                <>
                                    <span className="group-hover:hidden">{isExpanded ? <FolderOpenIcon /> : <FolderIcon />}</span>
                                    <span className="hidden group-hover:inline-block">{isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}</span>
                                </>
                            ) : (
                                <FileIcon />
                            )}
                        </div>

                        <span className={`truncate whitespace-nowrap transition-all duration-200 overflow-hidden ${isOpen ? 'ml-1 opacity-100 flex-1' : 'ml-0 w-0 opacity-0'}`}>{node.name}</span>

                        <div className={`ml-auto flex items-center transition-opacity duration-100 ${isOpen ? 'opacity-0 group-hover:opacity-100 focus-within:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                           {isFolder && (
                                <button
                                    className="p-1 rounded hover:bg-gray-300 dark:hover:bg-zinc-700"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setNewItemMenuPath(node.path === newItemMenuPath ? null : node.path);
                                        setContextMenuPath(null);
                                    }}
                                    title="New..."
                                >
                                    <PlusIcon />
                                </button>
                            )}
                            <button
                                className="p-1 rounded hover:bg-gray-300 dark:hover:bg-zinc-700"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setContextMenuPath(node.path === contextMenuPath ? null : node.path);
                                    setNewItemMenuPath(null);
                                }}
                                title="More options"
                            >
                                <EllipsisVerticalIcon />
                            </button>
                        </div>
                    </div>

                    {showNewItemMenu && isOpen && (
                         <div
                            ref={newItemMenuRef}
                            className="dropdown-panel absolute z-20 right-2 mt-0 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1"
                            style={{ top: '100%'}}
                        >
                            <button onClick={() => handleCreate('file', node.path)} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                <NewFileIcon /> New Page
                            </button>
                            <button onClick={() => handleCreate('folder', node.path)} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                <FolderPlusIcon /> New Folder
                            </button>
                        </div>
                    )}

                    {showContextMenu && isOpen && (
                         <div
                            ref={menuRef}
                            className="dropdown-panel absolute z-20 right-2 mt-0 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1"
                            style={{ top: '100%'}}
                        >
                            <button
                                onClick={() => handleRename(node)}
                                className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3"
                            >
                                <PenToSquareIcon /> <span>Rename</span>
                            </button>
                            <button
                                onClick={() => handleRemove(node)}
                                className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md flex items-center gap-3"
                            >
                                <TrashIcon /> <span>Remove</span>
                            </button>
                        </div>
                    )}
                </div>

                {isFolder && isExpanded && isOpen && (
                    <div
                        className={`pl-0`}
                        onDragOver={handleDragOver}
                        onDragEnter={e => {
                            // When entering the children container, the drop target is the parent folder.
                            e.preventDefault();
                            e.stopPropagation();
                            handleDragEnter(e, node, parent);
                        }}
                        onDragLeave={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Only clear the target if we are leaving the container for an element outside of it.
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setDropTargetPath(null);
                            }
                        }}
                        onDrop={e => {
                            // Only handle the drop if it occurred directly on this container,
                            // not on one of the child items inside it.
                            if (e.target === e.currentTarget) {
                                handleDrop(e, node, parent);
                            }
                        }}
                    >
                        {node.isLoading && <div className="pl-8 py-1"><RefreshCwIcon className="animate-spin" /></div>}
                        {node.children && node.children.length > 0 ? (
                            node.children.map(child => renderNode(child, level + 1, node))
                        ) : (
                           !node.isLoading && <div 
                                className="text-sm text-gray-400 dark:text-gray-500 py-1 px-2 flex items-center h-10"
                            >
                                <div
                                    className="flex-shrink-0 w-1 h-6"
                                    style={{ marginLeft: `${(level + 1) * 10}px` }}
                                >
                                    {/* Empty spacer for icon alignment */}
                                </div>
                                <span className="ml-1">No pages here.</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading && fileTree.length === 0 && !isSearching) {
        return <div className="flex justify-center p-4"><RefreshCwIcon className="animate-spin"/></div>
    }

    const isRootDropTarget = dropTargetPath === '__root__';

    return (
        <div className="py-2 px-2 flex flex-col h-full">
            {selectedRepo && (
                 <div className="pb-2 flex flex-col gap-1">
                    <button
                        onClick={() => handleCreate('file', '')}
                        disabled={isSaving}
                        onMouseEnter={(e) => onMouseEnterButton(e, 'New Page')}
                        onMouseLeave={onMouseLeaveButton}
                        className="flex items-center rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full px-2 py-1.5"
                        title={isOpen ? "New Page" : ""}
                    >
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center"><NewFileIcon /></div>
                        <span className={`whitespace-nowrap transition-all duration-200 overflow-hidden ${isOpen ? 'ml-2 opacity-100' : 'ml-0 w-0 opacity-0'}`}>New Page</span>
                    </button>
                    <button
                        onClick={() => setIsSearching(s => !s)}
                        disabled={isSaving}
                        onMouseEnter={(e) => onMouseEnterButton(e, 'Search')}
                        onMouseLeave={onMouseLeaveButton}
                        className={`flex items-center rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isSearching ? 'bg-gray-200 dark:bg-zinc-700' : ''} w-full px-2 py-1.5`}
                        title={isOpen ? "Search" : ""}
                    >
                        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center"><SearchIcon /></div>
                        <span className={`whitespace-nowrap transition-all duration-200 overflow-hidden ${isOpen ? 'ml-2 opacity-100' : 'ml-0 w-0 opacity-0'}`}>Search</span>
                    </button>
                </div>
            )}
            
            {isOpen && isSearching && (
                 <div className="py-2">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Type to filter tree..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-1 py-1.5 text-sm bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}

            <div
                className={`flex-grow overflow-y-auto min-h-0 rounded-md ${isRootDropTarget ? 'drop-target' : ''}`}
                onDragOver={handleDragOver}
                onDragEnter={handleRootDragEnter}
                onDragLeave={handleRootDragLeave}
                onDrop={handleRootDrop}
            >
                {isOpen && (
                    <>
                        {!searchTerm && selectedRepo && (
                            <div 
                                className={`px-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-between transition-all duration-200 ${isOpen ? 'overflow-visible max-h-12 opacity-100' : 'overflow-hidden max-h-0 opacity-0'}`} 
                            >
                                <span>Project</span>
                                <div className="relative mr-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setNewItemMenuPath(newItemMenuPath === '__root__' ? null : '__root__');
                                            setContextMenuPath(null);
                                        }}
                                        disabled={isSaving}
                                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                        title="New..."
                                    >
                                        <PlusIcon />
                                    </button>
                                    {newItemMenuPath === '__root__' && (
                                        <div
                                            ref={newItemMenuRef}
                                            className="dropdown-panel absolute z-20 right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1"
                                        >
                                            <button onClick={() => handleCreate('file', '')} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                                <NewFileIcon /> New Page
                                            </button>
                                            <button onClick={() => handleCreate('folder', '')} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                                <FolderPlusIcon /> New Folder
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {displayedTree.map(node => renderNode(node, 0, null))}

                        {displayedTree.length === 0 && searchTerm && (
                            <div className="px-2 py-4 text-center text-xs text-gray-500 italic">
                                No files or folders found for "{searchTerm}".
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
