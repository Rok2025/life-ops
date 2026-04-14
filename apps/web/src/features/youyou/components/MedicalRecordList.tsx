'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Stethoscope, Plus, Trash2, Pencil } from 'lucide-react';
import { healthApi } from '../api/healthApi';
import { useMedicalRecords } from '../hooks/useHealth';
import { MEDICAL_RECORD_TYPE_CONFIG } from '../types';
import type { MedicalRecord, MedicalRecordType } from '../types';
import { Card, Button, Badge, PageHero, ChipGroup } from '@/components/ui';
import { MedicalRecordFormDialog } from './MedicalRecordFormDialog';

const TYPE_FILTER_OPTIONS = [
    { value: 'all' as const, label: '全部' },
    ...Object.entries(MEDICAL_RECORD_TYPE_CONFIG).map(([k, v]) => ({
        value: k as MedicalRecordType,
        label: `${v.emoji} ${v.label}`,
    })),
];

export function MedicalRecordList() {
    const [typeFilter, setTypeFilter] = useState<MedicalRecordType | 'all'>('all');
    const { data: records = [], isLoading } = useMedicalRecords(
        typeFilter === 'all' ? undefined : typeFilter,
    );
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<MedicalRecord | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => healthApi.deleteMedicalRecord(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-medical-records'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-medical-stats'] });
        },
    });

    const handleEdit = useCallback((record: MedicalRecord) => {
        setEditing(record);
        setShowForm(true);
    }, []);

    const handleCloseForm = useCallback(() => {
        setShowForm(false);
        setEditing(null);
    }, []);

    if (isLoading) return <div className="p-8 text-center text-text-tertiary">加载中...</div>;

    return (
        <div className="space-y-4 xl:space-y-5">
            <PageHero
                eyebrow="又又 / 健康管理"
                icon={<Stethoscope size={18} />}
                title="就医记录"
                description="记录又又的体检、就医、过敏等健康信息"
                stats={[
                    { label: '总记录', value: records.length, tone: 'accent' },
                ]}
                actions={
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        新增记录
                    </Button>
                }
            />

            <ChipGroup
                label="类型筛选"
                value={typeFilter}
                options={TYPE_FILTER_OPTIONS}
                onChange={setTypeFilter}
            />

            {records.length === 0 ? (
                <Card className="p-card text-center">
                    <p className="text-body-sm text-text-tertiary mb-3">
                        {typeFilter === 'all' ? '还没有就医记录' : '该类型下暂无记录'}
                    </p>
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        添加记录
                    </Button>
                </Card>
            ) : (
                <div className="space-y-3">
                    {records.map(record => {
                        const cfg = MEDICAL_RECORD_TYPE_CONFIG[record.type];
                        return (
                            <Card key={record.id} className="p-card">
                                <div className="flex items-start gap-3">
                                    <span className="text-xl shrink-0 mt-0.5">{cfg.emoji}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-body font-semibold text-text-primary">
                                                {record.title}
                                            </span>
                                            <Badge tone={cfg.color.includes('blue') ? 'accent' : cfg.color.includes('warning') ? 'warning' : cfg.color.includes('danger') ? 'danger' : 'muted'} size="sm">
                                                {cfg.label}
                                            </Badge>
                                            <span className="text-caption text-text-tertiary ml-auto shrink-0">
                                                {record.date}
                                            </span>
                                        </div>

                                        {record.symptoms && (
                                            <p className="text-body-sm text-text-secondary">
                                                <span className="text-text-tertiary">症状:</span> {record.symptoms}
                                            </p>
                                        )}
                                        {record.diagnosis && (
                                            <p className="text-body-sm text-text-secondary">
                                                <span className="text-text-tertiary">诊断:</span> {record.diagnosis}
                                            </p>
                                        )}
                                        {record.treatment && (
                                            <p className="text-body-sm text-text-secondary">
                                                <span className="text-text-tertiary">治疗:</span> {record.treatment}
                                            </p>
                                        )}
                                        {(record.hospital || record.doctor) && (
                                            <p className="text-caption text-text-tertiary mt-1">
                                                {record.hospital}{record.hospital && record.doctor && ' · '}{record.doctor}
                                            </p>
                                        )}
                                        {record.notes && (
                                            <p className="text-caption text-text-tertiary mt-1">{record.notes}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <button
                                            onClick={() => handleEdit(record)}
                                            className="rounded p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                            title="编辑"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => deleteMutation.mutate(record.id)}
                                            className="rounded p-1 text-text-tertiary hover:text-danger hover:bg-bg-tertiary transition-colors"
                                            title="删除"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            <MedicalRecordFormDialog
                open={showForm}
                onClose={handleCloseForm}
                editingRecord={editing}
            />
        </div>
    );
}
