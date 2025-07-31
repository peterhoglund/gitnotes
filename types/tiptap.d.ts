import '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    // Manually added commands for extensions.
    // StarterKit's commands
    toggleBold: () => ReturnType;
    toggleItalic: () => ReturnType;
    toggleStrike: () => ReturnType;
    toggleCode: () => ReturnType;
    toggleCodeBlock: (attributes?: { language: string }) => ReturnType;
    setParagraph: () => ReturnType;
    toggleHeading: (attributes: { level: 1 | 2 | 3 | 4 | 5 | 6 }) => ReturnType;
    toggleBulletList: () => ReturnType;
    toggleOrderedList: () => ReturnType;

    // Other extensions
    toggleUnderline: () => ReturnType;
    toggleTaskList: () => ReturnType;
    setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => ReturnType;
    setColor: (color: string) => ReturnType;
    unsetColor: () => ReturnType;
    toggleHighlight: (attributes?: { color?: string }) => ReturnType;
    setLink: (attributes: { href: string; target?: string | null }) => ReturnType;
    unsetLink: () => ReturnType;
    setTextSelection: (position: number | { from: number; to: number }) => ReturnType;
    
    // Table Commands
    insertTable: (options?: { rows?: number; cols?: number; withHeaderRow?: boolean }) => ReturnType;
    deleteTable: () => ReturnType;
    addColumnBefore: () => ReturnType;
    addColumnAfter: () => ReturnType;
    deleteColumn: () => ReturnType;
    addRowBefore: () => ReturnType;
    addRowAfter: () => ReturnType;
    deleteRow: () => ReturnType;
    toggleHeaderColumn: () => ReturnType;
    toggleHeaderRow: () => ReturnType;
    toggleHeaderCell: () => ReturnType;
    mergeCells: () => ReturnType;
    splitCell: () => ReturnType;
    mergeOrSplit: () => ReturnType;
    setCellAttribute: (name: string, value: any) => ReturnType;
    goToNextCell: () => ReturnType;
    goToPreviousCell: () => ReturnType;
    fixTables: () => ReturnType;
    setRowBackgroundColor: (color: string | null) => ReturnType;
    setColumnBackgroundColor: (color: string | null) => ReturnType;


    // Custom background block extension commands
    setBackgroundColorBlock: (attributes: { color: string; }) => ReturnType;
    toggleBackgroundColorBlock: (attributes: { color: string; }) => ReturnType;
    unsetBackgroundColorBlock: () => ReturnType;
  }
}

export {};