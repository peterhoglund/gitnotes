import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  onSelect: (color: string) => void;
  currentColor: string;
  children: React.ReactNode;
  title: string;
  noColorLabel?: string;
}

const NO_COLOR = 'transparent';

// Simplified layout: Each inner array is a row of colors with uniform spacing.
const COLOR_ROWS = [
  // Row 1: Greys (from black to near-white in noticeable steps)
  ['#0a0a0a', '#525252', '#a3a3a3', '#d5d5d5', '#f2f2f2', '#ffffff'],
  // Row 2: Positive (Green) & Negative (Red)
  ['#86EFAC', '#22C55E', '#15803D', '#F87171', '#DC2626', '#7F1D1D'],
  // Row 3: Neutral (Blue) & Warning (Orange)
  ['#60A5FA', '#2563EB', '#1E3A8A', '#FFE098', '#FB923C', '#EA580C'],
  // Row 4: Accent Colors
  ['#A855F7', '#6B21A8', '#22D3EE', '#0891B2', '#F472B6', '#DB2777'],
];


const ColorPicker = ({ onSelect, currentColor, children, title, noColorLabel }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (color: string) => {
    onSelect(color);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={pickerRef}>
      <button
        title={title}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsOpen(!isOpen);
        }}
        className="color-picker-trigger p-2 rounded flex items-center justify-center"
      >
        {children}
      </button>
      {isOpen && (
        <div className="color-picker-panel absolute z-10 mt-2 w-auto rounded-lg shadow-lg p-3 right-0">
          <div className="flex flex-col gap-y-2">
            {COLOR_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center">
                {row.map((color, colorIndex) => {
                  const isSelected = currentColor.toLowerCase() === color.toLowerCase();
                  return (
                    <button
                      key={color}
                      aria-label={`Color ${color}`}
                      title={color}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelect(color);
                      }}
                      className={`
                        color-picker-swatch w-7 h-7 rounded-full border-2 shadow-sm
                        transition-all duration-150 transform hover:scale-110
                        ${colorIndex > 0 ? 'ml-1.5' : ''}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                      `}
                       style={{
                        backgroundColor: color,
                       }}
                    ></button>
                  );
                })}
              </div>
            ))}
             {noColorLabel && (
                <div className="color-picker-divider border-t mt-2 pt-2">
                    <button
                    onClick={() => handleSelect(NO_COLOR)}
                    className="color-picker-no-color-button w-full text-center px-4 py-2 text-sm rounded"
                    >
                    {noColorLabel}
                    </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ColorPicker;