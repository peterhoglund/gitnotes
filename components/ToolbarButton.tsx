
import React from 'react';

interface ToolbarButtonProps {
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  isActive: boolean;
  children: React.ReactNode;
  title: string;
  disabled?: boolean;
}

const ToolbarButton = ({ onClick, isActive, children, title, disabled = false }: ToolbarButtonProps) => {
  return (
    <button
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        if (disabled) return;
        e.preventDefault(); // Prevent editor from losing focus
        onClick(e);
      }}
      className={`toolbar-button p-2 rounded hover:bg-gray-300 flex items-center justify-center ${isActive ? 'active bg-gray-300 text-gray-900' : 'text-gray-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );
};

export default ToolbarButton;
