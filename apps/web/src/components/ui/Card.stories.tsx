import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'select', options: ['default', 'subtle'] },
  },
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h3 className="text-h3 text-text-primary mb-2">卡片标题</h3>
        <p className="text-body-sm text-text-secondary">使用 design token 的卡片容器，适合内容区块与列表。</p>
      </>
    ),
    className: 'p-card',
  },
};

export const Subtle: Story = {
  args: {
    variant: 'subtle',
    children: (
      <>
        <h3 className="text-body font-semibold text-text-primary mb-1">Subtle 变体</h3>
        <p className="text-caption text-text-secondary">无阴影、背景略透明，适合次级内容。</p>
      </>
    ),
    className: 'p-card',
  },
};
