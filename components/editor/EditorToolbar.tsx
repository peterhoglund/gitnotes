
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Editor } from '@tiptap/react';

// Import extensions to augment editor commands for proper type checking
import '@tiptap/starter-kit';
import '@tiptap/extension-underline';
import '@tiptap/extension-text-align';
import '@tiptap/extension-color';
import '@tiptap/extension-highlight';
import '@tiptap/extension-code-block-lowlight';

import ToolbarButton from '../ToolbarButton';
import Dropdown from '../Dropdown';
import ColorPicker from '../ColorPicker';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon,
  ListIcon, ListOrderedIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  AlignJustifyIcon, EllipsisVerticalIcon, TextColorIcon, HighlighterIcon, BlockBackgroundColorIcon,
  SaveIcon, RefreshCwIcon,
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
  }, [editor.state]);

  const handleBlockTypeChange = useCallback((value: string) => {
    const chain = editor.chain().focus();
    switch (value) {
        case 'h1': chain.setHeading({ level: 1 }).run(); break;
        case 'h2': chain.setHeading({ level: 2 }).run(); break;
        case 'h3': chain.setHeading({ level: 3 }).run(); break;
        case 'h6': chain.setHeading({ level: 6 }).run(); break;
        case 'pre': chain.setCodeBlock().run(); break;
        default: chain.setParagraph().run();
    }
  }, [editor]);
  
  const handleColor = useCallback((color: string) => editor.chain().focus().setColor(color).run(), [editor]);
  const handleHighlight = useCallback((color: string) => editor.chain().focus().toggleHighlight({ color }).run(), [editor]);
  const handleBlockBg = useCallback((color: string) => {
    const chain = editor.chain().focus();
    const nodeTypes = ['paragraph', 'heading', 'listItem'];
    
    // Check which node type is active and apply the attribute
    const activeNodeType = nodeTypes.find(type => editor.isActive(type));

    if (activeNodeType) {
        if (color === TRANSPARENT) {
           chain.updateAttributes(activeNodeType, { backgroundColor: null, emoji: null });
        } else {
           chain.updateAttributes(activeNodeType, { backgroundColor: color });
        }
    }
    chain.run();
  }, [editor]);
  
  const textColor = editor.getAttributes('textStyle').color || (theme === 'dark' ? '#d5d5d5' : '#0a0a0a');
  const highlightColor = editor.getAttributes('highlight').color || TRANSPARENT;

  const getBlockBgColor = () => {
      const nodeTypes = ['paragraph', 'heading', 'listItem'];
      for (const type of nodeTypes) {
          if (editor.isActive(type)) {
              return editor.getAttributes(type).backgroundColor || TRANSPARENT;
          }
      }
      return TRANSPARENT;
  };

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
      />
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic">
          <ItalicIcon />
        </ToolbarButton>
      </div>
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
         <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align Left">
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align Center">
          <AlignCenterIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bulleted List">
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered List">
          <ListOrderedIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="relative" ref={overflowRef}>
        <ToolbarButton onClick={() => setIsOverflowOpen(prev => !prev)} isActive={isOverflowOpen} title="More options">
          <EllipsisVerticalIcon size="large" />
        </ToolbarButton>
        {isOverflowOpen && (
           <div className="dropdown-panel absolute top-full right-0 mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-row items-center gap-x-1 w-max">
              <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline">
                <UnderlineIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
                <StrikethroughIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Code">
                <CodeIcon />
              </ToolbarButton>

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align Right">
                <AlignRightIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
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

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
              
              <ColorPicker
                onSelect={handleBlockBg}
                currentColor={getBlockBgColor()}
                title="Block Background Color"
                noColorLabel="No Background"
              >
                <div className="flex flex-col items-center justify-center">
                    <BlockBackgroundColorIcon />
                    <div
                      className="w-5 h-1 rounded"
                      style={{ backgroundColor: getBlockBgColor() }}
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