'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalDateStr, formatDisplayDate, offsetDate } from '@/lib/utils/date';
import { frogsApi } from '../api/frogsApi';
import { FrogItem } from './FrogItem';
import { FrogForm } from './FrogForm';
import type { Frog } from '../types';

interface FrogsWidgetProps {
    /** 初始日期的青蛙数据（由 Server Component 传入） */
    initialFrogs: Frog[];
    /** 初始日期 */
    initialDate?: string;
}

export default function FrogsWidget({ initialFrogs, initialDate }: FrogsWidgetProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(() => initialDate ?? getLocalDateStr());
    const [frogs, setFrogs] = useState<Frog[]>(initialFrogs);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingFrog, setEditingFrog] = useState<Frog | null>(null);

    const isToday = selectedDate === getLocalDateStr();

    // 加载指定日期的青蛙
    const loadFrogs = useCallback(async (date: string) => {
        setLoading(true);
        try {
            const data = await frogsApi.getByDate(date);
            setFrogs(data);
        } catch (err) {
            console.error('加载青蛙失败:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // 切换日期
    const changeDate = useCallback((days: number) => {
        const newDate = offsetDate(selectedDate, days);
        setSelectedDate(newDate);
        loadFrogs(newDate);
    }, [selectedDate, loadFrogs]);

    // 初始客户端加载，以获取最实时数据并绕过静态编译的过期缓存
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadFrogs(selectedDate);
    }, [selectedDate, loadFrogs]);

    // 切换完成状态
    const toggleMutation = useMutation({
        mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
            frogsApi.toggleComplete(id, completed),
        onSuccess: () => loadFrogs(selectedDate),
    });

    // 删除
    const deleteMutation = useMutation({
        mutationFn: (id: string) => frogsApi.delete(id),
        onSuccess: () => loadFrogs(selectedDate),
    });

    // 保存（创建或更新）
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
            if (variables.date !== selectedDate) {
                setSelectedDate(variables.date);
                loadFrogs(variables.date);
            } else {
                loadFrogs(selectedDate);
            }
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
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">🐸 三只青蛙</h2>
                    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg px-1 py-1">
                        <button onClick={() => changeDate(-1)} className="p-1 hover:bg-bg-secondary rounded" title="前一天">
                            <ChevronLeft size={16} className="text-text-secondary" />
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.getElementById('frog-date-input') as HTMLInputElement;
                                    input?.showPicker?.();
                                }}
                                className="text-sm font-medium text-text-primary min-w-[70px] text-center px-2 py-1 hover:bg-bg-secondary rounded cursor-pointer"
                            >
                                {formatDisplayDate(selectedDate)}
                            </button>
                            <input
                                id="frog-date-input"
                                type="date"
                                value={selectedDate}
                                max={getLocalDateStr()}
                                onChange={(e) => {
                                    if (e.target.value) {
                                        setSelectedDate(e.target.value);
                                        loadFrogs(e.target.value);
                                    }
                                }}
                                className="absolute top-0 left-0 w-0 h-0 opacity-0"
                                style={{ fontSize: '16px' }}
                            />
                        </div>
                        <button
                            onClick={() => changeDate(1)}
                            className="p-1 hover:bg-bg-secondary rounded"
                            disabled={isToday}
                            title="后一天"
                        >
                            <ChevronRight size={16} className={isToday ? 'text-text-secondary/30' : 'text-text-secondary'} />
                        </button>
                    </div>
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

            {/* 青蛙列表 */}
            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : frogs.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                    <div className="text-3xl mb-2">🐸</div>
                    <p className="text-sm">{formatDisplayDate(selectedDate)}还没有青蛙</p>
                    <button onClick={handleAdd} className="mt-2 text-accent hover:underline text-sm">
                        添加青蛙 →
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
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

            {/* 表单弹窗 */}
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
