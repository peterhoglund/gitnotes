import React from 'react';

interface BubbleMenuButtonProps {
  onClick: () => void;
  isActive?: boolean;
  children: React.ReactNode;
  title: string;
}

const BubbleMenuButton: React.FC<BubbleMenuButtonProps> = ({ onClick, isActive, children, title }) => {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`bubble-menu-button ${isActive ? 'is-active' : ''}`}
    >
      {children}
    </button>
  );
};

export default BubbleMenuButton;
