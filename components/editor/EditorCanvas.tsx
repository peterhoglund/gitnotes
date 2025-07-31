


import React from 'react';
import { EditorContent } from '@tiptap/react';
import { Editor } from '@tiptap/core';

interface EditorCanvasProps {
  editor: Editor;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({ editor, onKeyDown, onClick, onMouseMove, onMouseLeave }) => {
  return (
    // The main canvas container, allowing vertical scrolling.
    // It centers the editor content horizontally.
    <div
      className="flex-grow w-full overflow-y-auto pt-24 pb-16 flex justify-center"
      onKeyDown={onKeyDown}
      onClick={onClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {/* 
        This wrapper controls the maximum width of the editor content for readability.
        'w-full' ensures it fills the container on smaller screens.
        'max-w-4xl' caps the width on larger screens.
        'px-4 sm:px-6 lg:px-8' provides responsive horizontal padding.
      */}
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
    </div>
  );
};

export default EditorCanvas;