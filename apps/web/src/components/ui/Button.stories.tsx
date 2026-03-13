import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['primary', 'secondary', 'tinted', 'ghost', 'danger'] },
    size: { control: 'select', options: ['sm', 'md'] },
  },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { children: '主要操作', variant: 'primary' },
};

export const Secondary: Story = {
  args: { children: '次要操作', variant: 'secondary' },
};

export const Tinted: Story = {
  args: { children: '轻强调', variant: 'tinted' },
};

export const Ghost: Story = {
  args: { children: '幽灵按钮', variant: 'ghost' },
};

export const Danger: Story = {
  args: { children: '删除', variant: 'danger' },
};

export const Small: Story = {
  args: { children: '小号', size: 'sm' },
};

export const Disabled: Story = {
  args: { children: '已禁用', disabled: true },
};
