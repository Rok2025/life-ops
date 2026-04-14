'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { growthApi } from '../api/growthApi';
import type { GrowthRecord, CreateGrowthRecordInput, UpdateGrowthRecordInput } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

interface GrowthRecordFormDialogProps {
    open: boolean;
    onClose: () => void;
    editingRecord?: GrowthRecord | null;
}

export function GrowthRecordFormDialog({ open, onClose, editingRecord }: GrowthRecordFormDialogProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editingRecord;

    const [date, setDate] = useState('');
    const [heightCm, setHeightCm] = useState('');
    const [weightKg, setWeightKg] = useState('');
    const [headCm, setHeadCm] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        queueMicrotask(() => {
            if (editingRecord) {
                setDate(editingRecord.date);
                setHeightCm(editingRecord.height_cm?.toString() ?? '');
                setWeightKg(editingRecord.weight_kg?.toString() ?? '');
                setHeadCm(editingRecord.head_cm?.toString() ?? '');
                setNotes(editingRecord.notes ?? '');
            } else {
                setDate(new Date().toISOString().slice(0, 10));
                setHeightCm('');
                setWeightKg('');
                setHeadCm('');
                setNotes('');
            }
        });
    }, [open, editingRecord]);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['youyou-growth-records'] });
        queryClient.invalidateQueries({ queryKey: ['youyou-growth-latest'] });
        queryClient.invalidateQueries({ queryKey: ['youyou-growth-stats'] });
    }, [queryClient]);

    const createMutation = useMutation({
        mutationFn: (input: CreateGrowthRecordInput) => growthApi.create(input),
        onSuccess: () => { invalidateAll(); onClose(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: UpdateGrowthRecordInput }) =>
            growthApi.update(id, updates),
        onSuccess: () => { invalidateAll(); onClose(); },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            height_cm: heightCm ? parseFloat(heightCm) : null,
            weight_kg: weightKg ? parseFloat(weightKg) : null,
            head_cm: headCm ? parseFloat(headCm) : null,
            notes: notes || null,
        };

        if (isEditing) {
            updateMutation.mutate({ id: editingRecord!.id, updates: payload });
        } else {
            createMutation.mutate({ date, ...payload });
        }
    }, [date, heightCm, weightKg, headCm, notes, isEditing, editingRecord, createMutation, updateMutation]);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEditing ? '编辑发育记录' : '新增发育记录'}
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 px-5 py-4">
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">日期 *</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            disabled={isEditing}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">身高 (cm)</label>
                            <Input
                                type="number"
                                step="0.1"
                                value={heightCm}
                                onChange={e => setHeightCm(e.target.value)}
                                placeholder="75.5"
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">体重 (kg)</label>
                            <Input
                                type="number"
                                step="0.01"
                                value={weightKg}
                                onChange={e => setWeightKg(e.target.value)}
                                placeholder="9.50"
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">头围 (cm)</label>
                            <Input
                                type="number"
                                step="0.1"
                                value={headCm}
                                onChange={e => setHeadCm(e.target.value)}
                                placeholder="46.0"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">备注</label>
                        <Input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="体检备注..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-glass-border px-5 py-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>取消</Button>
                    <Button
                        type="submit"
                        size="sm"
                        disabled={createMutation.isPending || updateMutation.isPending}
                    >
                        {isEditing ? '保存' : '新增'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
