import React, { createContext, useState, useCallback, ReactNode } from 'react';

export type FontFamily = 'sans' | 'serif';

interface FontFamilyContextType {
  fontFamily: FontFamily;
  setFontFamily: (family: FontFamily) => void;
}

export const FontFamilyContext = createContext<FontFamilyContextType | undefined>(undefined);

export const FontFamilyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontFamily, setFontFamilyState] = useState<FontFamily>(() => {
    const savedFamily = localStorage.getItem('plita_font_family');
    return (savedFamily === 'sans' || savedFamily === 'serif') ? savedFamily : 'sans';
  });

  const setFontFamily = useCallback((family: FontFamily) => {
    localStorage.setItem('plita_font_family', family);
    setFontFamilyState(family);
  }, []);

  return (
    <FontFamilyContext.Provider value={{ fontFamily, setFontFamily }}>
      {children}
    </FontFamilyContext.Provider>
  );
};
