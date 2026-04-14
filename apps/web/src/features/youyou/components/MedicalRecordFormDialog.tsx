'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../api/healthApi';
import { MEDICAL_RECORD_TYPE_CONFIG } from '../types';
import type { MedicalRecord, MedicalRecordType, CreateMedicalRecordInput, UpdateMedicalRecordInput } from '../types';
import { Button, Dialog, Input, Select } from '@/components/ui';

interface MedicalRecordFormDialogProps {
    open: boolean;
    onClose: () => void;
    editingRecord?: MedicalRecord | null;
}

export function MedicalRecordFormDialog({ open, onClose, editingRecord }: MedicalRecordFormDialogProps) {
    const queryClient = useQueryClient();
    const isEditing = !!editingRecord;

    const [date, setDate] = useState('');
    const [type, setType] = useState<MedicalRecordType>('checkup');
    const [title, setTitle] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [diagnosis, setDiagnosis] = useState('');
    const [treatment, setTreatment] = useState('');
    const [hospital, setHospital] = useState('');
    const [doctor, setDoctor] = useState('');
    const [notes, setNotes] = useState('');

    useEffect(() => {
        queueMicrotask(() => {
            if (editingRecord) {
                setDate(editingRecord.date);
                setType(editingRecord.type);
                setTitle(editingRecord.title);
                setSymptoms(editingRecord.symptoms ?? '');
                setDiagnosis(editingRecord.diagnosis ?? '');
                setTreatment(editingRecord.treatment ?? '');
                setHospital(editingRecord.hospital ?? '');
                setDoctor(editingRecord.doctor ?? '');
                setNotes(editingRecord.notes ?? '');
            } else {
                setDate(new Date().toISOString().slice(0, 10));
                setType('checkup');
                setTitle('');
                setSymptoms('');
                setDiagnosis('');
                setTreatment('');
                setHospital('');
                setDoctor('');
                setNotes('');
            }
        });
    }, [open, editingRecord]);

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['youyou-medical-records'] });
        queryClient.invalidateQueries({ queryKey: ['youyou-medical-stats'] });
    }, [queryClient]);

    const createMutation = useMutation({
        mutationFn: (input: CreateMedicalRecordInput) => healthApi.createMedicalRecord(input),
        onSuccess: () => { invalidateAll(); onClose(); },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: UpdateMedicalRecordInput }) =>
            healthApi.updateMedicalRecord(id, updates),
        onSuccess: () => { invalidateAll(); onClose(); },
    });

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (!trimmedTitle) return;

        const payload = {
            type,
            title: trimmedTitle,
            symptoms: symptoms || null,
            diagnosis: diagnosis || null,
            treatment: treatment || null,
            hospital: hospital || null,
            doctor: doctor || null,
            notes: notes || null,
        };

        if (isEditing) {
            updateMutation.mutate({ id: editingRecord!.id, updates: payload });
        } else {
            createMutation.mutate({ date, ...payload });
        }
    }, [date, type, title, symptoms, diagnosis, treatment, hospital, doctor, notes, isEditing, editingRecord, createMutation, updateMutation]);

    if (!open) return null;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={isEditing ? '编辑就医记录' : '新增就医记录'}
            maxWidth="lg"
            bodyClassName="flex min-h-0 flex-1 flex-col"
        >
            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="space-y-4 px-5 py-4">
                    <div className="grid grid-cols-2 gap-3">
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
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">类型</label>
                            <Select
                                value={type}
                                onChange={e => setType(e.target.value as MedicalRecordType)}
                            >
                                {(Object.keys(MEDICAL_RECORD_TYPE_CONFIG) as MedicalRecordType[]).map(t => (
                                    <option key={t} value={t}>
                                        {MEDICAL_RECORD_TYPE_CONFIG[t].emoji} {MEDICAL_RECORD_TYPE_CONFIG[t].label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">标题 *</label>
                        <Input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="例如：12月龄体检"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">症状</label>
                        <Input
                            type="text"
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            placeholder="主要症状描述..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">诊断</label>
                            <Input
                                type="text"
                                value={diagnosis}
                                onChange={e => setDiagnosis(e.target.value)}
                                placeholder="诊断结果..."
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">治疗方案</label>
                            <Input
                                type="text"
                                value={treatment}
                                onChange={e => setTreatment(e.target.value)}
                                placeholder="治疗方案..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">医院</label>
                            <Input
                                type="text"
                                value={hospital}
                                onChange={e => setHospital(e.target.value)}
                                placeholder="就诊医院..."
                            />
                        </div>
                        <div>
                            <label className="block text-caption text-text-secondary mb-1">医生</label>
                            <Input
                                type="text"
                                value={doctor}
                                onChange={e => setDoctor(e.target.value)}
                                placeholder="主治医生..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-caption text-text-secondary mb-1">备注</label>
                        <Input
                            type="text"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="其他备注..."
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
