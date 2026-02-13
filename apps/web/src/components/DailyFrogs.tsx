'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, X, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Frog = {
    id: string;
    title: string;
    description: string | null;
    is_completed: boolean;
    frog_date: string;
};

// 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DailyFrogs() {
    const [selectedDate, setSelectedDate] = useState(() =>
        getLocalDateStr()
    );
    const [frogs, setFrogs] = useState<Frog[]>([]);
    const [loading, setLoading] = useState(true);

    // 添加/编辑状态
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formTitle, setFormTitle] = useState('');
    const [formDate, setFormDate] = useState(selectedDate);
    const [saving, setSaving] = useState(false);

    // 格式化日期显示
    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = getLocalDateStr(today);
        const yesterdayStr = getLocalDateStr(yesterday);

        if (dateStr === todayStr) return '今天';
        if (dateStr === yesterdayStr) return '昨天';

        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
    };

    // 加载青蛙
    const loadFrogs = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('daily_frogs')
            .select('*')
            .eq('frog_date', selectedDate)
            .order('created_at');

        if (error) {
            console.error('加载青蛙失败:', error);
        } else {
            setFrogs(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadFrogs();
    }, [selectedDate]);

    // 切换日期（修复时区问题）
    const changeDate = (days: number) => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() + days);
        const newYear = date.getFullYear();
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        const newDay = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
    };

    // 打开添加表单
    const openAddForm = () => {
        if (frogs.length >= 3) {
            alert('每天最多三只青蛙');
            return;
        }
        setFormTitle('');
        setFormDate(selectedDate);
        setEditingId(null);
        setShowForm(true);
    };

    // 打开编辑表单
    const openEditForm = (frog: Frog) => {
        setFormTitle(frog.title);
        setFormDate(frog.frog_date);
        setEditingId(frog.id);
        setShowForm(true);
    };

    // 保存青蛙
    const handleSave = async () => {
        if (!formTitle.trim()) return;
        setSaving(true);

        if (editingId) {
            const { error } = await supabase
                .from('daily_frogs')
                .update({
                    title: formTitle.trim(),
                    frog_date: formDate
                })
                .eq('id', editingId);

            if (error) {
                alert('保存失败: ' + error.message);
            }
        } else {
            const { error } = await supabase
                .from('daily_frogs')
                .insert({
                    frog_date: formDate,
                    title: formTitle.trim()
                });

            if (error) {
                alert('添加失败: ' + error.message);
            }
        }

        setShowForm(false);
        setSaving(false);

        // 如果日期变了，切换到新日期
        if (formDate !== selectedDate) {
            setSelectedDate(formDate);
        } else {
            await loadFrogs();
        }
    };

    // 切换完成状态
    const toggleComplete = async (frog: Frog) => {
        const newCompleted = !frog.is_completed;
        const { error } = await supabase
            .from('daily_frogs')
            .update({
                is_completed: newCompleted,
                completed_at: newCompleted ? new Date().toISOString() : null
            })
            .eq('id', frog.id);

        if (error) {
            console.error('更新失败:', error);
        } else {
            await loadFrogs();
        }
    };

    // 删除青蛙
    const handleDelete = async (id: string) => {
        if (!confirm('确定删除？')) return;

        const { error } = await supabase
            .from('daily_frogs')
            .delete()
            .eq('id', id);

        if (error) {
            alert('删除失败: ' + error.message);
        } else {
            await loadFrogs();
        }
    };

    // 计算完成情况
    const completedCount = frogs.filter(f => f.is_completed).length;
    const isToday = selectedDate === getLocalDateStr();

    return (
        <div className="card p-6">
            {/* Header with date navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary">🐸 三只青蛙</h2>
                    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg px-1 py-1">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-1 hover:bg-bg-secondary rounded"
                            title="前一天"
                        >
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
                                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
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
                    <button
                        onClick={openAddForm}
                        className="btn-primary flex items-center gap-1 text-sm py-2"
                    >
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
                    <button
                        onClick={openAddForm}
                        className="mt-2 text-accent hover:underline text-sm"
                    >
                        添加青蛙 →
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {frogs.map((frog, index) => (
                        <div
                            key={frog.id}
                            className={`p-3 bg-bg-tertiary rounded-lg flex items-center gap-3 ${frog.is_completed ? 'opacity-60' : ''
                                }`}
                        >
                            <button
                                onClick={() => toggleComplete(frog)}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${frog.is_completed
                                    ? 'bg-success border-success text-white'
                                    : 'border-border hover:border-accent'
                                    }`}
                            >
                                {frog.is_completed && <Check size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                                <div className={`font-medium truncate ${frog.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'
                                    }`}>
                                    {index + 1}. {frog.title}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                    onClick={() => openEditForm(frog)}
                                    className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={() => handleDelete(frog.id)}
                                    className="p-1.5 text-danger hover:bg-danger/10 rounded"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 添加/编辑表单弹窗 */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            {editingId ? '编辑青蛙' : '添加青蛙'}
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">日期</label>
                                <input
                                    type="date"
                                    value={formDate}
                                    onChange={(e) => setFormDate(e.target.value)}
                                    max={getLocalDateStr()}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">任务内容</label>
                                <input
                                    type="text"
                                    value={formTitle}
                                    onChange={(e) => setFormTitle(e.target.value)}
                                    placeholder="今天要完成的重要事情..."
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:bg-bg-tertiary flex items-center justify-center gap-1"
                            >
                                <X size={16} />
                                取消
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!formTitle.trim() || saving}
                                className="flex-1 btn-primary py-2 disabled:opacity-50"
                            >
                                {saving ? '保存中...' : '确定'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
