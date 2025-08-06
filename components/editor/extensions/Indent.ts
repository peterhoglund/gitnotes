













import { Extension } from '@tiptap/core';
import { Transaction } from 'prosemirror-state';

const clamp = (val: number, min: number, max: number): number => Math.min(Math.max(val, min), max);

function setNodeIndent(tr: Transaction, pos: number, delta: number, minIndent: number, maxIndent: number): Transaction {
  const node = tr.doc.nodeAt(pos);
  if (!node) {
    return tr;
  }

  const indent = clamp((node.attrs.indent || 0) + delta, minIndent, maxIndent);

  if (indent === node.attrs.indent) {
    return tr;
  }

  const nodeAttrs = {
    ...node.attrs,
    indent,
  };

  return tr.setNodeMarkup(pos, node.type, nodeAttrs);
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['heading', 'paragraph'],
      minIndent: 0,
      maxIndent: 7,
      indentStep: 40, // in px
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }
              return {
                style: `margin-left: ${attributes.indent * this.options.indentStep}px`,
              };
            },
            parseHTML: element => {
              const marginLeft = element.style.marginLeft;
              if (marginLeft) {
                const value = parseInt(marginLeft, 10);
                if (!isNaN(value) && this.options.indentStep > 0) {
                    return Math.round(value / this.options.indentStep);
                }
              }
              return 0;
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
             tr = setNodeIndent(tr, pos, 1, this.options.minIndent, this.options.maxIndent);
          }
        });

        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }

        return false;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        tr.doc.nodesBetween(selection.from, selection.to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            tr = setNodeIndent(tr, pos, -1, this.options.minIndent, this.options.maxIndent);
          }
        });

        if (tr.docChanged) {
          dispatch?.(tr);
          return true;
        }
        return false;
      },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      'Tab': () => {
        if (this.editor.isActive('taskItem')) {
            return this.editor.commands.sinkListItem('taskItem');
        }
        if (this.editor.isActive('listItem')) {
            return this.editor.commands.sinkListItem('listItem');
        }

        if (this.editor.isActive('codeBlock') || this.editor.isActive('table')) {
          return false;
        }
        return (this.editor.commands as any).indent();
      },
      'Shift-Tab': () => {
        if (this.editor.isActive('taskItem')) {
            return this.editor.commands.liftListItem('taskItem');
        }
        if (this.editor.isActive('listItem')) {
            return this.editor.commands.liftListItem('listItem');
        }

        if (this.editor.isActive('codeBlock') || this.editor.isActive('table')) {
          return false;
        }
        return (this.editor.commands as any).outdent();
      },
    };
  },
});