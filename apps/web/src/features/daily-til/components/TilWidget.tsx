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
import { Button, Card } from '@/components/ui';

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
        <Card className="p-card">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-3">
                    <h2 className="text-h3 font-semibold text-text-primary flex items-center gap-2">
                        <Lightbulb size={20} className="text-warning" />
                        TIL
                    </h2>
                    <div className="glass-segmented">
                        <button onClick={() => changeDate(-1)} className="glass-segment-button h-8 w-8 p-0" title="前一天">
                            <ChevronLeft size={16} className="text-text-secondary" />
                        </button>
                        <button
                            ref={dateBtnRef}
                            type="button"
                            onClick={() => calendarRef.current?.open()}
                            className="glass-segment-button min-w-[82px] px-2 text-body-sm font-medium text-text-primary"
                        >
                            {formatDisplayDate(selectedDate)}
                        </button>
                        <button
                            onClick={() => changeDate(1)}
                            className="glass-segment-button h-8 w-8 p-0"
                            disabled={isToday}
                            title="后一天"
                        >
                            <ChevronRight size={16} className={isToday ? 'text-text-secondary/30' : 'text-text-secondary'} />
                        </button>
                    </div>
                    <DataCalendar ref={calendarRef} scope="til" selectedDate={selectedDate} onSelectDate={setSelectedDate} hideTrigger externalTriggerRef={dateBtnRef} />
                    {tils.length > 0 && (
                        <span className="glass-mini-chip text-body-sm">{tils.length} 条</span>
                    )}
                </div>
                <Button onClick={() => { setEditingTil(null); setShowForm(true); }} variant="tinted" size="sm" className="gap-1">
                    <Plus size={16} />
                    记录
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : tils.length === 0 ? (
                <div className="text-center py-4 text-text-secondary">
                    <div className="text-h2 mb-1">💡</div>
                    <p className="text-body-sm">{formatDisplayDate(selectedDate)}学到了什么？</p>
                    <button
                        onClick={() => { setEditingTil(null); setShowForm(true); }}
                        className="mt-3 inline-flex items-center rounded-control border border-glass-border bg-panel-bg px-3 py-1.5 text-body-sm text-accent backdrop-blur-xl transition-colors duration-normal ease-standard hover:bg-card-bg"
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
                            className="mt-3 flex w-full items-center justify-center gap-1 rounded-control border border-transparent py-2 text-body-sm text-accent transition-colors duration-normal ease-standard hover:border-glass-border hover:bg-panel-bg"
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
        </Card>
    );
}
