import React, { createContext, useState, useCallback, ReactNode } from 'react';

export type FontSize = 'sm' | 'md' | 'lg';

interface FontSizeContextType {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

export const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    const savedSize = localStorage.getItem('plita_font_size');
    return (savedSize === 'sm' || savedSize === 'md' || savedSize === 'lg') ? savedSize : 'md';
  });

  const setFontSize = useCallback((size: FontSize) => {
    localStorage.setItem('plita_font_size', size);
    setFontSizeState(size);
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
};
