import { useCallback } from 'react';
import { useEditorContext } from './useEditorContext';
import { useTheme } from './useTheme';
import { rgbToHex } from '../utils/color';
import { TRANSPARENT } from '../utils/constants';
import { useCodeHighlight } from './useCodeHighlight';

export const useFormatState = () => {
    const { editorRef, setFormatState } = useEditorContext();
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
			if (blockEl instanceof HTMLElement && blockEl.style.backgroundColor) {
				blockBackgroundColor = rgbToHex(blockEl.style.backgroundColor).toUpperCase();
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
			isJustifyLeft: qs('justifyLeft'),
			isJustifyCenter: qs('justifyCenter'),
			isJustifyRight: qs('justifyRight'),
			isJustifyFull: qs('justifyFull'),
		});
	}, [editorRef, setFormatState, theme]);

    const handleCommand = useCallback((cmd: string, value?: string) => {
		const inlineCommands = ['bold', 'italic', 'underline', 'strikethrough', 'foreColor', 'toggleCode', 'toggleHighlight'];
		
		const sel = window.getSelection();
		if (!sel || !sel.rangeCount) return;

		let range = sel.getRangeAt(0);
		const isCollapsed = range.collapsed;
		let marker: HTMLElement | null = null;

		if (isCollapsed && inlineCommands.includes(cmd)) {
			if (range.startContainer.nodeType === Node.TEXT_NODE) {
				const textNode = range.startContainer as Text;
				const text = textNode.textContent || '';
				const offset = range.startOffset;

				let start = offset, end = offset;
				while (start > 0 && /\S/.test(text[start - 1])) start--;
				while (end < text.length && /\S/.test(text[end])) end++;
				
				if (start !== end) {
					marker = document.createElement('span');
					marker.id = 'caret-marker';
					range.insertNode(marker);

					const wordRange = document.createRange();
					if (marker.previousSibling && marker.previousSibling.nodeType === Node.TEXT_NODE) {
						wordRange.setStart(marker.previousSibling, start);
					} else {
						wordRange.setStart(textNode, start);
					}
					if(marker.nextSibling && marker.nextSibling.nodeType === Node.TEXT_NODE) {
						wordRange.setEnd(marker.nextSibling, end - offset);
					} else {
						wordRange.setEnd(textNode, end);
					}
					
					sel.removeAllRanges();
					sel.addRange(wordRange);
					range = wordRange;
				}
			}
		}

		if (cmd === 'toggleCode' || cmd === 'toggleHighlight') {
			const tag = cmd === 'toggleCode' ? 'code' : 'span';
			const dataset = cmd === 'toggleHighlight' ? { key: 'highlight', value: 'true' } : null;

			const elementToCheck = marker || range.commonAncestorContainer;
			const container = elementToCheck.nodeType === Node.TEXT_NODE ? elementToCheck.parentElement : (elementToCheck as HTMLElement);
			
			let selector = tag;
			if (dataset) selector += `[data-${dataset.key}="${dataset.value}"]`;
			const existingEl = container?.closest<HTMLElement>(selector);

			const isRemoving = (cmd === 'toggleHighlight' && (!value || value === TRANSPARENT));

			if (existingEl && (isRemoving || existingEl.tagName.toLowerCase() === 'code' || rgbToHex(existingEl.style.backgroundColor).toLowerCase() === value?.toLowerCase())) {
				const parent = existingEl.parentNode!;
				while (existingEl.firstChild) parent.insertBefore(existingEl.firstChild, existingEl);
				parent.removeChild(existingEl);
				parent.normalize();
			} else if (existingEl && cmd === 'toggleHighlight') {
				existingEl.style.backgroundColor = value || TRANSPARENT;
			} else if (!isRemoving) {
				const newEl = document.createElement(tag);
				if (dataset) newEl.dataset[dataset.key] = dataset.value;
				if (cmd === 'toggleHighlight') newEl.style.backgroundColor = value || TRANSPARENT;
				
				try {
					range.surroundContents(newEl);
				} catch (e) {
					document.execCommand('insertHTML', false, `${newEl.outerHTML.replace('</'+tag+'>', '')}${range.toString()}</${tag}>`);
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
				}
			}
		} else if (cmd === 'foreColor' && value) {
            if (range.collapsed) {
                document.execCommand(cmd, false, value);
            } else {
                const contents = range.cloneContents();
                const tempDiv = document.createElement('div');
                tempDiv.appendChild(contents);
                const selectedHTML = tempDiv.innerHTML;

                document.execCommand('insertHTML', false, `<span style="color: ${value}">${selectedHTML}</span>`);
            }
        } else {
			document.execCommand(cmd, false, value);
		}

		if (marker && marker.parentNode) {
			const finalRange = document.createRange();
			finalRange.selectNode(marker);
			finalRange.collapse(true);
			sel.removeAllRanges();
			sel.addRange(finalRange);

			const parent = marker.parentNode;
			parent.removeChild(marker);
			parent.normalize();
		}

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
                // If we're inside a code block, only highlight that specific block.
                highlightBlock(pre);
            } else if (cmd === 'formatBlock' && value === 'pre') {
                // If we just created a new code block, highlight everything to catch it.
                highlightAll(editorRef.current);
            }
        }, 0);
	}, [updateFormatState, editorRef, highlightAll, highlightBlock]);

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
