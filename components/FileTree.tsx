
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { 
    FolderIcon, FolderOpenIcon, FileIcon, ChevronDownIcon, ChevronRightIcon, BookIcon, RefreshCwIcon,
    FilePlusIcon, FolderPlusIcon, TrashIcon, EllipsisVerticalIcon, PlusIcon, SearchIcon
} from './icons';
import { RepoContentNode } from '../types/github';

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


export const FileTree: React.FC<{ isOpen: boolean; }> = ({ isOpen }) => {
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
    } = useGitHub();
    const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
    const [newItemMenuPath, setNewItemMenuPath] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const newItemMenuRef = useRef<HTMLDivElement>(null);

    const [isSearching, setIsSearching] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

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
        if (isSearching) {
            searchInputRef.current?.focus();
        } else {
            setSearchTerm('');
        }
    }, [isSearching]);

    const displayedTree = useMemo(() => {
        return filterFileTree(fileTree, searchTerm);
    }, [fileTree, searchTerm]);

    const handleFileClick = (path: string) => {
        loadFile(path);
        setIsSearching(false);
        setSearchTerm('');
    };

    const handleCreate = async (type: 'file' | 'folder', basePath: string) => {
        setNewItemMenuPath(null); // Close menu on click
        const defaultName = type === 'file' ? 'new-page.md' : 'new-folder';
        const promptMessage = `Enter name for new ${type}${basePath ? ` in '${basePath}'` : ''}:`;
        const name = window.prompt(promptMessage, defaultName);
        if (!name || name.trim() === '') return;
        if (name.includes('/')) {
            alert('Name cannot contain slashes.');
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

    const handleRemove = (node: RepoContentNode) => {
        setContextMenuPath(null);
        const confirmDelete = window.confirm(`Are you sure you want to delete "${node.name}"? This action cannot be undone.`);
        if (confirmDelete) {
            deleteNode(node);
        }
    };
    
    const renderNode = (node: RepoContentNode, level: number) => {
        const isFolder = node.type === 'dir';
        const isExpanded = isFolder && node.isOpen;
        const isActive = !isFolder && activeFile?.path === node.path;
        const showContextMenu = contextMenuPath === node.path;
        const showNewItemMenu = newItemMenuPath === node.path;

        return (
            <React.Fragment key={node.path}>
                <div className="relative group">
                    <div 
                        className={`file-tree-item flex items-center text-sm py-1.5 my-0.5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300 ${isActive ? 'active' : ''}`}
                        style={ isOpen ? { paddingLeft: `${level * 16 + 8}px` } : {justifyContent: 'center', paddingLeft: '8px'} }
                        onClick={() => isFolder ? toggleFolder(node.path) : handleFileClick(node.path)}
                        title={node.name}
                    >
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {isFolder && (isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />)}
                        </div>
                        
                        <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                            {isFolder ? (isExpanded ? <FolderOpenIcon /> : <FolderIcon />) : (<FileIcon />)}
                        </div>

                        {isOpen && <span className="ml-1 truncate flex-1">{node.name}</span>}

                        {isOpen && (
                            <div className="ml-auto mr-1 flex items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100">
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
                        )}
                    </div>

                    {showNewItemMenu && isOpen && (
                         <div
                            ref={newItemMenuRef}
                            className="dropdown-panel absolute z-20 right-2 mt-0 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1"
                            style={{ top: '100%'}}
                        >
                            <button onClick={() => handleCreate('file', node.path)} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                <FilePlusIcon /> New Page
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
                                onClick={() => handleRemove(node)}
                                className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md flex items-center gap-3"
                            >
                                <TrashIcon /> <span>Remove</span>
                            </button>
                        </div>
                    )}
                </div>

                {isFolder && isExpanded && isOpen && (
                    <div>
                        {node.isLoading && <div className="pl-12 py-1"><RefreshCwIcon className="animate-spin" /></div>}
                        {node.children && node.children.length > 0 ? (
                            node.children.map(child => renderNode(child, level + 1))
                        ) : (
                           !node.isLoading && <div 
                                className="text-xs text-gray-400 dark:text-gray-500 italic"
                                style={{ paddingLeft: `${(level + 1) * 16 + 8 + 20 + 4}px` }}
                            >
                                Empty
                            </div>
                        )}
                    </div>
                )}
            </React.Fragment>
        );
    };

    if (isLoading && fileTree.length === 0 && !isSearching) {
        return <div className="flex justify-center p-4"><RefreshCwIcon className="animate-spin"/></div>
    }

    return (
        <div className="py-2 px-2 flex flex-col h-full">
            {selectedRepo && (
                 <div className="px-1 pb-2">
                    <button
                        onClick={() => handleCreate('file', '')}
                        disabled={isSaving}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-1 ${!isOpen ? 'justify-center' : 'justify-start'}`}
                        title="New Page"
                    >
                        <FilePlusIcon />
                        {isOpen && <span>New Page</span>}
                    </button>
                    <button
                        onClick={() => setIsSearching(s => !s)}
                        disabled={isSaving}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${isSearching ? 'bg-gray-200 dark:bg-zinc-700' : ''} ${!isOpen ? 'justify-center' : 'justify-start'}`}
                        title="Find Page"
                    >
                        <SearchIcon />
                        {isOpen && <span>Find Page</span>}
                    </button>
                </div>
            )}

            {selectedRepo && <div className="border-b border-gray-200 dark:border-zinc-700 mx-1 mb-2"></div>}
            
            {isSearching && (
                 <div className="px-1 pb-2">
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Type to filter tree..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-2 py-1.5 text-sm bg-gray-100 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            )}

            <div className="flex-grow overflow-y-auto min-h-0">
                {!searchTerm && selectedRepo && (
                    <div 
                        className={`px-2 text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 h-0'}`} 
                        title={`Connected to ${selectedRepo.full_name}`}
                    >
                        <BookIcon />
                        <span className="truncate flex-1">{selectedRepo.name}</span>
                        <div className="relative">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setNewItemMenuPath(newItemMenuPath === '__root__' ? null : '__root__');
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
                                        <FilePlusIcon /> New Page
                                    </button>
                                    <button onClick={() => handleCreate('folder', '')} className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-zinc-700 rounded-md flex items-center gap-3">
                                        <FolderPlusIcon /> New Folder
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                
                {displayedTree.map(node => renderNode(node, 0))}

                {displayedTree.length === 0 && searchTerm && (
                    <div className="px-2 py-4 text-center text-xs text-gray-500 italic">
                        No files or folders found for "{searchTerm}".
                    </div>
                )}
            </div>
        </div>
    );
};
