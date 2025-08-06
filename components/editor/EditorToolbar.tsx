
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/core';
import ToolbarButton from '../ToolbarButton';
import Dropdown from '../Dropdown';
import ColorPicker from '../ColorPicker';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon, LinkIcon,
  ListIcon, ListOrderedIcon, TaskListIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  AlignJustifyIcon, EllipsisVerticalIcon, TextColorIcon, HighlighterIcon,
  SaveIcon, RefreshCwIcon, FillDripIcon, TableCellsLargeIcon,
} from '../icons';
import { useGitHub } from '../../hooks/useGitHub';
import { useTheme } from '../../hooks/useTheme';
import { TRANSPARENT } from '../../utils/constants';

const BLOCK_TYPES = [
  { value: 'h1', label: 'Title' },
  { value: 'h2', label: 'Header' },
  { value: 'h3', label: 'Subheader' },
  { value: 'p', label: 'Normal' },
  { value: 'h6', label: 'Small Text' },
  { value: 'pre', label: 'Code Block' },
];

interface EditorToolbarProps {
    editor: Editor;
}

const EditorToolbar: React.FC<EditorToolbarProps> = ({ editor }) => {
  const { activeFile, isSaving, isDirty, saveFile } = useGitHub();
  const { theme } = useTheme();

  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const overflowRef = useRef<HTMLDivElement>(null);

  // By listening to transactions, we can force a re-render to update the active state of buttons.
  const [, setForceUpdate] = useState(0);
  useEffect(() => {
    if (!editor) return;
    
    const handleUpdate = () => {
        setForceUpdate(val => val + 1);
    };
    
    editor.on('transaction', handleUpdate);
    
    return () => {
        editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target as Node)) {
        setIsOverflowOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleSave = useCallback(() => {
      if (activeFile && isDirty) {
          saveFile(editor.getHTML());
      }
  }, [activeFile, isDirty, saveFile, editor]);

  const currentBlockType = useMemo(() => {
    if (!editor.state) return 'p';
    if (editor.isActive('heading', { level: 1 })) return 'h1';
    if (editor.isActive('heading', { level: 2 })) return 'h2';
    if (editor.isActive('heading', { level: 3 })) return 'h3';
    if (editor.isActive('heading', { level: 6 })) return 'h6';
    if (editor.isActive('codeBlock')) return 'pre';
    return 'p';
  }, [editor, editor.state]);

  const handleBlockTypeChange = useCallback((value: string) => {
    const chain = editor.chain().focus() as any;
    switch (value) {
        case 'h1': chain.toggleHeading({ level: 1 }); break;
        case 'h2': chain.toggleHeading({ level: 2 }); break;
        case 'h3': chain.toggleHeading({ level: 3 }); break;
        case 'h6': chain.toggleHeading({ level: 6 }); break;
        case 'pre': chain.toggleCodeBlock(); break;
        default: chain.setParagraph();
    }
    chain.run();
  }, [editor]);
  
  const handleColor = useCallback((color: string) => (editor.chain().focus() as any).setColor(color).run(), [editor]);
  const handleHighlight = useCallback((color: string) => (editor.chain().focus() as any).toggleHighlight({ color }).run(), [editor]);
  
  const handleBackgroundColor = useCallback((color: string) => {
    if (color === TRANSPARENT) {
      if (editor.isActive('backgroundColorBlock')) {
        editor.chain().focus().lift('backgroundColorBlock').run();
      }
    } else {
      if (editor.isActive('backgroundColorBlock')) {
        editor.chain().focus().updateAttributes('backgroundColorBlock', { color }).run();
      } else {
        editor.chain().focus().wrapIn('backgroundColorBlock', { color }).run();
      }
    }
  }, [editor]);

  const handleLink = useCallback(() => {
    if (editor.isActive('link')) {
        (editor.chain().focus() as any).unsetLink().run();
        return;
    }
    // When creating a link, apply the mark with an empty href.
    // The bubble menu will appear for the user to enter the URL.
    (editor.chain().focus().extendMarkRange('link') as any).setLink({ href: '' }).run();
  }, [editor]);

  const textColor = editor.getAttributes('textStyle').color || (theme === 'dark' ? '#d5d5d5' : '#0a0a0a');
  const highlightColor = editor.getAttributes('highlight').color || TRANSPARENT;
  const backgroundColor = editor.getAttributes('backgroundColorBlock').color || TRANSPARENT;
  const canSetLink = !editor.state.selection.empty;

  const { from } = editor.state.selection;
  const firstNode = editor.state.doc.firstChild;
  const endOfFirstNode = firstNode ? firstNode.nodeSize : 0;
  const isTitleActive = from <= endOfFirstNode;

  return (
    <div className="toolbar-wrapper bg-white rounded-xl shadow-md p-2 flex items-center gap-x-1 text-gray-800">
      <ToolbarButton
          onClick={handleSave}
          isActive={false}
          title={isSaving ? "Saving..." : "Save current file (Cmd/Ctrl+S)"}
          disabled={!activeFile || isSaving || !isDirty}
        >
          {isSaving ? <RefreshCwIcon className="animate-spin" size="large" /> : <SaveIcon />}
      </ToolbarButton>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <Dropdown
        label="Style"
        items={BLOCK_TYPES}
        onSelect={handleBlockTypeChange}
        currentValue={currentBlockType}
        disabled={isTitleActive}
      />
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <ItalicIcon />
        </ToolbarButton>
      </div>
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
         <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenterIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bulleted List">
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
          <ListOrderedIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleTaskList().run()} isActive={editor.isActive('taskList')} title="Task List">
          <TaskListIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="relative" ref={overflowRef}>
        <ToolbarButton onClick={() => setIsOverflowOpen(prev => !prev)} isActive={isOverflowOpen} title="More options">
          <EllipsisVerticalIcon size="large" />
        </ToolbarButton>
        {isOverflowOpen && (
           <div className="dropdown-panel absolute top-full right-0 mt-2 z-30 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-row items-center gap-x-1 w-max">
              <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                <UnderlineIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                <StrikethroughIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleCode().run()} isActive={editor.isActive('code')} title="Code">
                <CodeIcon />
              </ToolbarButton>
              <ToolbarButton
                onClick={handleLink}
                isActive={editor.isActive('link')}
                title={editor.isActive('link') ? 'Remove link' : 'Create link'}
                disabled={!editor.isActive('link') && !canSetLink}
              >
                <LinkIcon />
              </ToolbarButton>

               <ToolbarButton
                onClick={() => (editor.chain().focus() as any).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                isActive={editor.isActive('table')}
                title="Insert Table"
              >
                <TableCellsLargeIcon />
              </ToolbarButton>

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

              <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
                <AlignRightIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
                <AlignJustifyIcon />
              </ToolbarButton>

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
              
              <ColorPicker
                onSelect={handleColor}
                currentColor={textColor}
                title="Text Color"
              >
                <div className="flex flex-col items-center justify-center">
                  <TextColorIcon />
                  <div
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: textColor }}
                  ></div>
                </div>
              </ColorPicker>
              <ColorPicker
                onSelect={handleHighlight}
                currentColor={highlightColor}
                title="Highlight Color"
                noColorLabel="No Highlight"
              >
                 <div className="flex flex-col items-center justify-center">
                  <HighlighterIcon />
                  <div
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: highlightColor }}
                  ></div>
                </div>
              </ColorPicker>
              <ColorPicker
                onSelect={handleBackgroundColor}
                currentColor={backgroundColor}
                title="Block Background Color"
                noColorLabel="No Background"
              >
                <div className="flex flex-col items-center justify-center">
                  <FillDripIcon />
                  <div
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: backgroundColor }}
                  ></div>
                </div>
              </ColorPicker>
           </div>
        )}
      </div>
    </div>
  );
};

export default EditorToolbar;
