
import React, { useState, useRef, useEffect } from 'react';
import ToolbarButton from '../ToolbarButton';
import Dropdown from '../Dropdown';
import ColorPicker from '../ColorPicker';
import {
  BoldIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon,
  ListIcon, ListOrderedIcon, AlignLeftIcon, AlignCenterIcon, AlignRightIcon,
  AlignJustifyIcon, EllipsisVerticalIcon, TextColorIcon, HighlighterIcon, BlockBackgroundColorIcon,
  SaveIcon, RefreshCwIcon,
} from '../icons';
import { useEditorContext } from '../../hooks/useEditorContext';
import { useFormatState } from '../../hooks/useFormatState';
import { useGitHub } from '../../hooks/useGitHub';

const BLOCK_TYPES = [
  { value: 'h1', label: 'Title' },
  { value: 'h2', label: 'Header' },
  { value: 'h3', label: 'Subheader' },
  { value: 'p', label: 'Normal' },
  { value: 'h6', label: 'Small Text' },
  { value: 'pre', label: 'Code Block' },
];

const EditorToolbar = () => {
  const { formatState, editorRef } = useEditorContext();
  const { handleCommand } = useFormatState();
  const { activeFile, isSaving, isDirty, saveFile } = useGitHub();

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

  const handleSave = () => {
      if (editorRef.current && activeFile && isDirty) {
          saveFile(editorRef.current.innerHTML);
      }
  };

  return (
    <div className="toolbar-wrapper bg-white rounded-xl shadow-md p-2 flex items-center gap-x-1 text-gray-800">
      <ToolbarButton
          onClick={handleSave}
          isActive={false}
          title={isSaving ? "Saving..." : "Save current file (Cmd/Ctrl+S)"}
          disabled={!activeFile || isSaving || !isDirty}
        >
          {isSaving ? <RefreshCwIcon className="animate-spin" /> : <SaveIcon />}
      </ToolbarButton>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <Dropdown
        label="Style"
        items={BLOCK_TYPES}
        onSelect={(value) => handleCommand('formatBlock', value)}
        currentValue={formatState.blockType}
      />
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => handleCommand('bold')} isActive={formatState.isBold} title="Bold">
          <BoldIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('italic')} isActive={formatState.isItalic} title="Italic">
          <ItalicIcon />
        </ToolbarButton>
      </div>
      
      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

      <div className="flex items-center gap-1">
         <ToolbarButton onClick={() => handleCommand('justifyLeft')} isActive={formatState.isJustifyLeft} title="Align Left">
          <AlignLeftIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('justifyCenter')} isActive={formatState.isJustifyCenter} title="Align Center">
          <AlignCenterIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="flex items-center gap-1">
        <ToolbarButton onClick={() => handleCommand('insertUnorderedList')} isActive={formatState.isUl} title="Bulleted List">
          <ListIcon />
        </ToolbarButton>
        <ToolbarButton onClick={() => handleCommand('insertOrderedList')} isActive={formatState.isOl} title="Numbered List">
          <ListOrderedIcon />
        </ToolbarButton>
      </div>

      <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
      
      <div className="relative" ref={overflowRef}>
        <ToolbarButton onClick={() => setIsOverflowOpen(prev => !prev)} isActive={isOverflowOpen} title="More options">
          <EllipsisVerticalIcon />
        </ToolbarButton>
        {isOverflowOpen && (
           <div className="dropdown-panel absolute top-full right-0 mt-2 z-20 bg-white rounded-lg shadow-xl border border-gray-200 p-2 flex flex-row items-center gap-x-1 w-max">
              <ToolbarButton onClick={() => handleCommand('underline')} isActive={formatState.isUnderline} title="Underline">
                <UnderlineIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => handleCommand('strikethrough')} isActive={formatState.isStrikethrough} title="Strikethrough">
                <StrikethroughIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => handleCommand('toggleCode')} isActive={formatState.isCode} title="Code">
                <CodeIcon />
              </ToolbarButton>

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>

              <ToolbarButton onClick={() => handleCommand('justifyRight')} isActive={formatState.isJustifyRight} title="Align Right">
                <AlignRightIcon />
              </ToolbarButton>
              <ToolbarButton onClick={() => handleCommand('justifyFull')} isActive={formatState.isJustifyFull} title="Justify">
                <AlignJustifyIcon />
              </ToolbarButton>

              <div className="toolbar-divider h-6 border-l border-gray-300 mx-2"></div>
              
              <ColorPicker
                onSelect={(color) => handleCommand('foreColor', color)}
                currentColor={formatState.color}
                title="Text Color"
              >
                <div className="flex flex-col items-center justify-center">
                  <TextColorIcon />
                  <div
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: formatState.color }}
                  ></div>
                </div>
              </ColorPicker>
              <ColorPicker
                onSelect={(color) => handleCommand('toggleHighlight', color)}
                currentColor={formatState.highlightColor}
                title="Highlight Color"
                noColorLabel="No Highlight"
              >
                 <div className="flex flex-col items-center justify-center">
                  <HighlighterIcon />
                  <div
                    className="w-5 h-1 rounded"
                    style={{ backgroundColor: formatState.highlightColor }}
                  ></div>
                </div>
              </ColorPicker>
              <ColorPicker
                onSelect={(color) => handleCommand('setBlockBackgroundColor', color)}
                currentColor={formatState.blockBackgroundColor}
                title="Block Background Color"
                noColorLabel="No Background"
              >
                <div className="flex flex-col items-center justify-center">
                    <BlockBackgroundColorIcon />
                    <div
                      className="w-5 h-1 rounded"
                      style={{ backgroundColor: formatState.blockBackgroundColor }}
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
