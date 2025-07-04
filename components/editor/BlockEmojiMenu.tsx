import React, { useEffect, useState } from 'react';
import { SmileyIcon } from '../icons';
import { EMOJIS } from '../../utils/constants';
import { useEditorContext } from '../../hooks/useEditorContext';
import { useFormatState } from '../../hooks/useFormatState';

const BlockEmojiMenu: React.FC = () => {
	const { hoveredEmojiBlock, cancelHideEmojiMenu, hideEmojiMenu, emojiMenuRef } = useEditorContext();
	const { handleCommand } = useFormatState();

	const [isOpen, setIsOpen] = useState(false);
	const [pos, setPos] = useState({ top: -9999, left: -9999 });

	useEffect(() => {
		if (!hoveredEmojiBlock || !emojiMenuRef.current) {
			setPos({ top: -9999, left: -9999 }); // Hide
			return;
		}
		const offsetParent = emojiMenuRef.current.offsetParent as HTMLElement | null;
		if (!offsetParent) return;

		const blockRect = hoveredEmojiBlock.getBoundingClientRect();
		const parentRect = offsetParent.getBoundingClientRect();

		// Position menu inside top-right corner of the block
		const top = blockRect.top - parentRect.top;
		const left = blockRect.right - parentRect.left;

		setPos({
			top: top + 8, // 8px vertical offset
			left: left - 8, // 8px horizontal offset from the right
		});
	}, [hoveredEmojiBlock, emojiMenuRef]);

	useEffect(() => {
		const outside = (e: MouseEvent) => {
			if (emojiMenuRef.current && !emojiMenuRef.current.contains(e.target as Node)) setIsOpen(false);
		};
		document.addEventListener('mousedown', outside);
		return () => document.removeEventListener('mousedown', outside);
	}, [emojiMenuRef]);

	const select = (emoji: string) => {
		// handleCommand needs to be called on the correct range
		const sel = window.getSelection();
		if (!sel) return;

		// Temporarily focus the hovered block to ensure the command is applied correctly
		const range = document.createRange();
        if (hoveredEmojiBlock) {
		    range.selectNodeContents(hoveredEmojiBlock);
		    range.collapse(true); // collapse to start
		    sel.removeAllRanges();
		    sel.addRange(range);
        }
		
		handleCommand('setBlockEmoji', emoji);
		setIsOpen(false);
	};

	return (
		<div
			ref={emojiMenuRef}
			className={`block-emoji-menu absolute transition-opacity ${
				hoveredEmojiBlock ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
			}`}
			style={{ top: pos.top, left: pos.left, transform: 'translateX(-100%)', zIndex: 40 }}
			onMouseEnter={cancelHideEmojiMenu}
			onMouseLeave={hideEmojiMenu}
		>
			<button
				type="button"
				className="block-emoji-menu-button"
				onMouseDown={e => {
					e.preventDefault();
					setIsOpen(o => !o);
				}}
			>
				<SmileyIcon />
			</button>

			{isOpen && (
				<div 
					className="dropdown-panel absolute z-10 mt-1 w-60 rounded-lg border border-gray-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-800"
				>
					<div className="flex flex-wrap justify-center gap-1.5">
						{EMOJIS.map(emoji => (
							<button
								key={emoji}
								title={emoji}
								onMouseDown={(e) => {
									e.preventDefault();
									select(emoji);
								}}
								className="flex h-8 w-8 items-center justify-center rounded-md text-xl transition-colors hover:bg-gray-100 dark:hover:bg-zinc-700"
							>
								{emoji}
							</button>
						))}
					</div>
					<div className="color-picker-divider my-2 border-t dark:border-zinc-700"></div>
					<button
						onMouseDown={(e) => {
							e.preventDefault();
							select('');
						}}
						className="color-picker-no-color-button w-full rounded px-4 py-2 text-center text-sm"
					>
						Remove Emoji
					</button>
				</div>
			)}
		</div>
	);
};

export default BlockEmojiMenu;
