
import { useEditor, ReactNodeViewRenderer } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Heading from '@tiptap/extension-heading';
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

import { BlockStyles } from './extensions';
import CodeBlockComponent from './CodeBlockComponent';
import BlockNodeView from './BlockNodeView';

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

const CustomParagraph = Paragraph.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },
});

const CustomHeading = Heading.extend({
  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },
});


export const useTiptapEditor = (content: string) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Disable the default nodes that we are customizing
                heading: false,
                paragraph: false,
                codeBlock: false,
                link: false,
            }),
            CustomParagraph,
            CustomHeading.configure({
                levels: [1, 2, 3, 6],
            }),
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
            BlockStyles,
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