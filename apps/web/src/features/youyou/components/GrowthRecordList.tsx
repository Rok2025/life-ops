'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ruler, ArrowUp, ArrowDown, Minus, Plus, Trash2 } from 'lucide-react';
import { growthApi } from '../api/growthApi';
import { useGrowthRecords } from '../hooks/useGrowthRecords';
import type { GrowthRecord } from '../types';
import { Card, Button, PageHero } from '@/components/ui';
import { GrowthRecordFormDialog } from './GrowthRecordFormDialog';

/** 趋势箭头 */
function Trend({ current, previous }: { current: number | null; previous: number | null }) {
    if (current == null || previous == null) return <Minus size={12} className="text-text-tertiary" />;
    if (current > previous) return <ArrowUp size={12} className="text-success" />;
    if (current < previous) return <ArrowDown size={12} className="text-danger" />;
    return <Minus size={12} className="text-text-tertiary" />;
}

export function GrowthRecordList() {
    const { data: records = [], isLoading } = useGrowthRecords();
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<GrowthRecord | null>(null);

    const deleteMutation = useMutation({
        mutationFn: (id: string) => growthApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['youyou-growth-records'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-growth-latest'] });
            queryClient.invalidateQueries({ queryKey: ['youyou-growth-stats'] });
        },
    });

    const handleEdit = useCallback((record: GrowthRecord) => {
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
                eyebrow="又又 / 身体发育"
                icon={<Ruler size={18} />}
                title="身体发育记录"
                description="记录又又的身高、体重、头围变化"
                stats={[
                    { label: '记录次数', value: records.length, tone: 'accent' },
                ]}
                action={
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        记录
                    </Button>
                }
            />

            {records.length === 0 ? (
                <Card className="p-card text-center">
                    <p className="text-body-sm text-text-tertiary mb-3">还没有记录，开始记录又又的发育数据吧！</p>
                    <Button size="sm" onClick={() => setShowForm(true)}>
                        <Plus size={14} />
                        添加第一条记录
                    </Button>
                </Card>
            ) : (
                <Card className="p-card overflow-x-auto">
                    <table className="w-full text-body-sm">
                        <thead>
                            <tr className="border-b border-glass-border text-text-secondary">
                                <th className="text-left pb-2 pr-4 font-medium">日期</th>
                                <th className="text-right pb-2 px-3 font-medium">身高 (cm)</th>
                                <th className="text-right pb-2 px-3 font-medium">体重 (kg)</th>
                                <th className="text-right pb-2 px-3 font-medium">头围 (cm)</th>
                                <th className="text-left pb-2 px-3 font-medium">备注</th>
                                <th className="text-right pb-2 pl-3 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map((record, idx) => {
                                const prev = records[idx + 1] ?? null;
                                return (
                                    <tr key={record.id} className="border-b border-glass-border/40 last:border-0">
                                        <td className="py-2.5 pr-4 text-text-primary font-medium">
                                            {record.date}
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                {record.height_cm != null ? (
                                                    <>
                                                        <span className="text-text-primary">{record.height_cm}</span>
                                                        <Trend current={record.height_cm} previous={prev?.height_cm ?? null} />
                                                    </>
                                                ) : (
                                                    <span className="text-text-tertiary">-</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                {record.weight_kg != null ? (
                                                    <>
                                                        <span className="text-text-primary">{record.weight_kg}</span>
                                                        <Trend current={record.weight_kg} previous={prev?.weight_kg ?? null} />
                                                    </>
                                                ) : (
                                                    <span className="text-text-tertiary">-</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-right">
                                            <span className="inline-flex items-center gap-1">
                                                {record.head_cm != null ? (
                                                    <>
                                                        <span className="text-text-primary">{record.head_cm}</span>
                                                        <Trend current={record.head_cm} previous={prev?.head_cm ?? null} />
                                                    </>
                                                ) : (
                                                    <span className="text-text-tertiary">-</span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-text-secondary truncate max-w-40">
                                            {record.notes || '-'}
                                        </td>
                                        <td className="py-2.5 pl-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(record)}
                                                    className="rounded p-1 text-text-tertiary hover:text-text-primary hover:bg-bg-tertiary transition-colors"
                                                    title="编辑"
                                                >
                                                    <Ruler size={14} />
                                                </button>
                                                <button
                                                    onClick={() => deleteMutation.mutate(record.id)}
                                                    className="rounded p-1 text-text-tertiary hover:text-danger hover:bg-bg-tertiary transition-colors"
                                                    title="删除"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            <GrowthRecordFormDialog
                open={showForm}
                onClose={handleCloseForm}
                editingRecord={editing}
            />
        </div>
    );
}
