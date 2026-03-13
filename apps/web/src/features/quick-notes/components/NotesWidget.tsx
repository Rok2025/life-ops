'use client';

import { useState, useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, StickyNote } from 'lucide-react';
import { getLocalDateStr, formatDisplayDate, offsetDate } from '@/lib/utils/date';
import DataCalendar, { type DataCalendarHandle } from '@/components/DataCalendar';
import { notesApi } from '../api/notesApi';
import { NoteCard } from './NoteCard';
import { NoteFilter } from './NoteFilter';
import { NoteForm } from './NoteForm';
import { useNotesByDate } from '../hooks/useNotesByDate';
import type { QuickNote, NoteType, FilterType } from '../types';
import { NOTE_TYPE_CONFIG, NOTE_TYPES } from '../types';
import { Button, Card } from '@/components/ui';

interface NotesWidgetProps {
    initialDate?: string;
}

export default function NotesWidget({ initialDate }: NotesWidgetProps) {
    const queryClient = useQueryClient();
    const calendarRef = useRef<DataCalendarHandle>(null);
    const dateBtnRef = useRef<HTMLButtonElement>(null);
    const [selectedDate, setSelectedDate] = useState(() => initialDate ?? getLocalDateStr());
    const [showAll, setShowAll] = useState(false);
    const [filter, setFilter] = useState<FilterType>('all');
    const [expandedQA, setExpandedQA] = useState<Set<string>>(new Set());
    const [showForm, setShowForm] = useState(false);
    const [editingNote, setEditingNote] = useState<QuickNote | null>(null);
    const [defaultFormType, setDefaultFormType] = useState<NoteType>('memo');

    const { data: notes = [], isLoading: loading } = useNotesByDate(selectedDate);
    const isToday = selectedDate === getLocalDateStr();

    const refreshDateData = useCallback((date: string) => {
        queryClient.invalidateQueries({ queryKey: ['notes', date] });
        queryClient.invalidateQueries({ queryKey: ['notes-count', date] });
    }, [queryClient]);

    const changeDate = useCallback((days: number) => {
        const newDate = offsetDate(selectedDate, days);
        setSelectedDate(newDate);
        setShowAll(false);
    }, [selectedDate]);

    const saveMutation = useMutation({
        mutationFn: async (data: { id?: string; type: NoteType; content: string; answer: string | null; date: string }) => {
            const noteData = {
                note_date: data.date,
                type: data.type,
                content: data.content,
                answer: data.answer,
                is_answered: data.type === 'question' ? !!data.answer : false,
            };
            if (data.id) {
                await notesApi.update(data.id, noteData);
            } else {
                await notesApi.create(noteData);
            }
        },
        onSuccess: (_, variables) => {
            setShowForm(false);
            setEditingNote(null);
            setSelectedDate(variables.date);
            setShowAll(false);
            refreshDateData(variables.date);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => notesApi.delete(id),
        onSuccess: () => refreshDateData(selectedDate),
    });

    const handleEdit = useCallback((note: QuickNote) => {
        setEditingNote(note);
        setShowForm(true);
    }, []);

    const handleDelete = useCallback((id: string) => {
        if (!confirm('确定删除？')) return;
        deleteMutation.mutate(id);
    }, [deleteMutation]);

    const handleAdd = useCallback((type?: NoteType) => {
        setEditingNote(null);
        setDefaultFormType(type ?? 'memo');
        setShowForm(true);
    }, []);

    const handleSave = useCallback((data: { type: NoteType; content: string; answer: string | null; date: string }) => {
        saveMutation.mutate({ id: editingNote?.id, ...data });
    }, [saveMutation, editingNote]);

    const handleCancel = useCallback(() => {
        setShowForm(false);
        setEditingNote(null);
    }, []);

    const toggleExpand = useCallback((id: string) => {
        setExpandedQA(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    const filteredNotes = filter === 'all' ? notes : notes.filter(n => n.type === filter);
    const displayNotes = showAll ? filteredNotes : filteredNotes.slice(0, 4);
    const hasMore = filteredNotes.length > 4;

    const counts: Record<FilterType, number> = {
        all: notes.length,
        memo: notes.filter(n => n.type === 'memo').length,
        idea: notes.filter(n => n.type === 'idea').length,
        question: notes.filter(n => n.type === 'question').length,
    };

    return (
        <Card className="h-full p-card">
            <div className="flex items-center justify-between mb-widget-header">
                <div className="flex items-center gap-3">
                    <h2 className="text-h3 font-semibold text-text-primary flex items-center gap-2">
                        <StickyNote size={20} className="text-accent" />
                        随手记
                    </h2>
                    <div className="glass-segmented">
                        <button onClick={() => changeDate(-1)} className="glass-segment-button h-8 w-8 p-0">
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
                        >
                            <ChevronRight size={16} className={isToday ? 'text-text-secondary/30' : 'text-text-secondary'} />
                        </button>
                    </div>
                    <DataCalendar ref={calendarRef} scope="notes" selectedDate={selectedDate} onSelectDate={setSelectedDate} hideTrigger externalTriggerRef={dateBtnRef} />
                    {notes.length > 0 && <span className="glass-mini-chip text-body-sm">{notes.length} 条</span>}
                </div>
                <Button onClick={() => handleAdd()} variant="tinted" size="sm" className="gap-1">
                    <Plus size={16} />
                    记录
                </Button>
            </div>

            {notes.length > 0 && <NoteFilter filter={filter} counts={counts} onFilterChange={setFilter} />}

            {loading ? (
                <div className="text-center py-4 text-text-secondary">加载中...</div>
            ) : notes.length === 0 ? (
                <div className="rounded-[1.125rem] border border-glass-border bg-card-bg/68 px-4 py-4 backdrop-blur-xl">
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                        <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2 text-body-sm font-medium text-text-primary">
                                <span className="text-h3">📝</span>
                                <span>捕捉今天的想法</span>
                            </div>
                            <p className="text-body-sm text-text-secondary">
                                备忘、灵感和问题都放在这里，先记下来，再慢慢整理。
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                        {NOTE_TYPES.map(type => {
                            const config = NOTE_TYPE_CONFIG[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleAdd(type)}
                                    className={`rounded-full border border-glass-border bg-panel-bg px-3 py-1.5 text-body-sm backdrop-blur-xl transition-colors duration-normal ease-standard hover:bg-card-bg ${config.color}`}
                                >
                                    {config.emoji} {config.label}
                                </button>
                            );
                        })}
                        </div>
                    </div>
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-4 text-text-secondary text-body-sm">
                    无{filter !== 'all' ? NOTE_TYPE_CONFIG[filter].label : ''}记录
                </div>
            ) : (
                <>
                    <div className="space-y-1">
                        {displayNotes.map(note => (
                            <NoteCard
                                key={note.id}
                                note={note}
                                isExpanded={expandedQA.has(note.id)}
                                onToggleExpand={toggleExpand}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
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
                                <>展开更多 ({filteredNotes.length - 4} 条) <ChevronDown size={16} /></>
                            )}
                        </button>
                    )}
                </>
            )}

            {showForm && (
                <NoteForm
                    editingNote={editingNote}
                    defaultDate={selectedDate}
                    defaultType={defaultFormType}
                    saving={saveMutation.isPending}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            )}
        </Card>
    );
}
