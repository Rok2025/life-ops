'use client';

import { useState, useEffect } from 'react';
import {
    Plus, X, Edit2, Trash2, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight, StickyNote, Lightbulb,
    HelpCircle, MessageSquare, Check
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

type NoteType = 'memo' | 'idea' | 'question';

type QuickNote = {
    id: string;
    note_date: string;
    type: NoteType;
    content: string;
    answer: string | null;
    is_answered: boolean;
    created_at: string;
};

const typeConfig: Record<NoteType, {
    label: string;
    icon: typeof StickyNote;
    emoji: string;
    color: string;
    bg: string;
    placeholder: string;
}> = {
    memo: {
        label: '备忘',
        icon: StickyNote,
        emoji: '📌',
        color: 'text-blue-400',
        bg: 'bg-blue-500/20',
        placeholder: '记录一些待办、提醒...',
    },
    idea: {
        label: '灵感',
        icon: Lightbulb,
        emoji: '💡',
        color: 'text-yellow-400',
        bg: 'bg-yellow-500/20',
        placeholder: '记录你的好想法、好点子...',
    },
    question: {
        label: '问答',
        icon: HelpCircle,
        emoji: '❓',
        color: 'text-green-400',
        bg: 'bg-green-500/20',
        placeholder: '记录你的疑问...',
    },
};

type FilterType = 'all' | NoteType;

// 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题
const getLocalDateStr = (date: Date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function QuickNotes() {
    const [selectedDate, setSelectedDate] = useState(() =>
        getLocalDateStr()
    );
    const [notes, setNotes] = useState<QuickNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedQA, setExpandedQA] = useState<Set<string>>(new Set());

    // 添加/编辑状态
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formType, setFormType] = useState<NoteType>('memo');
    const [formContent, setFormContent] = useState('');
    const [formAnswer, setFormAnswer] = useState('');
    const [formDate, setFormDate] = useState(selectedDate);
    const [saving, setSaving] = useState(false);

    // 格式化日期
    const formatDisplayDate = (dateStr: string) => {
        const parts = dateStr.split('-').map(Number);
        const month = parts[1];
        const day = parts[2];
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
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
    };

    // 加载数据
    const loadNotes = async (date: string) => {
        setLoading(true);
        const { data, error } = await supabase
            .from('quick_notes')
            .select('*')
            .eq('note_date', date)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('加载随手记失败:', error);
        } else {
            setNotes(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        const fetchNotes = async () => {
            setShowAll(false);
            await loadNotes(selectedDate);
        };
        fetchNotes();
    }, [selectedDate]);

    // 筛选后的笔记
    const filteredNotes = filter === 'all' ? notes : notes.filter(n => n.type === filter);
    const displayNotes = showAll ? filteredNotes : filteredNotes.slice(0, 4);
    const hasMore = filteredNotes.length > 4;
    const isToday = selectedDate === getLocalDateStr();

    // 各类型计数
    const counts = {
        all: notes.length,
        memo: notes.filter(n => n.type === 'memo').length,
        idea: notes.filter(n => n.type === 'idea').length,
        question: notes.filter(n => n.type === 'question').length,
    };

    // 展开/折叠问答
    const toggleQA = (id: string) => {
        setExpandedQA(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // 打开添加表单
    const openAddForm = (type?: NoteType) => {
        setFormContent('');
        setFormAnswer('');
        setFormDate(selectedDate);
        setFormType(type || 'memo');
        setEditingId(null);
        setShowForm(true);
    };

    // 打开编辑表单
    const openEditForm = (note: QuickNote) => {
        setFormContent(note.content);
        setFormAnswer(note.answer || '');
        setFormDate(note.note_date);
        setFormType(note.type);
        setEditingId(note.id);
        setShowForm(true);
    };

    // 保存
    const handleSave = async () => {
        if (!formContent.trim()) return;
        setSaving(true);

        const noteData = {
            note_date: formDate,
            type: formType,
            content: formContent.trim(),
            answer: formType === 'question' ? (formAnswer.trim() || null) : null,
            is_answered: formType === 'question' ? !!formAnswer.trim() : false,
        };

        if (editingId) {
            const { error } = await supabase
                .from('quick_notes')
                .update({ ...noteData, updated_at: new Date().toISOString() })
                .eq('id', editingId);
            if (error) alert('保存失败: ' + error.message);
        } else {
            const { error } = await supabase
                .from('quick_notes')
                .insert(noteData);
            if (error) alert('添加失败: ' + error.message);
        }

        setShowForm(false);
        setSaving(false);

        if (formDate !== selectedDate) {
            setSelectedDate(formDate);
        } else {
            await loadNotes(selectedDate);
        }
    };

    // 删除
    const handleDelete = async (id: string) => {
        if (!confirm('确定删除？')) return;
        const { error } = await supabase
            .from('quick_notes')
            .delete()
            .eq('id', id);
        if (error) alert('删除失败: ' + error.message);
        else await loadNotes(selectedDate);
    };

    // 快速回答问题
    const handleQuickAnswer = async (note: QuickNote) => {
        openEditForm(note);
    };

    return (
        <div className="card p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <StickyNote size={20} className="text-accent" />
                        随手记
                    </h2>
                    {/* 日期导航 */}
                    <div className="flex items-center gap-1 bg-bg-tertiary rounded-lg px-1 py-1">
                        <button
                            onClick={() => changeDate(-1)}
                            className="p-1 hover:bg-bg-secondary rounded"
                        >
                            <ChevronLeft size={16} className="text-text-secondary" />
                        </button>
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => {
                                    const input = document.getElementById('qn-date-input') as HTMLInputElement;
                                    input?.showPicker?.();
                                }}
                                className="text-sm font-medium text-text-primary min-w-17.5 text-center px-2 py-1 hover:bg-bg-secondary rounded cursor-pointer"
                            >
                                {formatDisplayDate(selectedDate)}
                            </button>
                            <input
                                id="qn-date-input"
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
                        >
                            <ChevronRight size={16} className={isToday ? 'text-text-secondary/30' : 'text-text-secondary'} />
                        </button>
                    </div>
                    {notes.length > 0 && (
                        <span className="text-sm text-text-secondary">{notes.length} 条</span>
                    )}
                </div>
                <button
                    onClick={() => openAddForm()}
                    className="btn-primary flex items-center gap-1 text-sm py-2"
                >
                    <Plus size={16} />
                    记录
                </button>
            </div>

            {/* 类型筛选 Tab */}
            {notes.length > 0 && (
                <div className="flex items-center gap-1 mb-4 bg-bg-tertiary rounded-lg p-1">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                            filter === 'all'
                                ? 'bg-bg-secondary text-text-primary font-medium shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'
                        }`}
                    >
                        全部 {counts.all > 0 && <span className="ml-1 text-xs opacity-70">{counts.all}</span>}
                    </button>
                    {(['memo', 'idea', 'question'] as NoteType[]).map(type => {
                        const config = typeConfig[type];
                        return (
                            <button
                                key={type}
                                onClick={() => setFilter(type)}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors flex items-center gap-1 ${
                                    filter === type
                                        ? 'bg-bg-secondary text-text-primary font-medium shadow-sm'
                                        : 'text-text-secondary hover:text-text-primary'
                                }`}
                            >
                                <span>{config.emoji}</span>
                                {config.label}
                                {counts[type] > 0 && <span className="text-xs opacity-70">{counts[type]}</span>}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* 笔记列表 */}
            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : notes.length === 0 ? (
                <div className="text-center py-6 text-text-secondary">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-sm mb-3">随时记录你的想法、灵感和疑问</p>
                    <div className="flex items-center justify-center gap-2">
                        {(['memo', 'idea', 'question'] as NoteType[]).map(type => {
                            const config = typeConfig[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => openAddForm(type)}
                                    className={`px-3 py-1.5 rounded-lg text-sm ${config.bg} ${config.color} hover:opacity-80 transition-opacity`}
                                >
                                    {config.emoji} {config.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-4 text-text-secondary text-sm">
                    无{filter !== 'all' ? typeConfig[filter].label : ''}记录
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {displayNotes.map((note) => {
                            const config = typeConfig[note.type];
                            const isExpanded = expandedQA.has(note.id);

                            return (
                                <div key={note.id} className="group">
                                    <div className="p-3 bg-bg-tertiary rounded-lg flex items-start gap-3">
                                        {/* 类型标签 */}
                                        <span className={`text-xs px-2 py-0.5 rounded ${config.bg} ${config.color} shrink-0 mt-0.5`}>
                                            {config.emoji} {config.label}
                                        </span>

                                        {/* 内容 */}
                                        <div className="flex-1 min-w-0">
                                            <span className="text-text-primary text-sm">{note.content}</span>

                                            {/* 问答类型：答案状态 */}
                                            {note.type === 'question' && (
                                                <div className="mt-1">
                                                    {note.is_answered ? (
                                                        <button
                                                            onClick={() => toggleQA(note.id)}
                                                            className="text-xs text-green-400 flex items-center gap-1 hover:underline"
                                                        >
                                                            <Check size={12} />
                                                            已回答
                                                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleQuickAnswer(note)}
                                                            className="text-xs text-orange-400 flex items-center gap-1 hover:underline"
                                                        >
                                                            <MessageSquare size={12} />
                                                            待回答，点击作答
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* 展开的答案 */}
                                            {note.type === 'question' && note.is_answered && isExpanded && (
                                                <div className="mt-2 pl-3 border-l-2 border-green-500/30 text-sm text-text-secondary">
                                                    {note.answer}
                                                </div>
                                            )}
                                        </div>

                                        {/* 时间 + 操作 */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <span className="text-xs text-text-secondary/50 mr-1">
                                                {new Date(note.created_at).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <button
                                                onClick={() => openEditForm(note)}
                                                className="p-1.5 text-text-secondary hover:bg-bg-secondary rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
                                                className="p-1.5 text-danger hover:bg-danger/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 展开/收起 */}
                    {hasMore && (
                        <button
                            onClick={() => setShowAll(!showAll)}
                            className="w-full mt-3 py-2 text-sm text-accent hover:bg-bg-tertiary rounded-lg flex items-center justify-center gap-1"
                        >
                            {showAll ? (
                                <>收起 <ChevronUp size={16} /></>
                            ) : (
                                <>展开更多 ({filteredNotes.length - 4} 条) <ChevronDown size={16} /></>
                            )}
                        </button>
                    )}
                </>
            )}

            {/* 添加/编辑弹窗 */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="card p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">
                            {editingId ? '编辑记录' : '快速记录'}
                        </h3>
                        <div className="space-y-4">
                            {/* 类型选择 */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-2">类型</label>
                                <div className="flex gap-2">
                                    {(['memo', 'idea', 'question'] as NoteType[]).map(type => {
                                        const config = typeConfig[type];
                                        return (
                                            <button
                                                key={type}
                                                onClick={() => setFormType(type)}
                                                className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-colors ${
                                                    formType === type
                                                        ? `${config.bg} ${config.color} border-transparent font-medium`
                                                        : 'border-border text-text-secondary hover:bg-bg-tertiary'
                                                }`}
                                            >
                                                {config.emoji} {config.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 日期 */}
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

                            {/* 内容 */}
                            <div>
                                <label className="block text-sm text-text-secondary mb-1">
                                    {formType === 'question' ? '你的疑问' : '内容'}
                                </label>
                                <textarea
                                    value={formContent}
                                    onChange={(e) => setFormContent(e.target.value)}
                                    placeholder={typeConfig[formType].placeholder}
                                    rows={3}
                                    className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
                                    autoFocus
                                />
                            </div>

                            {/* 问答类型的答案 */}
                            {formType === 'question' && (
                                <div>
                                    <label className="block text-sm text-text-secondary mb-1">
                                        答案 <span className="text-text-secondary/50">（可稍后填写）</span>
                                    </label>
                                    <textarea
                                        value={formAnswer}
                                        onChange={(e) => setFormAnswer(e.target.value)}
                                        placeholder="写下你的回答..."
                                        rows={3}
                                        className="w-full px-3 py-2 rounded-lg bg-bg-tertiary border border-border text-text-primary resize-none"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 按钮 */}
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
