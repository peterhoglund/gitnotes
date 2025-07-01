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
	menuRef: React.RefObject<HTMLDivElement>;	// ① shared ref
	formatState: FormatState;
	setFormatState: React.Dispatch<React.SetStateAction<FormatState>>;
	editorWidth: number;
	setEditorWidth: React.Dispatch<React.SetStateAction<number>>;
	hoveredCodeBlock: HTMLElement | null;
	setHoveredCodeBlock: React.Dispatch<
		React.SetStateAction<HTMLElement | null>
	>;
	cancelHideMenu: () => void;
	hideMenu: () => void;
	addHoverListeners: (container: HTMLElement | null) => void;
}

export const EditorContext =
	createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
	/* ─── refs & state ───────────────────────────── */
	const editorRef = useRef<HTMLDivElement>(null);
	const menuRef = useRef<HTMLDivElement>(null);		// ①
	const [formatState, setFormatState] =
		useState<FormatState>(INITIAL_STATE);
	const [editorWidth, setEditorWidth] = useState(650);
	const [hoveredCodeBlock, setHoveredCodeBlock] =
		useState<HTMLElement | null>(null);

	/* ─── menu-hide timer ─────────────────────────── */
	const hideMenuTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

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

	/* ─── hover listeners for every <pre> ─────────── */
	const addHoverListeners = useCallback(
		(container: HTMLElement | null) => {
			if (!container) return;
			container.querySelectorAll('pre').forEach(pre => {
				pre.onmouseenter = () => {
					cancelHideMenu();
					setHoveredCodeBlock(pre as HTMLElement);
				};

				pre.onmouseleave = (e: MouseEvent) => {
					// ② ignore pointer moves into the menu
					if (
						menuRef.current &&
						menuRef.current.contains(e.relatedTarget as Node)
					)
						return;
					hideMenu();
				};
			});
		},
		[cancelHideMenu, hideMenu],
	);

	/* ─── provider value ──────────────────────────── */
	const value: EditorContextType = {
		editorRef,
		menuRef,					// ① expose ref
		formatState,
		setFormatState,
		editorWidth,
		setEditorWidth,
		hoveredCodeBlock,
		setHoveredCodeBlock,
		cancelHideMenu,
		hideMenu,
		addHoverListeners,
	};

	return (
		<EditorContext.Provider value={value}>
			{children}
		</EditorContext.Provider>
	);
};
