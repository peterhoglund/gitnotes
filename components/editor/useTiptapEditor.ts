import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';
import Link from '@tiptap/extension-link';

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


export const useTiptapEditor = (content: string) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 6],
                },
                // Disable the default CodeBlock and Link to use our custom configs.
                codeBlock: false,
                link: false,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Link.configure({
                openOnClick: false, // Don't open link on click, show bubble menu instead
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