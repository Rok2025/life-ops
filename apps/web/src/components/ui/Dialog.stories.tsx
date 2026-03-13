import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    maxWidth: { control: 'select', options: ['sm', 'md', 'lg', 'xl', '2xl'] },
  },
};

export default meta;

type Story = StoryObj<typeof Dialog>;

function DialogDemo({ open: openArg, ...props }: Partial<React.ComponentProps<typeof Dialog>>) {
  const [open, setOpen] = useState(!!openArg);
  return (
    <>
      <Button onClick={() => setOpen(true)}>打开弹窗</Button>
      <Dialog open={open} onClose={() => setOpen(false)} {...props}>
        <div className="p-5">
          <p className="text-body-sm text-text-secondary">弹窗内容区域，ESC 或点击遮罩关闭。</p>
        </div>
      </Dialog>
    </>
  );
}

export const WithTitle: Story = {
  render: () => (
    <DialogDemo open={false} title="示例弹窗">
      <div className="p-5">
        <p className="text-body-sm text-text-secondary">带标题的弹窗。</p>
      </div>
    </DialogDemo>
  ),
};

export const SmallWidth: Story = {
  render: () => (
    <DialogDemo open={false} title="小宽度" maxWidth="sm">
      <div className="p-5 text-body-sm text-text-secondary">maxWidth=sm</div>
    </DialogDemo>
  ),
};