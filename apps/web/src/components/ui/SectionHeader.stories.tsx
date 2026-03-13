import type { Meta, StoryObj } from '@storybook/react';
import { SectionHeader } from './SectionHeader';
import { Button } from './Button';

const meta: Meta<typeof SectionHeader> = {
  component: SectionHeader,
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SectionHeader>;

export const Default: Story = {
  args: { title: '区块标题' },
};

export const WithAction: Story = {
  args: {
    title: '带操作的标题',
    right: <Button size="sm">操作</Button>,
  },
};