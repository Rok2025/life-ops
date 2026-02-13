'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Edit2, Trash2, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type TIL = {
    id: string;
    content: string;
    category: string | null;
    til_date: string;
};

const categories = ['技术', '生活', '读书', '工作', '其他'];

// 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function DailyTIL() {
    const [selectedDate, setSelectedDate] = useState(() =>
        getLocalDateStr()
    );
    const [tils, setTils] = useState<TIL[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);

    // 添加/编辑状态
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formContent, setFormContent] = useState('');
    const [formCategory, setFormCategory] = useState('');
    const [formDate, setFormDate] = useState(selectedDate);
    const [saving, setSaving] = useState(false);

    // 格式化日期显示
    const formatDisplayDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayStr = getLocalDateStr(today);
        const yesterdayStr = getLocalDateStr(yesterday);

        if (dateStr === todayStr) return '今天';
        if (dateStr === yesterdayStr) return '昨天';

        return `${month}月${day}日`;
    };

    // 切换日期
    const changeDate = (days: number) => {
        const [year, month, day] = selectedDate.split('-').map(Number);
        const date = new Date(year, month - 1, day);
        date.setDate(date.getDate() + days);
        const newYear = date.getFullYear();
        const newMonth = String(date.getMonth() + 1).padStart(2, '0');
        const newDay = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${newYear}-${newMonth}-${newDay}`);
    };

    // 加载 TIL
    const loadTils = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('daily_til')
            .select('*')
            .eq('til_date', selectedDate)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('加载 TIL 失败:', error);
        } else {
            setTils(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadTils();
    }, [selectedDate]);

    // 打开添加表单
    const openAddForm = () => {
        setFormContent('');
        setFormCategory('');
        setFormDate(selectedDate);
        setEditingId(null);
        setShowForm(true);
    };

    // 打开编辑表单
    const openEditForm = (til: TIL) => {
        setFormContent(til.content);
        setFormCategory(til.category || '');
        setFormDate(til.til_date);
        setEditingId(til.id);
        setShowForm(true);
    };

    // 保存 TIL
    const handleSave = async () => {
        if (!formContent.trim()) return;
        setSaving(true);

        if (editingId) {
            const { error } = await supabase
                .from('daily_til')
                .update({
                    content: formContent.trim(),
                    category: formCategory || null,
                    til_date: formDate
                })
                .eq('id', editingId);

            if (error) {
                alert('保存失败: ' + error.message);
            }
        } else {
            const { error } = await supabase
                .from('daily_til')
                .insert({
                    til_date: formDate,
                    content: formContent.trim(),
                    category: formCategory || null
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
            await loadTils();
        }
    };

    // 删除 TIL
    const handleDelete = async (id: string) => {
        if (!confirm('确定删除？')) return;

        const { error } = await supabase
            .from('daily_til')
            .delete()
            .eq('id', id);

        if (error) {
            alert('删除失败: ' + error.message);
        } else {
            await loadTils();
        }
    };

    // 显示的 TIL 列表（默认3条）
    const displayTils = showAll ? tils : tils.slice(0, 3);
    const hasMore = tils.length > 3;
    const isToday = selectedDate === getLocalDateStr();

    return (
        <div className="card p-6">
            {/* Header with date navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <Lightbulb size={20} className="text-warning" />
                        TIL
                    </h2>
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
                                    const input = document.getElementById('til-date-input') as HTMLInputElement;
                                    input?.showPicker?.();
                                }}
                                className="text-sm font-medium text-text-primary min-w-[70px] text-center px-2 py-1 hover:bg-bg-secondary rounded cursor-pointer"
                            >
                                {formatDisplayDate(selectedDate)}
                            </button>
                            <input
                                id="til-date-input"
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
                    {tils.length > 0 && (
                        <span className="text-sm text-text-secondary">
                            {tils.length} 条
                        </span>
                    )}
                </div>
                <button
                    onClick={openAddForm}
                    className="btn-primary flex items-center gap-1 text-sm py-2"
                >
                    <Plus size={16} />
                    记录
                </button>
            </div>

            {/* TIL 列表 */}
            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : tils.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                    <div className="text-3xl mb-2">💡</div>
                    <p className="text-sm">{formatDisplayDate(selectedDate)}学到了什么？</p>
                    <button
                        onClick={openAddForm}
                        className="mt-2 text-accent hover:underline text-sm"
                    >
                        记录一下 →
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {displayTils.map((til) => (
                            <div
                                key={til.id}
                                className="p-3 bg-bg-tertiary rounded-lg flex items-start gap-3"
                            >
                                <div className="flex-1 min-w-0">
                                    {til.category && (
                                        <span className="text-xs px-2 py-0.5 rounded bg-warning/20 text-warning mr-2">
                                            {til.category}
                                        </span>
                                    )}
                                    <span className="text-text-primary">{til.content}</span>
                                </div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <button
                                        onClick={() => openEditForm(til)}
                                        className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(til.id)}
                                        className="p-1.5 text-danger hover:bg-danger/10 rounded"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 展开/收起按钮 */}
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

            {/* 添加/编辑表单弹窗 */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            {editingId ? '编辑 TIL' : '记录 TIL'}
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
                                <label className="block text-sm text-text-secondary mb-1">分类（可选）</label>
                                <select
                                    value={formCategory}
                                    onChange={(e) => setFormCategory(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary"
                                >
                                    <option value="">不分类</option>
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">学到了什么</label>
                                <textarea
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder="今天我学到了..."
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
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
                                disabled={!formContent.trim() || saving}
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
