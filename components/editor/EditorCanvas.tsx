import React, { forwardRef, useEffect, useRef, useState } from 'react';

interface EditorCanvasProps {
  onSelectionChange: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onKeyUp: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  onPaste: (event: React.ClipboardEvent<HTMLDivElement>) => void;
  initialContent: string;
  editorWidth: number;
  onEditorWidthChange: (width: number) => void;
}

// Define the snap points for resizing. Corresponds to Small, Default, Large, and Extra Large.
const SNAP_WIDTHS = [450, 650, 850, 1050];

const EditorCanvas = forwardRef<HTMLDivElement, EditorCanvasProps>((
  { 
    onSelectionChange, 
    onKeyDown, 
    onKeyUp, 
    onPaste, 
    initialContent, 
    editorWidth, 
    onEditorWidthChange 
  }, ref
) => {
  const isInitialized = useRef(false);
  const [isResizing, setIsResizing] = useState(false);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const canvasWrapperRef = useRef<HTMLDivElement>(null);
  const [handlePositions, setHandlePositions] = useState({left: 0, right: 0});
  const isResizingRef = useRef(false);


  useEffect(() => {
    if (ref && typeof ref !== 'function' && ref.current && !isInitialized.current) {
      ref.current.innerHTML = initialContent;
      isInitialized.current = true;
    }
  }, [ref, initialContent]);

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
      resizeObserver.disconnect();
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
    
    onEditorWidthChange(closestWidth);
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    isResizingRef.current = false;
    document.body.classList.remove('resizing');
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };
  
  useEffect(() => {
    // Cleanup listeners on component unmount
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.classList.remove('resizing');
    };
  }, []);

  return (
    <div ref={canvasWrapperRef} className="flex-grow w-full overflow-y-auto pt-4 pb-16 flex justify-center relative">
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
        ref={editorContainerRef}
        className={`relative resizable-editor-container ${isResizing ? 'is-resizing' : ''}`}
        style={{
          width: `${editorWidth}px`,
          transition: isResizing ? 'none' : 'width 150ms ease-out'
        }}
      >
        <div
          ref={ref}
          contentEditable={true}
          onMouseUp={onSelectionChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onPaste={onPaste}
          className="prose max-w-none h-full w-full focus:outline-none p-4"
          suppressContentEditableWarning={true}
        />
      </div>
    </div>
  );
});

EditorCanvas.displayName = 'EditorCanvas';

export default EditorCanvas;