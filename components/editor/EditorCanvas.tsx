import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { EditorContent, Editor } from '@tiptap/react';

interface EditorCanvasProps {
  editor: Editor;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

// Define the snap points for resizing. Corresponds to Small, Default, Large, and Extra Large.
const SNAP_WIDTHS = [450, 650, 850, 1050];

const EditorCanvas: React.FC<EditorCanvasProps> = ({ editor, onKeyDown }) => {
  const [editorWidth, setEditorWidth] = useState(650);
  const [isResizing, setIsResizing] = useState(false);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [handlePositions, setHandlePositions] = useState({left: 0, right: 0});
  const isResizingRef = useRef(false);

  useEffect(() => {
    const calculatePositions = () => {
      if (!canvasWrapperRef.current) return;
      const wrapperWidth = canvasWrapperRef.current.offsetWidth;
      const editorLeftEdge = (wrapperWidth - editorWidth) / 2;
      const editorRightEdge = editorLeftEdge + editorWidth;
      
      setHandlePositions({
        left: editorLeftEdge,
        right: editorRightEdge,
      });
    };
    
    calculatePositions();
    
    const resizeObserver = new ResizeObserver(calculatePositions);
    if (canvasWrapperRef.current) {
      resizeObserver.observe(canvasWrapperRef.current);
    }
    
    return () => {
      if (canvasWrapperRef.current) {
          resizeObserver.unobserve(canvasWrapperRef.current);
      }
    };
  }, [editorWidth]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);
    isResizingRef.current = true;
    document.body.classList.add('resizing');

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizingRef.current || !canvasWrapperRef.current) return;
    const wrapperRect = canvasWrapperRef.current.getBoundingClientRect();
    const editorCenterX = wrapperRect.left + wrapperRect.width / 2;
    
    const calculatedWidth = Math.abs(e.clientX - editorCenterX) * 2;
    
    const closestWidth = SNAP_WIDTHS.reduce((prev, curr) => {
        return (Math.abs(curr - calculatedWidth) < Math.abs(prev - calculatedWidth) ? curr : prev);
    });
    
    setEditorWidth(closestWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    isResizingRef.current = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    const mouseMoveHandler = (e: MouseEvent) => handleMouseMove(e);
    const mouseUpHandler = () => handleMouseUp();
    
    // Cleanup listeners on component unmount
    return () => {
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
      document.body.classList.remove('resizing');
    };
  }, []);

  return (
    <div ref={canvasWrapperRef} className="flex-grow w-full overflow-y-auto pt-4 pb-16 flex justify-center relative" onKeyDown={onKeyDown}>
      <div
        className="resize-handle"
        style={{ left: `${handlePositions.left - 6}px` }}
        onMouseDown={handleMouseDown}
      />
      <div
        className="resize-handle"
        style={{ left: `${handlePositions.right - 6}px` }}
        onMouseDown={handleMouseDown}
      />
      <div
        className={`relative resizable-editor-container ${isResizing ? 'is-resizing' : ''}`}
        style={{
          width: `${editorWidth}px`,
          transition: isResizing ? 'none' : 'width 150ms ease-out'
        }}
      >
        <EditorContent editor={editor} className="h-full w-full" />
      </div>
    </div>
  );
};

export default EditorCanvas;
