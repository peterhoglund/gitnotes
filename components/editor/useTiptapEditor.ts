


import { useEditor, ReactNodeViewRenderer } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { Underline } from '@tiptap/extension-underline';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import { Link } from '@tiptap/extension-link';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';
import { BackgroundColorBlock } from './extensions/BackgroundColorBlock';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { CellSelection } from 'prosemirror-tables';

// Explicitly import extensions from StarterKit
import { Blockquote } from '@tiptap/extension-blockquote';
import { Bold } from '@tiptap/extension-bold';
import { BulletList } from '@tiptap/extension-bullet-list';
import { Code } from '@tiptap/extension-code';
import { Document } from '@tiptap/extension-document';
import { Dropcursor } from '@tiptap/extension-dropcursor';
import { Gapcursor } from '@tiptap/extension-gapcursor';
import { HardBreak } from '@tiptap/extension-hard-break';
import { Heading } from '@tiptap/extension-heading';
import { History } from '@tiptap/extension-history';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { Italic } from '@tiptap/extension-italic';
import { ListItem } from '@tiptap/extension-list-item';
import { OrderedList } from '@tiptap/extension-ordered-list';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Strike } from '@tiptap/extension-strike';
import { Text } from '@tiptap/extension-text';
import { Focus } from '@tiptap/extension-focus';


import { createLowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import py from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import php from 'highlight.js/lib/languages/php';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import swift from 'highlight.js/lib/languages/swift';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import bash from 'highlight.js/lib/languages/bash';
import text from 'highlight.js/lib/languages/plaintext';

import CodeBlockComponent from './CodeBlockComponent';

// Tiptap command augmentation is now handled in `types/tiptap.d.ts`
const lowlight = createLowlight();

lowlight.register({
  js,
  ts,
  py,
  html,
  css,
  sql,
  php,
  java,
  csharp,
  swift,
  cpp,
  c,
  go,
  rust,
  bash,
  text,
});

// Register aliases
lowlight.registerAlias({
    js: ['jsx'],
    ts: ['tsx'],
    html: ['xml'],
    bash: ['sh', 'shell'],
    csharp: ['cs'],
    cpp: ['c++'],
});

const CustomCodeBlock = CodeBlockLowlight.extend({
    addNodeView() {
        return ReactNodeViewRenderer(CodeBlockComponent);
    },
});

const CustomTableRow = TableRow.extend({
  // This extension is kept for consistency in the schema, but it no longer adds custom attributes.
  // Row background color is now handled at the cell level.
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      backgroundColor: {
        default: null,
        parseHTML: element => element.style.backgroundColor || null,
        renderHTML: attributes => {
          if (attributes.backgroundColor) {
            return { style: `background-color: ${attributes.backgroundColor}` };
          }
          return {};
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            backgroundColor: {
                default: null,
                parseHTML: element => element.style.backgroundColor || null,
                renderHTML: attributes => {
                    if (attributes.backgroundColor) {
                        return { style: `background-color: ${attributes.backgroundColor}` };
                    }
                    return {};
                },
            },
        };
    }
});

const CustomTable = Table.extend({
    addCommands() {
        return {
            ...this.parent?.(),
            setRowBackgroundColor: (color: string | null) => ({ state, dispatch }) => {
                const { selection } = state;
                if (!(selection instanceof CellSelection) || !selection.isRowSelection()) {
                  return false;
                }
        
                let tr = state.tr;
                selection.forEachCell((cell, pos) => {
                  tr = tr.setNodeMarkup(pos, undefined, { ...cell.attrs, backgroundColor: color });
                });
        
                if (tr.docChanged && dispatch) {
                  dispatch(tr);
                  return true;
                }
                return false;
            },
            setColumnBackgroundColor: (color: string | null) => ({ state, dispatch }) => {
                const { selection } = state;
                if (!(selection instanceof CellSelection) || !selection.isColSelection()) {
                  return false;
                }
        
                let tr = state.tr;
                selection.forEachCell((cell, pos) => {
                  tr = tr.setNodeMarkup(pos, undefined, { ...cell.attrs, backgroundColor: color });
                });
        
                if (tr.docChanged && dispatch) {
                  dispatch(tr);
                  return true;
                }
                return false;
            },
        };
    }
});


export const useTiptapEditor = (content: string) => {
    const editor = useEditor({
        extensions: [
            // Manually add extensions from StarterKit to fix type issues
            Blockquote,
            Bold,
            BulletList,
            Code,
            Document,
            Dropcursor,
            Gapcursor,
            HardBreak,
            Heading.configure({
                levels: [1, 2, 3, 6],
            }),
            History,
            HorizontalRule,
            Italic,
            ListItem,
            OrderedList,
            Paragraph,
            Strike,
            Text,
            Focus.configure({
                className: 'has-focus',
            }),

            // Other extensions
            CustomCodeBlock.configure({
                lowlight,
            }),
            Link.configure({
                openOnClick: false, // Set to false to allow editing via bubble menu
                autolink: true,     // Automatically detect and create links
                HTMLAttributes: {
                    rel: 'noopener noreferrer nofollow',
                    target: '_blank',
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'listItem'],
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({
                placeholder: 'Write something',
            }),
            TaskList,
            TaskItem.configure({
              nested: true,
            }),
            BubbleMenuExtension,
            BackgroundColorBlock,
            
            // Table extensions
            CustomTable.configure({
                resizable: true,
                lastColumnResizable: false,
            }),
            CustomTableRow,
            CustomTableHeader,
            CustomTableCell,
        ],
        content: content,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none h-full w-full focus:outline-none p-4',
            },
        },
    });

    return editor;
};