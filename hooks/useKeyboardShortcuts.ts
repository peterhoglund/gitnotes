import { useCallback } from 'react';
import { useFormatState } from './useFormatState';
import { useCodeHighlight } from './useCodeHighlight';
import { useEditorContext } from './useEditorContext';

export const useKeyboardShortcuts = () => {
    const { editorRef } = useEditorContext();
    const { updateFormatState, ensureParagraph } = useFormatState();
    const { highlightAll, highlightBlock } = useCodeHighlight();

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
			e.preventDefault();
			if (editorRef.current) {
				const selection = window.getSelection();
				if (selection) {
					const range = document.createRange();
					range.selectNodeContents(editorRef.current);
					selection.removeAllRanges();
					selection.addRange(range);
				}
			}
			return;
		}

		if (e.key !== 'Enter') return;

		const sel = window.getSelection();
		if (!sel?.rangeCount) return;

		const range = sel.getRangeAt(0);
		const node  = range.startContainer;
		const containerElement = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;

		const pre = containerElement?.closest('pre');
		if (pre) {
			e.preventDefault();
			document.execCommand('insertLineBreak');
			setTimeout(() => highlightBlock(pre), 0);
			return;
		}

	    const li = containerElement?.closest('li');
		if (li && li.textContent?.trim() === '') {
			e.preventDefault();
			document.execCommand('outdent');
			updateFormatState();
		}
	}, [updateFormatState, highlightBlock, editorRef]);

	const handleKeyUp = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
		updateFormatState();
		ensureParagraph();

		const sel = window.getSelection();
		if (!sel?.rangeCount || !sel.isCollapsed) return;

		const node = sel.anchorNode;
		if (!node) return;

		const containerElement = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
		const pre = containerElement?.closest('pre');

		if (pre) {
			// To prevent caret jumping, only re-highlight on non-character keys
			// (e.g., space, enter, punctuation, arrows). For regular letters/numbers,
			// we do nothing, letting the user type uninterrupted.
			if (!/^[a-zA-Z0-9]$/.test(e.key)) {
				setTimeout(() => highlightBlock(pre), 0);
			}
		} else {
			// Handle list creation only when not inside a code block.
			const block = containerElement?.closest('p,h1,h2,h3,h4,h5,h6');
			if (!block) return;
			const text = block.textContent;

			if (e.key === ' ') {
				const onListCommand = () => {
					setTimeout(() => {
						const newSel = window.getSelection();
						if (!newSel?.anchorNode) return;
						const listNode = newSel.anchorNode;
						const listContainerElement = listNode.nodeType === Node.ELEMENT_NODE ? (listNode as Element) : listNode.parentElement;
						const newLi = listContainerElement?.closest('li');
						if (newLi) {
							newLi.innerHTML = '&#8203;'; // Zero-width space to ensure block
							const range = document.createRange();
							range.selectNodeContents(newLi);
							range.collapse(false);
							newSel.removeAllRanges();
							newSel.addRange(range);
						}
					}, 0);
				};

				if (text === '- ' || text === '* ') {
					document.execCommand('insertUnorderedList');
					onListCommand();
				} else if (text.match(/^\d+\.\s$/)) {
					document.execCommand('insertOrderedList');
					onListCommand();
				}
			}
		}
	}, [updateFormatState, highlightBlock, ensureParagraph]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
		setTimeout(() => highlightAll(editorRef.current), 0);
	}, [highlightAll, editorRef]);

    return { handleKeyDown, handleKeyUp, handlePaste };
};