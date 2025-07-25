import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/core';
import { TextSelection, Selection } from 'prosemirror-state';
import { TableMap } from 'prosemirror-tables';
import { TableControlPlusIcon } from '../icons';

interface Point {
    top: number;
    left: number;
}

// A custom utility to find the parent table node from a selection.
const findParentTable = (selection: Selection) => {
    const { $from } = selection;
    for (let d = $from.depth; d > 0; d--) {
        const node = $from.node(d);
        if (node.type.name === 'table') {
            const start = $from.before(d);
            return {
                pos: start,
                start,
                node,
                end: start + node.nodeSize,
            };
        }
    }
    return undefined;
};

const InsertionButton: React.FC<{
    top: number;
    left: number;
    transform: string;
    onClick: (e: React.MouseEvent) => void;
    title: string;
}> = ({ top, left, transform, onClick, title }) => {
    const [isHovered, setIsHovered] = useState(false);
    return (
        <button
            title={title}
            className={`table-inserter ${isHovered ? 'plus' : 'dot'}`}
            style={{ top, left, transform }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {isHovered && <TableControlPlusIcon />}
        </button>
    );
};


export const TableControls: React.FC<{ editor: Editor | null }> = ({ editor }) => {
    const [rowPoints, setRowPoints] = useState<Point[]>([]);
    const [colPoints, setColPoints] = useState<Point[]>([]);

    const calculatePositions = useCallback(() => {
        if (!editor) return;

        if (!editor.isActive('table')) {
            setRowPoints(prev => (prev.length > 0 ? [] : prev));
            setColPoints(prev => (prev.length > 0 ? [] : prev));
            return;
        }

        const { view } = editor;
        const table = findParentTable(editor.state.selection);
        if (!table) {
            setRowPoints([]);
            setColPoints([]);
            return;
        };
        
        const tableNodeDom = view.nodeDOM(table.start) as HTMLElement | null;
        if (!tableNodeDom) return;
        
        const tableWrapper = tableNodeDom.parentElement?.classList.contains('tableWrapper') 
            ? tableNodeDom.parentElement 
            : tableNodeDom;
            
        const tableElement = tableWrapper.querySelector('table');
        if (!tableElement) return;

        const tableRect = tableElement.getBoundingClientRect();
        
        // Calculate row insertion points
        const newRowPoints: Point[] = [];
        const rows = Array.from(tableElement.rows);
        rows.forEach((row, index) => {
            const rowRect = row.getBoundingClientRect();
            if (index === 0) {
                newRowPoints.push({ top: rowRect.top, left: tableRect.left });
            }
            newRowPoints.push({ top: rowRect.bottom, left: tableRect.left });
        });

        // Calculate column insertion points
        const newColPoints: Point[] = [];
        if (rows.length > 0) {
            const cells = Array.from(rows[0].cells);
            cells.forEach((cell, index) => {
                const cellRect = cell.getBoundingClientRect();
                if (index === 0) {
                    newColPoints.push({ top: tableRect.top, left: cellRect.left });
                }
                newColPoints.push({ top: tableRect.top, left: cellRect.right });
            });
        }
        
        setRowPoints(newRowPoints);
        setColPoints(newColPoints);

    }, [editor]);

    useEffect(() => {
        if (!editor) return;
        const handler = () => requestAnimationFrame(calculatePositions);
        editor.on('transaction', handler);
        window.addEventListener('scroll', handler, true);
        window.addEventListener('resize', handler);
        handler(); // Initial call
        return () => {
            editor.off('transaction', handler);
            window.removeEventListener('scroll', handler, true);
            window.removeEventListener('resize', handler);
        };
    }, [editor, calculatePositions]);
    
    const handleAction = useCallback((action: () => void) => (e: React.MouseEvent) => {
        e.preventDefault();
        editor?.view.focus();
        action();
    }, [editor]);

    const createAndDispatchTransaction = useCallback((rowIndex: number, colIndex: number, action: 'addRow' | 'addCol') => {
        if (!editor) return;
        const { state, view } = editor;
        const table = findParentTable(state.selection);
        if (!table) return;

        const map = TableMap.get(table.node);
        const targetRow = action === 'addRow' ? (rowIndex > 0 ? rowIndex - 1 : 0) : 0;
        const targetCol = action === 'addCol' ? (colIndex > 0 ? colIndex - 1 : 0) : 0;

        if (targetRow >= map.height || targetCol >= map.width) return;

        const cellPos = table.start + map.positionAt(targetRow, targetCol, table.node);
        const tr = state.tr.setSelection(TextSelection.create(state.doc, cellPos + 2)); // Inside cell's <p>
        view.dispatch(tr);
        
        setTimeout(() => {
            if (!editor) {
                return;
            }
            const commands = editor.commands as any;
            editor.view.focus();
            if (action === 'addRow') {
                if (rowIndex === 0) {
                    commands.addRowBefore();
                } else {
                    commands.addRowAfter();
                }
            } else {
                if (colIndex === 0) {
                    commands.addColumnBefore();
                } else {
                    commands.addColumnAfter();
                }
            }
        }, 50);
    }, [editor]);
    
    if (!editor || (rowPoints.length === 0 && colPoints.length === 0)) return null;

    return createPortal(
        <>
            {rowPoints.map((point, index) => (
                <InsertionButton
                    key={`row-${index}`}
                    top={point.top}
                    left={point.left + 4}
                    transform="translate(-150%, -50%)"
                    onClick={handleAction(() => createAndDispatchTransaction(index, 0, 'addRow'))}
                    title="Add row"
                />
            ))}
            {colPoints.map((point, index) => (
                <InsertionButton
                    key={`col-${index}`}
                    top={point.top +4}
                    left={point.left}
                    transform="translate(-50%, -150%)"
                    onClick={handleAction(() => createAndDispatchTransaction(0, index, 'addCol'))}
                    title="Add column"
                />
            ))}
        </>,
        document.body
    );
};

export default TableControls;