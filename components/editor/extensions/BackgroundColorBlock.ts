
import { Node, mergeAttributes } from '@tiptap/core';
import { TextSelection } from 'prosemirror-state';

export interface BackgroundColorBlockOptions {
  HTMLAttributes: Record<string, any>;
}

// Helper to convert hex color to rgba with a given alpha.
const hexToRgba = (hex: string, alpha: number): string => {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
        return hex; // Return original color if not a valid hex string
    }
    
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        return hex;
    }

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const BackgroundColorBlock = Node.create<BackgroundColorBlockOptions>({
  name: 'backgroundColorBlock',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      color: {
        default: null,
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => {
          if (!attributes.color || attributes.color === 'transparent') {
            return {};
          }
          
          const solidColor = attributes.color;
          // Use 50% opacity for the fill color.
          const fillColor = hexToRgba(solidColor, 0.5);

          return {
            'data-color': attributes.color,
            style: `background-color: ${fillColor}; border: 1px solid ${solidColor};`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="background-color-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'background-color-block', class: 'custom-bg-block' }), 0];
  },

  addCommands() {
    return {
      setBackgroundColorBlock: (attributes) => ({ commands }) => {
        return commands.wrapIn(this.name, attributes);
      },
      toggleBackgroundColorBlock: (attributes) => ({ commands }) => {
        return commands.toggleWrap(this.name, attributes);
      },
      unsetBackgroundColorBlock: () => ({ commands }) => {
        return commands.lift(this.name);
      },
    } as any;
  },

  addKeyboardShortcuts() {
    return {
      'Enter': () => {
        const { state, commands } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty) {
          return false;
        }
        
        // Find our parent block and its position/depth
        let blockInfo = null;
        for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === this.name) {
                blockInfo = { depth: d, node: $from.node(d), pos: $from.before(d) };
                break;
            }
        }
        
        if (!blockInfo) {
            return false;
        }

        // Handle empty text block case manually to avoid splitting the container
        if ($from.parent.content.size === 0) {
            return commands.command(({ tr, dispatch }) => {
                const posAfterBlock = blockInfo.pos + blockInfo.node.nodeSize;
                const posOfEmptyNode = $from.before();

                // Delete the empty node
                tr.delete(posOfEmptyNode, posOfEmptyNode + $from.parent.nodeSize);
                
                // Insert a new paragraph after the (now smaller) block
                const insertPos = posAfterBlock - $from.parent.nodeSize;
                tr.insert(insertPos, state.schema.nodes.paragraph.create());

                // Set selection to the new paragraph
                tr.setSelection(TextSelection.create(tr.doc, insertPos + 1));
                
                if (dispatch) dispatch(tr.scrollIntoView());
                return true;
            });
        }

        // For non-empty blocks, split the node and lift the new part out.
        return this.editor.chain()
            .splitBlock({ keepMarks: false })
            .lift(this.name)
            .run();
      },
      'Backspace': () => {
        const { state, commands } = this.editor;
        const { selection } = state;
        const { $from, empty } = selection;

        if (!empty || $from.parentOffset !== 0) {
          return false;
        }

        // Case 1: Cursor is at the start of the first node INSIDE a block.
        // We want to lift the node out of the block, effectively removing the style.
        let parentBlockInfo = null;
        for (let d = $from.depth; d > 0; d--) {
          const node = $from.node(d);
          if (node.type.name === this.name) {
            parentBlockInfo = { pos: $from.before(d) };
            break;
          }
        }

        if (parentBlockInfo) {
          const currentParagraphPos = $from.before($from.depth);
          // If the paragraph's start is right after the block's opening tag, it's the first child.
          if (currentParagraphPos === parentBlockInfo.pos + 1) {
            return commands.lift(this.name);
          }
          // If it's another paragraph inside the block, let the default Backspace behavior handle it (merge with previous line).
          return false;
        }

        // Case 2: Cursor is at start of a node that is immediately AFTER a block.
        // We want to merge this node into the block.
        const currentParagraphPos = $from.before();
        if (currentParagraphPos === 0) {
            return false; // Nothing before this node.
        }
        
        const prevNodeRes = state.doc.resolve(currentParagraphPos - 1);
        const prevNode = prevNodeRes.nodeAfter;

        if (!prevNode || prevNode.type.name !== this.name) {
            return false; // The node before isn't a block.
        }
        
        // If we're here, we're right after a block. Run the custom merge command.
        return commands.command(({ tr, dispatch }) => {
            const block = prevNode;
            const blockPos = prevNodeRes.pos;
            
            // If the block is empty or just contains an empty paragraph, delete it.
            if (block.nodeSize <= 2 || (block.childCount === 1 && block.firstChild?.content.size === 0)) {
                tr.delete(blockPos, blockPos + block.nodeSize);
            } else { // Otherwise, merge the current paragraph into the last node of the block.
                const lastChildInBlock = block.lastChild;
                if (!lastChildInBlock || !lastChildInBlock.isTextblock) {
                    return false;
                }

                const currentParagraph = $from.parent;
                
                let lastChildOffset = -1;
                block.content.forEach((child, offset, index) => {
                    if (index === block.childCount - 1) {
                        lastChildOffset = offset;
                    }
                });

                if (lastChildOffset === -1) {
                    return false;
                }

                const lastChildPos = blockPos + 1 + lastChildOffset;
                const posForInsertion = lastChildPos + 1 + lastChildInBlock.content.size;
                const contentToInsert = currentParagraph.content;

                if (contentToInsert.size > 0) {
                    tr.insert(posForInsertion, contentToInsert);
                }

                const paragraphToDeletePos = $from.before();
                tr.delete(paragraphToDeletePos, paragraphToDeletePos + currentParagraph.nodeSize);

                tr.setSelection(TextSelection.create(tr.doc, posForInsertion));
            }
            
            if (dispatch) dispatch(tr.scrollIntoView());
            return true;
        });
      }
    }
  }
});
