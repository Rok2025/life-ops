import { Dialog, Input, Select, Button } from '@/components/ui';

interface AddExerciseDialogProps {
    open: boolean;
    onClose: () => void;
    allCatValues: string[];
    categoryLabels: Record<string, string>;
    effectiveCategory: string;
    onCategoryChange: (cat: string) => void;
    newName: string;
    onNameChange: (name: string) => void;
    onSubmit: () => void;
    saving: boolean;
}

export function AddExerciseDialog({
    open,
    onClose,
    allCatValues,
    categoryLabels,
    effectiveCategory,
    onCategoryChange,
    newName,
    onNameChange,
    onSubmit,
    saving,
}: AddExerciseDialogProps) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="添加新动作"
            maxWidth="md"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    onSubmit();
                }}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="space-y-4 px-5 py-4">
                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">部位</label>
                        <Select
                            value={effectiveCategory}
                            onChange={e => onCategoryChange(e.target.value)}
                        >
                            {allCatValues.map(cat => (
                                <option key={cat} value={cat}>{categoryLabels[cat] || cat}</option>
                            ))}
                        </Select>
                    </div>
                    <div>
                        <label className="mb-1 block text-caption text-text-secondary">动作名称</label>
                        <Input
                            type="text"
                            value={newName}
                            onChange={e => onNameChange(e.target.value)}
                            placeholder="请输入动作名称"
                            autoFocus
                        />
                    </div>
                </div>
                <div className="flex gap-3 border-t border-border bg-bg-primary px-5 py-3">
                    <Button type="button" onClick={onClose} variant="ghost">
                        取消
                    </Button>
                    <Button type="submit" disabled={!newName.trim() || saving}>
                        {saving ? '保存中...' : '确定添加'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
