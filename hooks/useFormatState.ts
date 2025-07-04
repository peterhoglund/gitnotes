import { useCallback } from 'react';
import { useEditorContext } from './useEditorContext';
import { useTheme } from './useTheme';
import { rgbToHex } from '../utils/color';
import { TRANSPARENT } from '../utils/constants';
import { useCodeHighlight } from './useCodeHighlight';

export const useFormatState = () => {
    const { editorRef, setFormatState, addHoverListeners } = useEditorContext();
    const { theme } = useTheme();
    const { highlightAll, highlightBlock } = useCodeHighlight();

    const updateFormatState = useCallback(() => {
		const isDarkMode = theme === 'dark';
		const DEFAULT_COLOR = isDarkMode ? '#d5d5d5' : '#0a0a0a';

		const qs = (cmd: string) => document.queryCommandState(cmd);
		const qv = () => (document.queryCommandValue('formatBlock') || 'p').toLowerCase();
		let blockType = qv();
		if (blockType === 'div') blockType = 'p';

		const sel = window.getSelection();
		let color = DEFAULT_COLOR;
		let highlightColor = TRANSPARENT;
		let blockBackgroundColor = TRANSPARENT;
		let emoji = '';
		let isCode = false;

		if (sel?.anchorNode) {
			let el: HTMLElement | null = sel.anchorNode.nodeType === Node.TEXT_NODE
				? sel.anchorNode.parentElement
				: (sel.anchorNode as HTMLElement);
			
			let inlineEl = el;
			while (inlineEl && inlineEl !== editorRef.current) {
				if (inlineEl.tagName === 'CODE' && !inlineEl.closest('pre')) {
					isCode = true;
				}
				if (inlineEl.style.color && color === DEFAULT_COLOR) color = rgbToHex(inlineEl.style.color).toUpperCase();
				if (inlineEl.hasAttribute('color') && color === DEFAULT_COLOR) color = inlineEl.getAttribute('color')!.toUpperCase();
				if (inlineEl.dataset.highlight === 'true' && inlineEl.style.backgroundColor) highlightColor = rgbToHex(inlineEl.style.backgroundColor).toUpperCase();
				inlineEl = inlineEl.parentElement;
			}
			
			const blockEl = el?.closest('p, h1, h2, h3, h4, h5, h6, li');
			if (blockEl instanceof HTMLElement) {
				if (blockEl.style.backgroundColor) {
					blockBackgroundColor = rgbToHex(blockEl.style.backgroundColor).toUpperCase();
				}
				if (blockEl.dataset.emoji) {
					emoji = blockEl.dataset.emoji;
				}
			}
		}

		if (!['h1','h2','h3','h4','h5','h6','p','pre'].includes(blockType)) blockType = 'p';
		
		setFormatState({
			isBold: qs('bold'),
			isItalic: qs('italic'),
			isUnderline: qs('underline'),
			isStrikethrough: qs('strikethrough'),
			isCode,
			isUl: qs('insertUnorderedList'),
			isOl: qs('insertOrderedList'),
			blockType,
			color,
			highlightColor,
			blockBackgroundColor,
			emoji,
			isJustifyLeft: qs('justifyLeft'),
			isJustifyCenter: qs('justifyCenter'),
			isJustifyRight: qs('justifyRight'),
			isJustifyFull: qs('justifyFull'),
		});
	}, [editorRef, setFormatState, theme]);

    const handleCommand = useCallback((cmd: string, value?: string) => {
        const inlineFormattingCommands = [
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'toggleCode',
            'toggleHighlight',
            'foreColor'
        ];

        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const range = sel.getRangeAt(0);

        // For inline commands, do nothing if there's no selection.
        if (inlineFormattingCommands.includes(cmd) && range.collapsed) {
            return;
        }

        // --- Command Execution ---

        if (cmd === 'toggleHighlight') {
            const isRemoving = !value || value === TRANSPARENT;

            if (!isRemoving) {
                // APPLYING: Use "extract, clean, and wrap" to prevent nested spans.
                const fragment = range.extractContents();
                const existingSpans = fragment.querySelectorAll('span[data-highlight="true"]');
                existingSpans.forEach(span => span.replaceWith(...span.childNodes));
                fragment.normalize();

                const newWrapper = document.createElement('span');
                newWrapper.dataset.highlight = 'true';
                newWrapper.style.backgroundColor = value;
                newWrapper.appendChild(fragment);
                range.insertNode(newWrapper);
                
                // Restore selection
                const newRange = document.createRange();
                newRange.selectNodeContents(newWrapper);
                sel.removeAllRanges();
                sel.addRange(newRange);
            } else {
                // REMOVING: Must handle selections *inside* a highlight.
                const { commonAncestorContainer } = range;
                const parentElement = commonAncestorContainer.nodeType === Node.TEXT_NODE
                    ? commonAncestorContainer.parentElement
                    : (commonAncestorContainer as HTMLElement);
                const existingHighlight = parentElement?.closest<HTMLElement>('span[data-highlight="true"]');
                
                if (existingHighlight) {
                    // The selection is inside a highlight span. Unwrap the whole span.
                    const parent = existingHighlight.parentNode!;
                    while (existingHighlight.firstChild) {
                        parent.insertBefore(existingHighlight.firstChild, existingHighlight);
                    }
                    parent.removeChild(existingHighlight);
                    parent.normalize();
                    // Restore original range
                    sel.removeAllRanges();
                    sel.addRange(range);
                } else {
                    // The selection is not inside a highlight, but may contain one.
                    const fragment = range.extractContents();
                    const spansInFragment = fragment.querySelectorAll('span[data-highlight="true"]');
                    spansInFragment.forEach(span => span.replaceWith(...span.childNodes));
                    
                    const nodes = Array.from(fragment.childNodes);
                    range.insertNode(fragment);
                    
                    if (nodes.length > 0) {
                         const newRange = document.createRange();
                         newRange.setStartBefore(nodes[0]);
                         newRange.setEndAfter(nodes[nodes.length - 1]);
                         sel.removeAllRanges();
                         sel.addRange(newRange);
                    }
                }
            }
        } else if (cmd === 'toggleCode') {
            const elementToCheck = range.commonAncestorContainer;
            const container = elementToCheck.nodeType === Node.TEXT_NODE ? elementToCheck.parentElement : (elementToCheck as HTMLElement);
            const existingEl = container?.closest<HTMLElement>('code:not(pre code)');

            if (existingEl) {
                const parent = existingEl.parentNode!;
                while (existingEl.firstChild) parent.insertBefore(existingEl.firstChild, existingEl);
                parent.removeChild(existingEl);
                parent.normalize();
                
                // Restore original range
                sel.removeAllRanges();
                sel.addRange(range);
            } else {
                const newEl = document.createElement('code');
                try {
                    range.surroundContents(newEl);
                    const newRange = document.createRange();
                    newRange.selectNodeContents(newEl);
                    sel.removeAllRanges();
                    sel.addRange(newRange);
                } catch (e) {
                    document.execCommand('insertHTML', false, `<code>${range.toString()}</code>`);
                }
            }
        } else if (cmd === 'setBlockBackgroundColor') {
            let node = range.commonAncestorContainer;
            if (node.nodeType === Node.TEXT_NODE) node = node.parentNode!;
            
            const block = (node as HTMLElement).closest('p, h1, h2, h3, h4, h5, h6, li');
            if (block) {
                const isRemoving = !value || value === TRANSPARENT;
                if (!isRemoving) {
                    block.classList.add('custom-bg-block');
                    (block as HTMLElement).style.backgroundColor = value;
                } else {
                    block.classList.remove('custom-bg-block');
                    (block as HTMLElement).style.backgroundColor = '';
                    // Also remove emoji if bg is removed
                    block.removeAttribute('data-emoji');
                    block.classList.remove('has-emoji');
                }
                // Re-apply hover listeners to catch the newly added/removed class
                if (editorRef.current) {
                    addHoverListeners(editorRef.current);
                }
            }
        } else if (cmd === 'setBlockEmoji') {
			let node = range.commonAncestorContainer;
			if (node.nodeType === Node.TEXT_NODE) node = node.parentNode!;
			
			const block = (node as HTMLElement).closest('.custom-bg-block');
			if (block) {
				const isRemoving = !value;
				if (isRemoving) {
					block.removeAttribute('data-emoji');
					block.classList.remove('has-emoji');
				} else {
					block.setAttribute('data-emoji', value);
					block.classList.add('has-emoji');
				}
			}
		} else {
            // This handles bold, italic, underline, strikethrough, formatBlock, lists, justification, foreColor etc.
            document.execCommand(cmd, false, value);
        }
    
        // --- Post-command cleanup ---
    
        editorRef.current?.focus();
        updateFormatState();
        
        // Smarter highlighting: only highlight what's necessary to prevent caret jumps.
        setTimeout(() => {
            const currentSel = window.getSelection();
            if (!currentSel || !currentSel.rangeCount || !editorRef.current) return;
    
            const node = currentSel.anchorNode;
            const container = node?.nodeType === Node.ELEMENT_NODE ? (node as HTMLElement) : node?.parentElement;
            const pre = container?.closest('pre');
    
            if (pre) {
                highlightBlock(pre);
            } else if (cmd === 'formatBlock' && value === 'pre') {
                highlightAll(editorRef.current);
            }
        }, 0);
    }, [updateFormatState, editorRef, highlightAll, highlightBlock, addHoverListeners]);

    const ensureParagraph = useCallback(() => {
		if (editorRef.current && editorRef.current.innerHTML.trim() === '') {
			editorRef.current.innerHTML = '<p><br></p>';
			const range = document.createRange();
			const sel = window.getSelection();
			range.selectNodeContents(editorRef.current.firstChild!);
			range.collapse(true);
			sel?.removeAllRanges();
			sel?.addRange(range);
		}
	}, [editorRef]);

    return { updateFormatState, handleCommand, ensureParagraph };
};