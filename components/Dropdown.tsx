
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

interface DropdownProps {
  label: string;
  items: { value: string; label: string }[];
  onSelect: (value: string) => void;
  currentValue: string;
}

const Dropdown = ({ label, items, onSelect, currentValue }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (value: string) => {
    onSelect(value);
    setIsOpen(false);
  };
  
  const currentLabel = items.find(item => item.value === currentValue)?.label || label;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onMouseDown={(e) => {
            e.preventDefault();
            setIsOpen(!isOpen)
        }}
        className="dropdown-button flex items-center justify-between w-36 p-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm"
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDownIcon />
      </button>
      {isOpen && (
        <div className="dropdown-panel absolute z-10 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200">
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.value}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(item.value);
                  }}
                  className={`dropdown-item block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${item.value === currentValue ? 'active' : ''}`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dropdown;