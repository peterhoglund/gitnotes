import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/core';
import { Selection } from 'prosemirror-state';
import { TableMap, CellSelection } from 'prosemirror-tables';

const findParentTable = (selection: Selection) => {
    const { $from } = selection;
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'table') {
            const start = $from.before(d);
            return { pos: start, start, node, end: start + node.nodeSize };
        }
    }
    return undefined;
};

const HandleButton: React.FC<{
    position: { top: number; left: number } | null;
    onClick: () => void;
    className: string;
    title: string;
}> = ({ position, onClick, className, title }) => {
    if (!position) return null;
    return (
        <button
            title={title}
            className={`table-selection-handle ${className} ${position ? 'visible' : ''}`}
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
        >
            <div className="handle-dot-container">
                <div className="handle-dot"></div>
                <div className="handle-dot"></div>
                <div className="handle-dot"></div>
            </div>
        </button>
    );
};


export const TableSelectionControls: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [rowHandlePos, setRowHandlePos] = useState<{ top: number; left: number } | null>(null);
    const [colHandlePos, setColHandlePos] = useState<{ top: number; left: number } | null>(null);
    const hoveredCellRef = useRef<{ row: number | null; col: number | null }>({ row: null, col: null });

    const handleSelectRow = useCallback(() => {
        const hoveredRow = hoveredCellRef.current.row;
        if (hoveredRow === null || !editor) return;

        const { state, view } = editor;
        const tableInfo = findParentTable(state.selection);
        if (!tableInfo) return;

        const map = TableMap.get(tableInfo.node);
        if (hoveredRow >= map.height) return;

        const tableStart = tableInfo.start + 1; // Position inside the table node
        const anchorPos = tableStart + map.positionAt(hoveredRow, 0, tableInfo.node);
        const headPos = tableStart + map.positionAt(hoveredRow, map.width - 1, tableInfo.node);

        const $anchor = state.doc.resolve(anchorPos);
        const $head = state.doc.resolve(headPos);
        
        const selection = new CellSelection($anchor, $head);

        if (selection) {
            view.dispatch(state.tr.setSelection(selection).scrollIntoView());
            view.focus();
        }
    }, [editor]);

    const handleSelectCol = useCallback(() => {
        const hoveredCol = hoveredCellRef.current.col;
        if (hoveredCol === null || !editor) return;
        const { state, view } = editor;
        const tableInfo = findParentTable(state.selection);
        if (!tableInfo) return;

        const map = TableMap.get(tableInfo.node);
        if (hoveredCol >= map.width) return;

        const tableStart = tableInfo.start + 1; // Position inside the table node
        const anchorPos = tableStart + map.positionAt(0, hoveredCol, tableInfo.node);
        const headPos = tableStart + map.positionAt(map.height - 1, hoveredCol, tableInfo.node);

        const $anchor = state.doc.resolve(anchorPos);
        const $head = state.doc.resolve(headPos);

        const selection = new CellSelection($anchor, $head);
        
        if (selection) {
            view.dispatch(state.tr.setSelection(selection).scrollIntoView());
            view.focus();
        }
    }, [editor]);
    
    const updatePositions = useCallback(() => {
        const { row: hoveredRow, col: hoveredCol } = hoveredCellRef.current;
        if (!editor || !editor.isActive('table') || hoveredRow === null || hoveredCol === null) {
            setRowHandlePos(null);
            setColHandlePos(null);
            return;
        }
        
        const { view } = editor;
        const tableInfo = findParentTable(view.state.selection);
        if (!tableInfo) return;

        const tableNodeDom = view.nodeDOM(tableInfo.start) as HTMLElement | null;
        if (!tableNodeDom) return;

        const tableElement = tableNodeDom.querySelector('table');
        if (!tableElement || hoveredRow >= tableElement.rows.length) {
            setRowHandlePos(null);
            setColHandlePos(null);
            return;
        }

        const row = tableElement.rows[hoveredRow];
        if (!row || hoveredCol >= row.cells.length) {
            setRowHandlePos(null);
            setColHandlePos(null);
            return;
        }
        const cell = row.cells[hoveredCol] as HTMLElement;
        if (!cell) {
            setRowHandlePos(null);
            setColHandlePos(null);
            return;
        }
        
        const tableWrapper = tableElement.parentElement?.classList.contains('tableWrapper') 
            ? tableElement.parentElement 
            : tableElement;
        const tableRect = tableWrapper.getBoundingClientRect();
        const cellRect = cell.getBoundingClientRect();

        setRowHandlePos({ top: cellRect.top + cellRect.height / 2, left: tableRect.left });
        setColHandlePos({ top: tableRect.top, left: cellRect.left + cellRect.width / 2 });
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const rafUpdate = () => requestAnimationFrame(updatePositions);

        const handleMouseMove = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const cell = target.closest('td, th');

            let newRow = null;
            let newCol = null;

            if (cell) {
                newRow = (cell.parentNode as HTMLTableRowElement).rowIndex;
                newCol = (cell as HTMLTableCellElement).cellIndex;
            }

            if (hoveredCellRef.current.row !== newRow || hoveredCellRef.current.col !== newCol) {
                hoveredCellRef.current = { row: newRow, col: newCol };
                rafUpdate();
            }
        };

        const handleMouseLeave = (event: MouseEvent) => {
            const relatedTarget = event.relatedTarget as HTMLElement;
            if (!relatedTarget?.closest('.table-selection-handle')) {
                if (hoveredCellRef.current.row !== null || hoveredCellRef.current.col !== null) {
                    hoveredCellRef.current = { row: null, col: null };
                    rafUpdate();
                }
            }
        };

        const editorViewDom = editor.view.dom as HTMLElement;
        editorViewDom.addEventListener('mousemove', handleMouseMove);
        editorViewDom.addEventListener('mouseleave', handleMouseLeave);
        window.addEventListener('scroll', rafUpdate, true);
        window.addEventListener('resize', rafUpdate);
        editor.on('transaction', rafUpdate);

        rafUpdate(); // Initial call

        return () => {
            editorViewDom.removeEventListener('mousemove', handleMouseMove);
            editorViewDom.removeEventListener('mouseleave', handleMouseLeave);
            window.removeEventListener('scroll', rafUpdate, true);
            window.removeEventListener('resize', rafUpdate);
            editor.off('transaction', rafUpdate);
        };
    }, [editor, updatePositions]);
    
    const isVisible = editor?.isActive('table') && rowHandlePos && colHandlePos;

    if (!isVisible) return null;

    return createPortal(
        <>
            <HandleButton position={rowHandlePos} onClick={handleSelectRow} className="row-handle" title="Select row"/>
            <HandleButton position={colHandlePos} onClick={handleSelectCol} className="col-handle" title="Select column"/>
        </>,
        document.body
    );
};