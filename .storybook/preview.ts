import type { Preview } from '@storybook/react';
import '../src/index.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'night-sky',
      values: [
        { name: 'night-sky', value: '#050b11' },
        { name: 'dawn', value: '#2c2f3b' },
      ],
    },
    layout: 'centered',
  },
};

export default preview;
