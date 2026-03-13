import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: { control: 'select', options: ['sm', 'md'] },
    error: { control: 'boolean' },
    multiline: { control: 'boolean' },
  },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: '请输入...' },
};

export const Small: Story = {
  args: { size: 'sm', placeholder: '小号输入' },
};

export const Error: Story = {
  args: { placeholder: '错误状态', error: true },
};

export const Textarea: Story = {
  args: { multiline: true, rows: 4, placeholder: '多行文本...' },
};
