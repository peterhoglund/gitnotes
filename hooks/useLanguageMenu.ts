import { useEditorContext } from './useEditorContext';

export const useLanguageMenu = () => {
  const { cancelHideMenu, hideMenu, addHoverListeners } = useEditorContext();
  return { cancelHideMenu, hideMenu, addHoverListeners };
};
