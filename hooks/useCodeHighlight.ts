import { useCallback } from 'react';
import { useEditorContext } from './useEditorContext';

declare const Prism: any;

// Helper to get caret position within an element by character offset
function getCaretCharacterOffsetWithin(element: Node): number {
    let caretOffset = 0;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        // Ensure the selection is within the target element
        if (element.contains(range.startContainer)) {
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.startContainer, range.startOffset);
            caretOffset = preCaretRange.toString().length;
        }
    }
    return caretOffset;
}

// Helper to restore caret position from a character offset
function createRangeByOffset(element: Node, offset: number) {
    const sel = window.getSelection();
    if (!sel) return;

    const range = document.createRange();
    range.selectNode(element);
    range.setStart(element, 0);

    let charIndex = 0;
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
    let node;

    // Traverse text nodes to find the correct character offset
    while ((node = walker.nextNode())) {
        const nodeLength = node.textContent?.length || 0;
        if (charIndex + nodeLength >= offset) {
            range.setStart(node, offset - charIndex);
            range.collapse(true);
            sel.removeAllRanges();
            sel.addRange(range);
            return;
        }
        charIndex += nodeLength;
    }
    // If offset is at the very end, place cursor there
    range.setStart(element, element.childNodes.length > 0 ? 1 : 0);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
}

export const useCodeHighlight = () => {
  const { addHoverListeners, editorRef } = useEditorContext();
  
  const highlightAll = useCallback((container: HTMLElement | null) => {
    if (!container || typeof Prism === 'undefined') return;

    const pres = container.querySelectorAll('pre');
    pres.forEach(pre => {
      let code = pre.querySelector('code');
      if (!code) {
        code = document.createElement('code');
        while (pre.firstChild) {
          code.appendChild(pre.firstChild);
        }
        pre.appendChild(code);
      }

      if (!Array.from(code.classList).some(cls => cls.startsWith('language-'))) {
          code.classList.add('language-text');
      }

      if (code.classList.contains('language-text')) {
          pre.classList.remove('line-numbers');
      } else {
          if (!pre.classList.contains('line-numbers')) {
              pre.classList.add('line-numbers');
          }
      }
      
      Prism.highlightElement(code);
    });
    addHoverListeners(container);
  }, [addHoverListeners]);

  const highlightBlock = useCallback((preElement: HTMLElement) => {
    const code = preElement.querySelector('code');
    if (!code || typeof Prism === 'undefined') return;

    // 1. Save Caret Position using character offset.
    const sel = window.getSelection();
    let caretOffset = -1;
    if (sel && sel.rangeCount > 0 && preElement.contains(sel.anchorNode)) {
         caretOffset = getCaretCharacterOffsetWithin(code);
    }

    // 2. Highlight the block.
    Prism.highlightElement(code);

    // 3. Restore Caret Position.
    if (caretOffset !== -1) {
        createRangeByOffset(code, caretOffset);
    }
    
    // Merge any adjacent text nodes that might have been split by highlighting.
    code.normalize();
  }, []);
  
  const handleLanguageChange = useCallback((preElement: HTMLElement, lang: string) => {
      const code = preElement.querySelector('code');
      if (!code) return;

      const textContent = code.textContent || '';
      code.className = '';
      preElement.classList.remove('line-numbers');
      code.textContent = textContent;

      const newLangClass = lang === 'text' ? 'language-text' : `language-${lang}`;
      code.classList.add(newLangClass);

      if (lang !== 'text') {
        preElement.classList.add('line-numbers');
      }
      
      // Use the new, robust highlight function to preserve the caret.
      highlightBlock(preElement);

      editorRef.current?.focus();
  }, [editorRef, highlightBlock]);

  return { highlightAll, handleLanguageChange, highlightBlock };
};
