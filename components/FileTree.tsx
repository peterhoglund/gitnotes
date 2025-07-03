
import React, { useState, useRef, useEffect } from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { useEditorContext } from '../hooks/useEditorContext';
import { 
    FolderIcon, FolderOpenIcon, FileIcon, ChevronDownIcon, ChevronRightIcon, BookIcon, RefreshCwIcon, SaveIcon,
    FilePlusIcon, FolderPlusIcon, TrashIcon, EllipsisVerticalIcon
} from './icons';
import { RepoContentNode } from '../types/github';


export const FileTree: React.FC<{ isOpen: boolean; }> = ({ isOpen }) => {
    const { 
        selectedRepo, 
        fileTree, 
        activeFile,
        isLoading, 
        isSaving,
        loadFile, 
        saveFile,
        toggleFolder,
        createFile,
        createFolder,
        deleteNode,
    } = useGitHub();
    const { editorRef } = useEditorContext();
    const [contextMenuPath, setContextMenuPath] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setContextMenuPath(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSave = () => {
        if (editorRef.current && activeFile) {
            saveFile(editorRef.current.innerHTML);
        }
    };

    const handleCreate = async (type: 'file' | 'folder') => {
        const name = window.prompt(`Enter name for new ${type}:`);
        if (!name || name.trim() === '') return;
        if (name.includes('/')) {
            alert('Name cannot contain slashes.');
            return;
        }

        const path = name; // For now, create at root.

        try {
            if (type === 'file') {
                await createFile(path);
            } else {
                await createFolder(path);
            }
        } catch (e) {
            // Error is handled and displayed by the context
        }
    };

    const handleRemove = (node: RepoContentNode) => {
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

        return (
            <div key={node.path} className="relative group">
                <div 
                    className={`file-tree-item flex items-center text-sm py-1.5 my-0.5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300 ${isActive ? 'active' : ''}`}
                    style={ isOpen ? { paddingLeft: `${level * 16 + 8}px` } : {justifyContent: 'center', paddingLeft: '8px'} }
                    onClick={() => isFolder ? toggleFolder(node.path) : loadFile(node.path)}
                    title={node.name}
                >
                    <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {isFolder && (
                            isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />
                        )}
                    </div>
                    
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {isFolder ? (
                            isExpanded ? <FolderOpenIcon /> : <FolderIcon />
                        ) : (
                            <FileIcon />
                        )}
                    </div>

                    {isOpen && <span className="ml-1 truncate flex-1">{node.name}</span>}

                    {isOpen && (
                        <button
                            className="ml-auto mr-1 p-1 rounded hover:bg-gray-300 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 focus:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuPath(node.path === contextMenuPath ? null : node.path);
                            }}
                            title="More options"
                        >
                            <EllipsisVerticalIcon />
                        </button>
                    )}
                </div>

                {showContextMenu && isOpen && (
                     <div
                        ref={menuRef}
                        className="dropdown-panel absolute z-20 right-2 mt-0 w-40 bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1"
                        style={{ top: '100%'}}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setContextMenuPath(null);
                                handleRemove(node);
                            }}
                            className="dropdown-item w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50 rounded-md flex items-center gap-3"
                        >
                            <TrashIcon /> <span>Remove</span>
                        </button>
                    </div>
                )}


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
            </div>
        );
    };

    if (isLoading && fileTree.length === 0) {
        return <div className="flex justify-center p-4"><RefreshCwIcon className="animate-spin"/></div>
    }

    return (
        <div className="py-2 px-2 flex flex-col h-full">
            {selectedRepo && (
                <div 
                    className={`px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} 
                    title={`Connected to ${selectedRepo.full_name}`}
                >
                    <BookIcon />
                    <span className="truncate flex-1">{selectedRepo.full_name}</span>
                    <button
                        onClick={() => handleCreate('file')}
                        disabled={isSaving}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="New File"
                    >
                        <FilePlusIcon />
                    </button>
                     <button
                        onClick={() => handleCreate('folder')}
                        disabled={isSaving}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="New Folder"
                    >
                        <FolderPlusIcon />
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!activeFile || isSaving}
                        className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={isSaving ? "Saving..." : "Save current file"}
                    >
                       {isSaving ? <RefreshCwIcon className="animate-spin" /> : <SaveIcon />}
                    </button>
                </div>
            )}
            <div className="flex-grow overflow-y-auto">
                {fileTree.map(node => renderNode(node, 0))}
            </div>
        </div>
    );
};
