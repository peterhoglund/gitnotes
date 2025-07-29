


import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/core';
import ColorPicker from '../ColorPicker';
import { useTiptapEditor } from './useTiptapEditor';
import { CellSelection, TableMap } from 'prosemirror-tables';
import { Selection } from 'prosemirror-state';
import { TRANSPARENT } from '../../utils/constants';

import {
  FillDripIcon,
  TableIcon,
  TableRemoveIcon,
  TableTrashIcon,
  ChevronRightIcon,
} from '../icons';

interface TableMenuProps {
  editor: NonNullable<ReturnType<typeof useTiptapEditor>>;
}

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

const MenuItem: React.FC<{
    onClick: () => void;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
    isDanger?: boolean;
}> = ({ onClick, disabled, title, children, isDanger = false }) => {
    const dangerClasses = 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/50';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`flex items-center gap-x-3 w-full text-left px-3 py-1.5 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed ${isDanger ? dangerClasses : ''}`}
        >
            {children}
        </button>
    );
};

const MenuSeparator: React.FC = () => <div className="border-t border-gray-200 dark:border-zinc-700 my-1 -mx-1.5" />;


const TableMenu: React.FC<TableMenuProps> = ({ editor }) => {
  if (!editor) return null;

  const [selection, setSelection] = useState(editor.state.selection);

  useEffect(() => {
    const handleUpdate = ({ editor: currentEditor }: { editor: Editor }) => {
      setSelection(currentEditor.state.selection);
    };

    editor.on('transaction', handleUpdate);

    return () => {
      editor.off('transaction', handleUpdate);
    };
  }, [editor]);

  const isCellSelection = selection instanceof CellSelection;
  const isRowSelection = isCellSelection && selection.isRowSelection();
  const isColSelection = isCellSelection && selection.isColSelection();

  const getReferenceClientRect = useCallback(() => {
    if (!(selection instanceof CellSelection)) return null;

    const { view } = editor;
    const table = findParentTable(selection);
    if (!table) return null;

    const map = TableMap.get(table.node);

    if (isRowSelection) {
        const tableNodeDom = view.nodeDOM(table.start) as HTMLElement | null;
        if (!tableNodeDom) return null;
        const tableElement = tableNodeDom.querySelector('table');
        if (!tableElement) return null;
        
        const { $anchorCell } = selection as CellSelection;
        const cellPosInTable = $anchorCell.pos - table.start - 1;
        const { top: rowIndex } = map.findCell(cellPosInTable);
        
        if (rowIndex >= tableElement.rows.length) return null;

        const rowElement = tableElement.rows[rowIndex];
        const rowRect = rowElement.getBoundingClientRect();
        const tableRect = tableElement.getBoundingClientRect();

        const handleCenterX = tableRect.left;
        const handleCenterY = rowRect.top + rowRect.height / 2;
        
        const handleLeft = handleCenterX - 5;
        const handleWidth = 10;
        
        return new DOMRect(handleLeft + handleWidth, handleCenterY, 0, 0);
    }

    if (isColSelection) {
        const { $headCell } = selection as CellSelection;
        const cellPosInTable = $headCell.pos - table.start - 1;
        const { left: colIndex } = map.findCell(cellPosInTable);
        
        const firstCellInColPos = map.positionAt(0, colIndex, table.node);
        const absolutePos = table.start + 1 + firstCellInColPos;

        const { node: domNode } = view.domAtPos(absolutePos);
        const containerNode = domNode.nodeType === 3 ? domNode.parentNode : domNode;
        if (!containerNode || !(containerNode instanceof HTMLElement)) {
            return null;
        }
        
        const cellElement = containerNode.closest('td, th');
        if (!cellElement) return null;

        const cellRect = cellElement.getBoundingClientRect();
        
        return new DOMRect(cellRect.right, cellRect.top, 0, 0);
    }
    
    return null;
  }, [editor, selection, isRowSelection, isColSelection]);

  const showSideMenu = isRowSelection || isColSelection;

  const isFirstRowSelected = useMemo(() => {
    if (!isRowSelection) return false;
    const table = findParentTable(selection);
    if (!table) return false;
    const map = TableMap.get(table.node);
    const { $anchorCell, $headCell } = selection as CellSelection;
    const anchorRect = map.findCell($anchorCell.pos - table.start - 1);
    const headRect = map.findCell($headCell.pos - table.start - 1);
    const firstSelectedRow = Math.min(anchorRect.top, headRect.top);
    return firstSelectedRow === 0;
  }, [selection, isRowSelection]);

  const currentRowBgColor = useMemo(() => {
    if (!isRowSelection) return TRANSPARENT;
    const { $anchorCell } = selection as CellSelection;
    const cellNode = $anchorCell.node(-1); // Get the cell node
    return cellNode?.attrs.backgroundColor || TRANSPARENT;
  }, [selection, isRowSelection]);

  const currentColBgColor = useMemo(() => {
    if (!isColSelection) return TRANSPARENT;
    const { $anchorCell } = selection as CellSelection;
    const cellNode = $anchorCell.node(-1); // -1 is cell
    return cellNode?.attrs.backgroundColor || TRANSPARENT;
  }, [selection, isColSelection]);

  const handleRowBgColorChange = useCallback((color: string) => {
    const newColor = color === TRANSPARENT ? null : color;
    (editor.chain().focus() as any).setRowBackgroundColor(newColor).run();
  }, [editor]);

  const handleColBgColorChange = useCallback((color: string) => {
    const newColor = color === TRANSPARENT ? null : color;
    (editor.chain().focus() as any).setColumnBackgroundColor(newColor).run();
  }, [editor]);

  const hasColorActions = isRowSelection || isColSelection;
  const hasHeaderAction = isFirstRowSelected;

  return (
    <BubbleMenu
      editor={editor}
      tippyProps={{
        duration: 100,
        getReferenceClientRect,
        placement: showSideMenu ? 'right-start' : 'top',
        offset: showSideMenu ? [0, 8] : [0, 10],
      }}
      shouldShow={({ state }) => state.selection instanceof CellSelection}
      className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 p-1.5 flex flex-col items-stretch gap-y-0.5 w-56"
    >
      {isRowSelection ? (
        <MenuItem onClick={() => (editor.chain().focus() as any).deleteRow().run()} disabled={!(editor.can() as any).deleteRow()} title="Delete row">
            <span className="w-5 h-5 flex items-center justify-center"><TableTrashIcon /></span>
            <span>Delete Row</span>
        </MenuItem>
      ) : isColSelection ? (
        <MenuItem onClick={() => (editor.chain().focus() as any).deleteColumn().run()} disabled={!(editor.can() as any).deleteColumn()} title="Delete column">
            <span className="w-5 h-5 flex items-center justify-center"><TableTrashIcon /></span>
            <span>Delete Column</span>
        </MenuItem>
      ) : (
        <>
            <MenuItem onClick={() => (editor.chain().focus() as any).deleteRow().run()} disabled={!(editor.can() as any).deleteRow()} title="Delete row">
                <span className="w-5 h-5 flex items-center justify-center"><TableTrashIcon /></span>
                <span>Delete Row</span>
            </MenuItem>
            <MenuItem onClick={() => (editor.chain().focus() as any).deleteColumn().run()} disabled={!(editor.can() as any).deleteColumn()} title="Delete column">
                <span className="w-5 h-5 flex items-center justify-center"><TableTrashIcon /></span>
                <span>Delete Column</span>
            </MenuItem>
        </>
      )}

      {(hasHeaderAction || hasColorActions) && <MenuSeparator />}

      {hasHeaderAction && (
        <MenuItem onClick={() => (editor.chain().focus() as any).toggleHeaderRow().run()} disabled={!(editor.can() as any).toggleHeaderRow()} title="Toggle header row">
            <span className="w-5 h-5 flex items-center justify-center"><TableIcon /></span>
            <span>Toggle Header Row</span>
        </MenuItem>
      )}

      {isRowSelection && (
        <ColorPicker
            onSelect={handleRowBgColorChange}
            currentColor={currentRowBgColor}
            title="Row Background Color"
            noColorLabel="No Background"
            triggerWrapperClassName="px-3 py-1.5 w-full justify-start hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
            <div className="flex items-center gap-x-3 w-full">
                <span className="w-5 h-5 flex items-center justify-center"><FillDripIcon /></span>
                <span className="flex-1">Row Background</span>
                <span className="ml-auto text-gray-400 dark:text-gray-500"><ChevronRightIcon /></span>
            </div>
        </ColorPicker>
      )}
      {isColSelection && (
        <ColorPicker
            onSelect={handleColBgColorChange}
            currentColor={currentColBgColor}
            title="Column Background Color"
            noColorLabel="No Background"
            triggerWrapperClassName="px-3 py-1.5 w-full justify-start hover:bg-gray-100 dark:hover:bg-zinc-700"
        >
            <div className="flex items-center gap-x-3 w-full">
                <span className="w-5 h-5 flex items-center justify-center"><FillDripIcon /></span>
                <span className="flex-1">Column Background</span>
                <span className="ml-auto text-gray-400 dark:text-gray-500"><ChevronRightIcon /></span>
            </div>
        </ColorPicker>
      )}

      <MenuSeparator />
      
      <MenuItem onClick={() => (editor.chain().focus() as any).deleteTable().run()} disabled={!(editor.can() as any).deleteTable()} title="Delete table" isDanger>
        <span className="w-5 h-5 flex items-center justify-center"><TableRemoveIcon /></span>
        <span>Delete Table</span>
      </MenuItem>
    </BubbleMenu>
  );
};

export default TableMenu;