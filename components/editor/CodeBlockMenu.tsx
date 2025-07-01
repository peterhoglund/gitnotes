import React, { useEffect, useState } from 'react';
import { ChevronDownIcon } from '../icons';
import { LANGUAGES } from '../../utils/constants';
import { useCodeHighlight } from '../../hooks/useCodeHighlight';
import { useEditorContext } from '../../hooks/useEditorContext';

const CodeBlockMenu: React.FC = () => {
	// ───── context hooks ─────────────────────────────
	const { hoveredCodeBlock, cancelHideMenu, hideMenu, menuRef } = useEditorContext();
	const { handleLanguageChange } = useCodeHighlight();

	// ───── local state ───────────────────────────────
	const [isOpen, setIsOpen] = useState(false);
	const [pos, setPos] = useState({ top: -9999, left: -9999 });

	// ───── position the menu next to the hovered <pre> ─
	useEffect(() => {
		if (!hoveredCodeBlock) return;
		const rect = hoveredCodeBlock.getBoundingClientRect();
		setPos({
			top: rect.top + window.scrollY + 8,
			left: rect.right + window.scrollX - 8
		});
	}, [hoveredCodeBlock]);

	// ───── close dropdown on outside click ────────────
	useEffect(() => {
		const outside = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false);
		};
		document.addEventListener('mousedown', outside);
		return () => document.removeEventListener('mousedown', outside);
	}, [menuRef]);

	// ───── language helpers ───────────────────────────
	const codeEl = hoveredCodeBlock?.querySelector('code');
	const langClass = codeEl ? [...codeEl.classList].find(c => c.startsWith('language-')) : '';
	const currentLang = langClass ? langClass.replace('language-', '') : 'text';
	const currentLabel = LANGUAGES.find(l => l.value === currentLang)?.label ?? 'Text';

	const select = (value: string) => {
		if (hoveredCodeBlock) handleLanguageChange(hoveredCodeBlock, value);
		setIsOpen(false);
	};

	// ───── render ─────────────────────────────────────
	return (
		<div
			ref={menuRef}
			className={`code-block-menu absolute transition-opacity ${
				hoveredCodeBlock ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
			}`}
			style={{ top: pos.top, left: pos.left, transform: 'translateX(-100%)', zIndex: 40 }}
			onMouseEnter={cancelHideMenu}
			onMouseLeave={hideMenu}
		>
			<button
				type="button"
				className="code-block-menu-button flex items-center gap-1"
				onMouseDown={e => {
					e.preventDefault();		// keep focus inside editor
					setIsOpen(o => !o);
				}}
			>
				<span>{currentLabel}</span>
				<ChevronDownIcon />
			</button>

			{isOpen && (
				<div className="dropdown-panel absolute z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg">
					<ul className="max-h-60 overflow-y-auto py-1">
						{LANGUAGES.map(lang => (
							<li key={lang.value}>
								<button
									type="button"
									onMouseDown={e => {
										e.preventDefault();
										select(lang.value);
									}}
									className={`dropdown-item block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 ${
										lang.value === currentLang ? 'active' : ''
									}`}
								>
									{lang.label}
								</button>
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);
};

export default CodeBlockMenu;