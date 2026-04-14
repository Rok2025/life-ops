'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../api/healthApi';
import type { CreateVaccinationInput } from '../types';
import { Button, Dialog, Input } from '@/components/ui';

interface VaccinationFormDialogProps {
    open: boolean;
    onClose: () => void;
}

export function VaccinationFormDialog({ open, onClose }: VaccinationFormDialogProps) {
    const queryClient = useQueryClient();

    const [vaccineName, setVaccineName] = useState('');
    const [doseNumber, setDoseNumber] = useState('1');
    const [scheduledDate, setScheduledDate] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        if (!open) return;
        queueMicrotask(() => {
            setVaccineName('');
            setDoseNumber('1');
            setScheduledDate('');
            setLocation('');
            setNotes('');
        });
    }, [open]);

    const createMutation = useMutation({
        mutationFn: (input: CreateVaccinationInput) => healthApi.createVaccination(input),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccinations'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-vaccination-stats'] });
            onClose();
        },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = vaccineName.trim();
        if (!trimmed) return;

        createMutation.mutate({
            vaccine_name: trimmed,
            dose_number: parseInt(doseNumber, 10) || 1,
            scheduled_date: scheduledDate || null,
            location: location || null,
            notes: notes || null,
        });
    }, [vaccineName, doseNumber, scheduledDate, location, notes, createMutation]);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title="添加疫苗"
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 px-5 py-4">
                    <div>
                        <label className="block text-caption text-text-secondary mb-1">疫苗名称 *</label>
                        <Input
                            type="text"
                            value={vaccineName}
                            onChange={e => setVaccineName(e.target.value)}
                            placeholder="例如：水痘疫苗"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">剂次</label>
                            <Input
                                type="number"
                                min="1"
                                value={doseNumber}
                                onChange={e => setDoseNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">计划日期</label>
                            <Input
                                type="date"
                                value={scheduledDate}
                                onChange={e => setScheduledDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">接种地点</label>
                        <Input
                            type="text"
                            value={location}
                            onChange={e => setLocation(e.target.value)}
                            placeholder="例如：社区卫生服务中心"
                        />
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">备注</label>
                        <Input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="可选备注..."
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-glass-border px-5 py-3">
                    <Button type="button" variant="ghost" size="sm" onClick={onClose}>取消</Button>
                    <Button type="submit" size="sm" disabled={createMutation.isPending}>添加</Button>
                </div>
            </form>
        </Dialog>
    );
}
