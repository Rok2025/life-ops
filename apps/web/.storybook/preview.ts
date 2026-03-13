import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: { matchers: /^on[A-Z]|variant|size/ },
  },
};

export default preview;
