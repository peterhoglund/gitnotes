
import { Extension } from '@tiptap/core';
import { TRANSPARENT } from '../../utils/constants';

type BlockStyleOptions = {
  types: string[];
};

export const BlockStyles = Extension.create<BlockStyleOptions>({
  name: 'blockStyles',

  addOptions() {
    return {
      types: ['heading', 'paragraph', 'listItem'],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          backgroundColor: {
            default: null,
            parseHTML: element => element.style.backgroundColor || null,
            renderHTML: attributes => {
              if (attributes.backgroundColor && attributes.backgroundColor !== TRANSPARENT) {
                return {
                  style: `background-color: ${attributes.backgroundColor}`,
                  class: attributes.emoji ? 'custom-bg-block has-emoji' : 'custom-bg-block',
                };
              }
              return {};
            },
          },
          emoji: {
            default: null,
            parseHTML: element => element.getAttribute('data-emoji'),
            renderHTML: attributes => {
              if (attributes.emoji) {
                return {
                  'data-emoji': attributes.emoji,
                   class: attributes.backgroundColor && attributes.backgroundColor !== TRANSPARENT ? 'custom-bg-block has-emoji' : 'has-emoji',
                };
              }
              return {};
            },
          },
        },
      },
    ];
  },
});
