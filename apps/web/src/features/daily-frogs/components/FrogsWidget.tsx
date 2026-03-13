'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalDateStr, formatDisplayDate, offsetDate } from '@/lib/utils/date';
import DataCalendar, { type DataCalendarHandle } from '@/components/DataCalendar';
import { frogsApi } from '../api/frogsApi';
import { FrogItem } from './FrogItem';
import { FrogForm } from './FrogForm';
import { useFrogsByDate } from '../hooks/useFrogsByDate';
import type { Frog } from '../types';
import { Button, Card } from '@/components/ui';

interface FrogsWidgetProps {
    initialDate?: string;
}

export default function FrogsWidget({ initialDate }: FrogsWidgetProps) {
    const queryClient = useQueryClient();
    const calendarRef = useRef<DataCalendarHandle>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const [selectedDate, setSelectedDate] = useState(() => initialDate ?? getLocalDateStr());
    const [showForm, setShowForm] = useState(false);
    const [editingFrog, setEditingFrog] = useState<Frog | null>(null);

    const { data: frogs = [], isLoading: loading } = useFrogsByDate(selectedDate);
    const isToday = selectedDate === getLocalDateStr();

    const refreshDateData = useCallback((date: string) => {
        queryClient.invalidateQueries({ queryKey: ['frogs', date] });
        queryClient.invalidateQueries({ queryKey: ['frogs-stats', date] });
    }, [queryClient]);

    const changeDate = useCallback((days: number) => {
        const newDate = offsetDate(selectedDate, days);
        setSelectedDate(newDate);
    }, [selectedDate]);

    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            frogsApi.toggleComplete(id, completed),
        onSuccess: () => refreshDateData(selectedDate),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => frogsApi.delete(id),
        onSuccess: () => refreshDateData(selectedDate),
    });

    const saveMutation = useMutation({
        mutationFn: async ({ id, title, date }: { id?: string; title: string; date: string }) => {
            if (id) {
                await frogsApi.update(id, { title, frog_date: date });
            } else {
                await frogsApi.create({ title, frog_date: date });
            }
        },
        onSuccess: (_, variables) => {
            setShowForm(false);
            setEditingFrog(null);
            setSelectedDate(variables.date);
            refreshDateData(variables.date);
        },
    });

    const handleToggle = useCallback((frog: Frog) => {
        toggleMutation.mutate({ id: frog.id, completed: !frog.is_completed });
    }, [toggleMutation]);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('确定删除？')) return;
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const handleEdit = useCallback((frog: Frog) => {
        setEditingFrog(frog);
        setShowForm(true);
    }, []);

    const handleAdd = useCallback(() => {
        if (frogs.length >= 3) {
            alert('每天最多三只青蛙');
            return;
        }
        setEditingFrog(null);
        setShowForm(true);
    }, [frogs.length]);

    const handleSave = useCallback((title: string, date: string) => {
        saveMutation.mutate({ id: editingFrog?.id, title, date });
    }, [saveMutation, editingFrog]);

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingFrog(null);
    }, []);

    const completedCount = frogs.filter(f => f.is_completed).length;

    return (
        <Card className="p-card">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-3">
                    <h2 className="text-h3 font-semibold text-text-primary">🐸 三只青蛙</h2>
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
                    <DataCalendar ref={calendarRef} scope="frogs" selectedDate={selectedDate} onSelectDate={setSelectedDate} hideTrigger externalTriggerRef={dateBtnRef} />
                    {frogs.length > 0 && (
                        <span className="glass-mini-chip text-body-sm">
                            {completedCount}/{frogs.length} 完成
                        </span>
                    )}
                </div>
                {frogs.length < 3 && (
                    <Button onClick={handleAdd} variant="tinted" size="sm" className="gap-1">
                        <Plus size={16} />
                        添加
                    </Button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : frogs.length === 0 ? (
                <div className="text-center py-4 text-text-secondary">
                    <div className="text-h2 mb-1">🐸</div>
                    <p className="text-body-sm">{formatDisplayDate(selectedDate)}还没有青蛙</p>
                    <button onClick={handleAdd} className="mt-3 inline-flex items-center rounded-control border border-glass-border bg-panel-bg px-3 py-1.5 text-body-sm text-accent backdrop-blur-xl transition-colors duration-normal ease-standard hover:bg-card-bg">
                        添加青蛙 →
                    </button>
                </div>
            ) : (
                <div className="space-y-1">
                    {frogs.map((frog, index) => (
                        <FrogItem
                            key={frog.id}
                            frog={frog}
                            index={index}
                            onToggle={handleToggle}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {showForm && (
                <FrogForm
                    editingFrog={editingFrog}
                    defaultDate={selectedDate}
                    saving={saveMutation.isPending}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </Card>
    );
}
