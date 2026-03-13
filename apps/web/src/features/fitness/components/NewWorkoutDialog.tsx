'use client';

import NewWorkoutForm from './NewWorkoutForm';
import { Dialog } from '@/components/ui';

interface NewWorkoutDialogProps {
    open: boolean;
    onClose: () => void;
}

export function NewWorkoutDialog({ open, onClose }: NewWorkoutDialogProps) {
    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="添加训练记录"
            maxWidth="2xl"
            bodyClassName="px-5 py-3"
        >
            <NewWorkoutForm onSaved={onClose} />
        </Dialog>
    );
}
