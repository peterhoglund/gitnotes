import React, { useState } from 'react';
import { useGitHub } from '../hooks/useGitHub';
import { GitHubContent, GitHubFile } from '../utils/github';
import { FolderIcon, FolderOpenIcon, FileIcon, ChevronDownIcon, ChevronRightIcon } from './icons';

type TreeNode = GitHubContent & { children?: TreeNode[] };

export const FileTree: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
    const { token, tree, isLoading, activeFile, loadFile, expandFolder } = useGitHub();
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

    const handleToggleFolder = (path: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
                // The expandFolder function fetches the children and updates the main `tree` state
                expandFolder(path); 
            }
            return newSet;
        });
    };
    
    const renderNode = (node: TreeNode, level: number) => {
        const isFolder = node.type === 'dir';
        const isExpanded = expandedFolders.has(node.path);
        const isActive = !isFolder && activeFile?.path === node.path;

        return (
            <div key={node.path}>
                <div 
                    className={`file-tree-item flex items-center text-sm py-1.5 my-0.5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300 ${isActive ? 'active' : ''}`}
                    style={ isOpen ? { paddingLeft: `${level * 16 + 8}px` } : {justifyContent: 'center', paddingLeft: '8px'} }
                    onClick={() => isFolder ? handleToggleFolder(node.path) : loadFile(node as GitHubFile)}
                    title={node.name}
                >
                    {isOpen && (
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {isFolder && (isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />)}
                        </div>
                    )}
                    
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400">
                        {isFolder ? (isExpanded ? <FolderOpenIcon /> : <FolderIcon />) : <FileIcon />}
                    </div>

                    {isOpen && <span className="ml-1 truncate flex-1">{node.name}</span>}
                </div>
                {isFolder && isExpanded && isOpen && (
                    <div>
                        {node.children ? (
                            node.children.length > 0 ? (
                                node.children.map(child => renderNode(child, level + 1))
                            ) : (
                                <div className="text-xs text-gray-400 dark:text-gray-500 italic" style={{ paddingLeft: `${(level + 1) * 16 + 8 + 20 + 4}px` }}>
                                    Empty
                                </div>
                            )
                        ) : (
                             <div className="text-xs text-gray-400 dark:text-gray-500 italic" style={{ paddingLeft: `${(level + 1) * 16 + 8 + 20 + 4}px` }}>
                                Loading...
                             </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    if (!token) {
        return <div className={`px-4 text-center text-sm text-gray-500 dark:text-gray-400 ${isOpen ? '' : 'hidden'}`}>Sign in to view your files.</div>;
    }
    
    if (isLoading && !tree) {
        return <div className={`px-4 text-center text-sm text-gray-500 dark:text-gray-400 ${isOpen ? '' : 'hidden'}`}>Loading files...</div>;
    }
    
    if (!tree) {
        return <div className={`px-4 text-center text-sm text-gray-500 dark:text-gray-400 ${isOpen ? '' : 'hidden'}`}>Could not load files.</div>;
    }

    return (
        <div>
            <div className={`px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>{isOpen ? 'FILES' : ''}</div>
            {tree.map(node => renderNode(node, 0))}
        </div>
    );
};