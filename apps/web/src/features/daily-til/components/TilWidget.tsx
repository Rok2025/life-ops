'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { getLocalDateStr, formatDisplayDate, offsetDate } from '@/lib/utils/date';
import DataCalendar, { type DataCalendarHandle } from '@/components/DataCalendar';
import { tilApi } from '../api/tilApi';
import { TilItem } from './TilItem';
import { TilForm } from './TilForm';
import { useConfigItems } from '@/features/system-config/hooks/useConfigItems';
import { useTilsByDate } from '../hooks/useTilsByDate';
import type { TIL } from '../types';

interface TilWidgetProps {
    initialDate?: string;
}

export default function TilWidget({ initialDate }: TilWidgetProps) {
    const queryClient = useQueryClient();
    const calendarRef = useRef<DataCalendarHandle>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const [selectedDate, setSelectedDate] = useState(() => initialDate ?? getLocalDateStr());
    const [showAll, setShowAll] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingTil, setEditingTil] = useState<TIL | null>(null);

    const { data: tils = [], isLoading: loading } = useTilsByDate(selectedDate);
    const isToday = selectedDate === getLocalDateStr();
    const { items: categoryItems } = useConfigItems('til_category');
    const categories = categoryItems.map(i => i.label);

    const refreshDateData = useCallback((date: string) => {
        queryClient.invalidateQueries({ queryKey: ['tils', date] });
        queryClient.invalidateQueries({ queryKey: ['til-count', date] });
    }, [queryClient]);

    const changeDate = useCallback((days: number) => {
        const newDate = offsetDate(selectedDate, days);
        setSelectedDate(newDate);
    }, [selectedDate]);

    const saveMutation = useMutation({
        mutationFn: async ({ id, content, category, date }: { id?: string; content: string; category: string | null; date: string }) => {
            if (id) {
                await tilApi.update(id, { content, category, til_date: date });
            } else {
                await tilApi.create({ content, category, til_date: date });
            }
        },
        onSuccess: (_, variables) => {
            setShowForm(false);
            setEditingTil(null);
            setSelectedDate(variables.date);
            refreshDateData(variables.date);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => tilApi.delete(id),
        onSuccess: () => refreshDateData(selectedDate),
    });

    const handleEdit = useCallback((til: TIL) => {
        setEditingTil(til);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('确定删除？')) return;
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const handleSave = useCallback((content: string, category: string | null, date: string) => {
        saveMutation.mutate({ id: editingTil?.id, content, category, date });
    }, [saveMutation, editingTil]);

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingTil(null);
    }, []);

    const displayTils = showAll ? tils : tils.slice(0, 3);
    const hasMore = tils.length > 3;

    return (
        <div className="card p-card">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Lightbulb size={20} className="text-warning" />
                        TIL
                    </h2>
                    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg px-1 py-1">
                        <button onClick={() => changeDate(-1)} className="p-1 hover:bg-bg-secondary rounded" title="前一天">
                            <ChevronLeft size={16} className="text-text-secondary" />
                        </button>
                        <button
                            ref={dateBtnRef}
                            type="button"
                            onClick={() => calendarRef.current?.open()}
                            className="text-sm font-medium text-text-primary min-w-[70px] text-center px-2 py-1 hover:bg-bg-secondary rounded cursor-pointer"
                        >
                            {formatDisplayDate(selectedDate)}
                        </button>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-1 hover:bg-bg-secondary rounded"
                            disabled={isToday}
                            title="后一天"
                        >
                            <ChevronRight size={16} className={isToday ? 'text-text-secondary/30' : 'text-text-secondary'} />
                        </button>
                    </div>
                    <DataCalendar ref={calendarRef} scope="til" selectedDate={selectedDate} onSelectDate={setSelectedDate} hideTrigger externalTriggerRef={dateBtnRef} />
                    {tils.length > 0 && (
                        <span className="text-sm text-text-secondary">{tils.length} 条</span>
                    )}
                </div>
                <button
                    onClick={() => { setEditingTil(null); setShowForm(true); }}
                    className="btn-primary flex items-center gap-1 text-sm py-2"
                >
                    <Plus size={16} />
                    记录
                </button>
            </div>

            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : tils.length === 0 ? (
                <div className="text-center py-4 text-text-secondary">
                    <div className="text-2xl mb-1">💡</div>
                    <p className="text-sm">{formatDisplayDate(selectedDate)}学到了什么？</p>
                    <button
                        onClick={() => { setEditingTil(null); setShowForm(true); }}
                        className="mt-2 text-accent hover:underline text-sm"
                    >
                        记录一下 →
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        {displayTils.map((til) => (
                            <TilItem key={til.id} til={til} onEdit={handleEdit} onDelete={handleDelete} />
                        ))}
                    </div>
                    {hasMore && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full mt-3 py-2 text-sm text-accent hover:bg-bg-tertiary rounded-lg flex items-center justify-center gap-1"
                        >
                            {showAll ? (
                                <>收起 <ChevronUp size={16} /></>
                            ) : (
                                <>展开更多 ({tils.length - 3} 条) <ChevronDown size={16} /></>
                            )}
                        </button>
                    )}
                </>
            )}

            {showForm && (
                <TilForm
                    editingTil={editingTil}
                    defaultDate={selectedDate}
                    saving={saveMutation.isPending}
                    categories={categories}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}
