
import React, { useState } from 'react';
import { FolderIcon, FolderOpenIcon, FileIcon, ChevronDownIcon, ChevronRightIcon, BookIcon } from './icons';

type TreeNode = {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: TreeNode[];
};

const fileSystemData: TreeNode[] = [
  {
    id: '1',
    name: 'Project Alpha',
    type: 'folder',
    children: [
      { id: '2', name: 'README.md', type: 'file' },
      { id: '3', name: 'ideas.txt', type: 'file' },
      {
        id: '4',
        name: 'src',
        type: 'folder',
        children: [
          { id: '5', name: 'index.js', type: 'file' },
          { id: '6', name: 'styles.css', type: 'file' },
        ],
      },
    ],
  },
  {
    id: '7',
    name: 'Meeting Notes',
    type: 'folder',
    children: [
      { id: '8', name: '2024-01-15-kickoff.txt', type: 'file' },
    ],
  },
  { id: '9', name: 'Draft.txt', type: 'file' },
  { id: '10', name: 'Empty Folder', type: 'folder', children: [] },
];


export const FileTree: React.FC<{ isOpen: boolean; repoName?: string }> = ({ isOpen, repoName }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set(['1', '4']));
    const [activeFile, setActiveFile] = useState<string | null>('5');

    const handleToggleFolder = (id: string) => {
        setExpandedFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };
    
    const renderNode = (node: TreeNode, level: number) => {
        const isFolder = node.type === 'folder';
        const isExpanded = expandedFolders.has(node.id);
        const isActive = !isFolder && activeFile === node.id;

        return (
            <div key={node.id}>
                <div 
                    className={`file-tree-item flex items-center text-sm py-1.5 my-0.5 rounded-md cursor-pointer text-gray-700 dark:text-gray-300 ${isActive ? 'active' : ''}`}
                    style={ isOpen ? { paddingLeft: `${level * 16 + 8}px` } : {justifyContent: 'center', paddingLeft: '8px'} }
                    onClick={() => isFolder ? handleToggleFolder(node.id) : setActiveFile(node.id)}
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
                </div>
                {isFolder && isExpanded && isOpen && (
                    <div>
                        {node.children && node.children.length > 0 ? (
                            node.children.map(child => renderNode(child, level + 1))
                        ) : (
                            <div 
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

    return (
        <div className="py-4 px-2">
            {isOpen && (
                repoName ? (
                    <div className="px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2" title={`Connected to ${repoName}`}>
                        <BookIcon />
                        <span className="truncate">{repoName}</span>
                    </div>
                ) : (
                    <div className={`px-2 text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>FILES</div>
                )
            )}
            {fileSystemData.map(node => renderNode(node, 0))}
        </div>
    );
};
