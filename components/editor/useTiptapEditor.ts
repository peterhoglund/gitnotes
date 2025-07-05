

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Strike from '@tiptap/extension-strike';
import Code from '@tiptap/extension-code';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight';

import { createLowlight } from 'lowlight';
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import python from 'highlight.js/lib/languages/python';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';

import { BlockStyles } from './extensions';

const lowlight = createLowlight();

lowlight.register({
    html: html,
    css: css,
    js: js,
    ts: ts,
    python: python,
    json: json,
    bash: bash,
});

// Register aliases
lowlight.registerAlias({
    js: ['jsx'],
    ts: ['tsx'],
    python: ['py'],
});


export const useTiptapEditor = (content: string) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3, 6],
                },
                // Disable extensions that will be configured manually
                codeBlock: false,
                strike: false,
                code: false,
            }),
            CodeBlockLowlight.configure({
                lowlight,
            }),
            Underline,
            Strike,
            Code,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'listItem'],
            }),
            TextStyle,
            Color,
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({
                placeholder: 'Start writing your masterpiece...',
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