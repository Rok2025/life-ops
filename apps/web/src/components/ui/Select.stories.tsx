import type { Meta, StoryObj } from '@storybook/react';
import { Select } from './Select';

const meta: Meta<typeof Select> = {
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    error: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    defaultValue: 'draft',
    children: [
      <option key="draft" value="draft">草稿</option>,
      <option key="published" value="published">已发布</option>,
    ],
  },
};

export const Small: Story = {
  args: {
    size: 'sm',
    defaultValue: 'chest',
    children: [
      <option key="chest" value="chest">胸部</option>,
      <option key="back" value="back">背部</option>,
    ],
  },
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: 'draft',
    children: [
      <option key="draft" value="draft">草稿</option>,
      <option key="published" value="published">已发布</option>,
    ],
  },
};
