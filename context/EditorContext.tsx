import React, {
	createContext,
	useCallback,
	useRef,
	useState,
	type ReactNode,
} from 'react';
import { FormatState } from '../types/format';
import { INITIAL_STATE } from '../utils/constants';

interface EditorContextType {
	editorRef: React.RefObject<HTMLDivElement>;
	menuRef: React.RefObject<HTMLDivElement>;
	emojiMenuRef: React.RefObject<HTMLDivElement>;
	formatState: FormatState;
	setFormatState: React.Dispatch<React.SetStateAction<FormatState>>;
	editorWidth: number;
	setEditorWidth: React.Dispatch<React.SetStateAction<number>>;
	hoveredCodeBlock: HTMLElement | null;
	setHoveredCodeBlock: React.Dispatch<
		React.SetStateAction<HTMLElement | null>
	>;
	hoveredEmojiBlock: HTMLElement | null;
	setHoveredEmojiBlock: React.Dispatch<React.SetStateAction<HTMLElement | null>>;
	cancelHideMenu: () => void;
	hideMenu: () => void;
	cancelHideEmojiMenu: () => void;
	hideEmojiMenu: () => void;
	addHoverListeners: (container: HTMLElement | null) => void;
}

export const EditorContext =
	createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
	/* ─── refs & state ───────────────────────────── */
	const editorRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const emojiMenuRef = useRef<HTMLDivElement>(null);
	const [formatState, setFormatState] =
		useState<FormatState>(INITIAL_STATE);
	const [editorWidth, setEditorWidth] = useState(650);
	const [hoveredCodeBlock, setHoveredCodeBlock] =
		useState<HTMLElement | null>(null);
	const [hoveredEmojiBlock, setHoveredEmojiBlock] =
		useState<HTMLElement | null>(null);

	/* ─── menu-hide timers ─────────────────────────── */
	const hideMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideEmojiMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cancelHideMenu = useCallback(() => {
		if (hideMenuTimeout.current) {
			clearTimeout(hideMenuTimeout.current);
			hideMenuTimeout.current = null;
		}
	}, []);

	const hideMenu = useCallback(() => {
		hideMenuTimeout.current = setTimeout(() => {
			setHoveredCodeBlock(null);
		}, 300);
	}, []);

	const cancelHideEmojiMenu = useCallback(() => {
		if (hideEmojiMenuTimeout.current) {
			clearTimeout(hideEmojiMenuTimeout.current);
			hideEmojiMenuTimeout.current = null;
		}
	}, []);

	const hideEmojiMenu = useCallback(() => {
		hideEmojiMenuTimeout.current = setTimeout(() => {
			setHoveredEmojiBlock(null);
		}, 300);
	}, []);

	/* ─── hover listeners for all floating menus ───── */
	const addHoverListeners = useCallback(
		(container: HTMLElement | null) => {
			if (!container) return;
			
			// Handle code blocks
			const codeBlocks: HTMLElement[] = [];
			if (container.tagName === 'PRE') {
				codeBlocks.push(container);
			} else {
				container.querySelectorAll('pre').forEach(pre => codeBlocks.push(pre));
			}

			codeBlocks.forEach(pre => {
				pre.onmouseenter = () => {
					cancelHideMenu();
					setHoveredCodeBlock(pre);
				};
				pre.onmouseleave = (e: MouseEvent) => {
					if (menuRef.current?.contains(e.relatedTarget as Node)) return;
					hideMenu();
				};
			});

			// Handle emoji blocks - check if the container is the block itself or find children
			const emojiBlocks: HTMLElement[] = [];
			if (container.classList.contains('custom-bg-block')) {
				emojiBlocks.push(container);
			} else {
				container.querySelectorAll('.custom-bg-block').forEach(el => emojiBlocks.push(el as HTMLElement));
			}
			
			emojiBlocks.forEach(block => {
				block.onmouseenter = () => {
					cancelHideEmojiMenu();
					setHoveredEmojiBlock(block);
				};
				block.onmouseleave = (e: MouseEvent) => {
					if (emojiMenuRef.current?.contains(e.relatedTarget as Node)) return;
					hideEmojiMenu();
				};
			});
		},
		[cancelHideMenu, hideMenu, setHoveredCodeBlock, cancelHideEmojiMenu, hideEmojiMenu, setHoveredEmojiBlock, menuRef, emojiMenuRef],
	);

	/* ─── provider value ──────────────────────────── */
	const value: EditorContextType = {
		editorRef,
		menuRef,
		emojiMenuRef,
		formatState,
		setFormatState,
		editorWidth,
		setEditorWidth,
		hoveredCodeBlock,
		setHoveredCodeBlock,
		hoveredEmojiBlock,
		setHoveredEmojiBlock,
		cancelHideMenu,
		hideMenu,
		cancelHideEmojiMenu,
		hideEmojiMenu,
		addHoverListeners,
	};

	return (
		<EditorContext.Provider value={value}>
			{children}
		</EditorContext.Provider>
	);
};
