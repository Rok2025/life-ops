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
        <div className="card p-card">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">🐸 三只青蛙</h2>
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
                    <DataCalendar ref={calendarRef} scope="frogs" selectedDate={selectedDate} onSelectDate={setSelectedDate} hideTrigger externalTriggerRef={dateBtnRef} />
                    {frogs.length > 0 && (
                        <span className="text-sm text-text-secondary">
                            {completedCount}/{frogs.length} 完成
                        </span>
                    )}
                </div>
                {frogs.length < 3 && (
                    <button onClick={handleAdd} className="btn-primary flex items-center gap-1 text-sm py-2">
                        <Plus size={16} />
                        添加
                    </button>
                )}
            </div>

            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : frogs.length === 0 ? (
                <div className="text-center py-4 text-text-secondary">
                    <div className="text-2xl mb-1">🐸</div>
                    <p className="text-sm">{formatDisplayDate(selectedDate)}还没有青蛙</p>
                    <button onClick={handleAdd} className="mt-2 text-accent hover:underline text-sm">
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
        </div>
    );
}
