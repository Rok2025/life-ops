'use client';

import { useCallback, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { BookCopy, CheckCircle2, FileUp, LoaderCircle, Sparkles, SkipForward } from 'lucide-react';
import { Button, Card, Input, SectionHeader } from '@/components/ui';
import { formatDisplayDate, getLocalDateStr } from '@/lib/utils/date';
import { ASSIGNMENT_STATUS_CONFIG, ASSIGNMENT_TYPE_CONFIG, FAMILIARITY_LABELS } from '../constants';
import { useDailyAssignments, useDailyVocabularyMutations, useRecentWordLogs, useWordBankStats } from '../hooks/useDailyVocabulary';
import type { DailyAssignment, Familiarity } from '../types';

const FAMILIARITY_OPTIONS: Familiarity[] = [0, 1, 2, 3, 4, 5];
type DailyVocabularyMutations = ReturnType<typeof useDailyVocabularyMutations>;

function getProgress(assignments: DailyAssignment[]) {
    const completed = assignments.filter((assignment) => assignment.status === 'completed').length;
    const skipped = assignments.filter((assignment) => assignment.status === 'skipped').length;
    return {
        completed,
        skipped,
        total: assignments.length,
        remaining: assignments.length - completed - skipped,
    };
}

function getDefaultAssignment(assignments: DailyAssignment[], selectedId: string | null): DailyAssignment | null {
    if (selectedId) {
        const matched = assignments.find((assignment) => assignment.id === selectedId);
        if (matched) return matched;
    }

    return assignments.find((assignment) => !['completed', 'skipped'].includes(assignment.status))
        ?? assignments[0]
        ?? null;
}

interface AssignmentEditorProps {
    assignment: DailyAssignment;
    assignments: DailyAssignment[];
    isBusy: boolean;
    saveAssignmentRecordMutation: DailyVocabularyMutations['saveAssignmentRecordMutation'];
    skipAssignmentMutation: DailyVocabularyMutations['skipAssignmentMutation'];
    onSelectAssignment: (assignmentId: string) => void;
}

function AssignmentEditor({
    assignment,
    assignments,
    isBusy,
    saveAssignmentRecordMutation,
    skipAssignmentMutation,
    onSelectAssignment,
}: AssignmentEditorProps) {
    const { data: recentLogs = [] } = useRecentWordLogs(assignment.word_id, 3);
    const [familiarity, setFamiliarity] = useState<Familiarity | null>(assignment.familiarity ?? null);
    const [studyNote, setStudyNote] = useState(assignment.study_note ?? '');
    const [exampleSentence, setExampleSentence] = useState(assignment.example_sentence ?? '');
    const [reflection, setReflection] = useState(assignment.reflection ?? '');

    const canSaveDraft = Boolean(familiarity !== null || studyNote.trim() || exampleSentence.trim() || reflection.trim());
    const canComplete = familiarity !== null;

    const moveToNextAssignment = useCallback(() => {
        const nextAssignment = assignments.find((item) =>
            item.id !== assignment.id && !['completed', 'skipped'].includes(item.status),
        );
        onSelectAssignment(nextAssignment?.id ?? assignment.id);
    }, [assignment.id, assignments, onSelectAssignment]);

    const handleSaveRecord = useCallback((action: 'progress' | 'completed') => {
        if (action === 'completed' && familiarity === null) return;
        if (action === 'progress' && !canSaveDraft) return;

        saveAssignmentRecordMutation.mutate(
            {
                assignmentId: assignment.id,
                familiarity,
                studyNote,
                exampleSentence,
                reflection,
                action,
            },
            {
                onSuccess: () => {
                    if (action === 'completed') {
                        moveToNextAssignment();
                    }
                },
            },
        );
    }, [
        assignment.id,
        canSaveDraft,
        exampleSentence,
        familiarity,
        moveToNextAssignment,
        reflection,
        saveAssignmentRecordMutation,
        studyNote,
    ]);

    const handleSkip = useCallback(() => {
        skipAssignmentMutation.mutate(assignment.id, {
            onSuccess: moveToNextAssignment,
        });
    }, [assignment.id, moveToNextAssignment, skipAssignmentMutation]);

    return (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4 rounded-inner-card border border-glass-border bg-panel-bg/72 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-h2 font-semibold text-text-primary">{assignment.word.term}</h3>
                            <span className="rounded-full bg-bg-tertiary px-2 py-0.5 text-caption text-text-secondary">
                                {assignment.word.pos}
                            </span>
                            {assignment.word.levels.map((level) => (
                                <span key={level} className="rounded-full bg-selection-bg px-2 py-0.5 text-caption text-accent">
                                    {level}
                                </span>
                            ))}
                        </div>
                        <p className="mt-2 text-body-sm text-text-secondary">
                            {ASSIGNMENT_TYPE_CONFIG[assignment.assignment_type].label} · {ASSIGNMENT_STATUS_CONFIG[assignment.status].label}
                        </p>
                    </div>

                    <div className="rounded-control border border-glass-border bg-card-bg px-3 py-2 text-right">
                        <div className="text-caption text-text-tertiary">当前节奏</div>
                        <div className="mt-1 text-body-sm font-medium text-text-primary">
                            {assignment.started_at ? '已开始记录' : '准备开始'}
                        </div>
                    </div>
                </div>

                <div className="grid gap-3">
                    <div>
                        <div className="mb-1.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">
                            熟悉度
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                            {FAMILIARITY_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => setFamiliarity(option)}
                                    className={[
                                        'rounded-control border px-3 py-2 text-body-sm transition-colors duration-normal ease-standard',
                                        familiarity === option
                                            ? 'border-accent bg-accent/12 text-accent'
                                            : 'border-glass-border bg-panel-bg text-text-secondary hover:text-text-primary',
                                    ].join(' ')}
                                >
                                    {option} · {FAMILIARITY_LABELS[option]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div className="mb-1.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">
                            我的例句
                        </div>
                        <Input
                            multiline
                            rows={3}
                            value={exampleSentence}
                            onChange={(event) => setExampleSentence(event.target.value)}
                            placeholder="用这个词写一句和你真实生活相关的英文句子..."
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">
                            学习备注
                        </div>
                        <Input
                            multiline
                            rows={2}
                            value={studyNote}
                            onChange={(event) => setStudyNote(event.target.value)}
                            placeholder="记录词义、搭配、容易混淆的点..."
                        />
                    </div>

                    <div>
                        <div className="mb-1.5 text-caption font-medium uppercase tracking-wide text-text-tertiary">
                            今日心得
                        </div>
                        <Input
                            multiline
                            rows={2}
                            value={reflection}
                            onChange={(event) => setReflection(event.target.value)}
                            placeholder="写下今天对这个词的感觉、联想或使用场景..."
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="secondary"
                        className="gap-2"
                        onClick={() => handleSaveRecord('progress')}
                        disabled={!canSaveDraft || isBusy}
                    >
                        <BookCopy size={16} />
                        暂存记录
                    </Button>
                    <Button
                        className="gap-2"
                        onClick={() => handleSaveRecord('completed')}
                        disabled={!canComplete || isBusy}
                    >
                        {saveAssignmentRecordMutation.isPending ? <LoaderCircle size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        完成并进入下一词
                    </Button>
                    <Button
                        variant="ghost"
                        className="gap-2"
                        onClick={handleSkip}
                        disabled={isBusy}
                    >
                        <SkipForward size={16} />
                        今日跳过
                    </Button>
                </div>

                {saveAssignmentRecordMutation.error ? (
                    <div className="rounded-inner-card border border-danger/20 bg-danger/8 px-4 py-3 text-body-sm text-danger">
                        {saveAssignmentRecordMutation.error instanceof Error ? saveAssignmentRecordMutation.error.message : '保存学习记录失败。'}
                    </div>
                ) : null}
            </div>

            <div className="space-y-3 rounded-inner-card border border-glass-border bg-card-bg/72 p-4">
                <div className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                    <Sparkles size={16} className="text-accent" />
                    最近记录
                </div>

                {recentLogs.length > 0 ? (
                    <div className="space-y-2">
                        {recentLogs.map((log) => (
                            <div key={log.id} className="rounded-control border border-glass-border bg-panel-bg px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className="text-caption text-text-tertiary">
                                        {log.action === 'completed' ? '完成' : log.action === 'progress' ? '暂存' : '跳过'}
                                    </span>
                                    <span className="text-caption text-text-tertiary">
                                        {new Date(log.created_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                {log.familiarity !== null ? (
                                    <div className="mt-1 text-body-sm text-text-primary">
                                        熟悉度 {log.familiarity} · {FAMILIARITY_LABELS[log.familiarity]}
                                    </div>
                                ) : null}
                                {log.example_sentence ? (
                                    <p className="mt-1 text-body-sm text-text-secondary">{log.example_sentence}</p>
                                ) : null}
                                {log.note ? (
                                    <p className="mt-1 text-caption text-text-secondary">{log.note}</p>
                                ) : null}
                                {log.reflection ? (
                                    <p className="mt-1 text-caption text-text-tertiary">{log.reflection}</p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rounded-control border border-dashed border-glass-border px-3 py-4 text-body-sm text-text-secondary">
                        这个词还没有历史记录，今天就从你的第一条例句开始。
                    </div>
                )}

                <div className="rounded-control border border-glass-border bg-panel-bg px-3 py-3">
                    <div className="text-caption text-text-tertiary">当前状态</div>
                    <div className="mt-2 flex items-center gap-2 text-body-sm text-text-primary">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-caption ${ASSIGNMENT_STATUS_CONFIG[assignment.status].pillClass}`}>
                            {ASSIGNMENT_STATUS_CONFIG[assignment.status].label}
                        </span>
                        <span className="text-text-secondary">
                            {assignment.assignment_type === 'new' ? '新词优先吸收' : '复盘旧词，巩固印象'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function DailyVocabularyPanel() {
    const today = getLocalDateStr();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { data: wordBankStats, isLoading: isWordBankLoading } = useWordBankStats();
    const { data: assignments = [], isLoading: isAssignmentsLoading } = useDailyAssignments(today);
    const { importWordBankMutation, saveAssignmentRecordMutation, skipAssignmentMutation } = useDailyVocabularyMutations(today);
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>(null);
    const currentAssignment = getDefaultAssignment(assignments, selectedAssignmentId);

    const progress = getProgress(assignments);
    const percent = progress.total > 0 ? Math.round(((progress.completed + progress.skipped) / progress.total) * 100) : 0;
    const isBusy = importWordBankMutation.isPending || saveAssignmentRecordMutation.isPending || skipAssignmentMutation.isPending;

    const handlePickFile = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleImportFile = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const markdown = await file.text();
        importWordBankMutation.mutate(markdown);
    }, [importWordBankMutation]);

    if (isWordBankLoading) {
        return (
            <Card className="p-card">
                <div className="flex items-center gap-2 text-text-secondary">
                    <LoaderCircle size={16} className="animate-spin" />
                    加载单词计划中...
                </div>
            </Card>
        );
    }

    if ((wordBankStats?.total ?? 0) === 0) {
        return (
            <Card className="p-card space-y-4">
                <SectionHeader
                    title="Longman 每日词单"
                    description="先把 Longman 3000 的 Markdown 导入进来，系统就会每天固定生成随机词单。"
                    right={(
                        <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={handlePickFile}
                            disabled={importWordBankMutation.isPending}
                        >
                            <FileUp size={14} />
                            {importWordBankMutation.isPending ? '导入中...' : '导入词库'}
                        </Button>
                    )}
                />

                <div className="rounded-inner-card border border-dashed border-glass-border bg-panel-bg/70 p-4 text-body-sm text-text-secondary">
                    导入后会自动生成今日词单，支持随手记录例句、备注和心得，并在完成时同步到闪卡复习。
                </div>

                {importWordBankMutation.data ? (
                    <div className="rounded-inner-card border border-success/20 bg-success/8 px-4 py-3 text-body-sm text-success">
                        已解析 {importWordBankMutation.data.total} 条词目，覆盖 {importWordBankMutation.data.initials.join(', ')}。
                    </div>
                ) : null}

                {importWordBankMutation.error ? (
                    <div className="rounded-inner-card border border-danger/20 bg-danger/8 px-4 py-3 text-body-sm text-danger">
                        {importWordBankMutation.error instanceof Error
                            ? importWordBankMutation.error.message
                            : String((importWordBankMutation.error as { message?: string }).message ?? '导入失败，请重试。')}
                    </div>
                ) : null}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".md,.txt,text/markdown,text/plain"
                    className="hidden"
                    onChange={handleImportFile}
                />
            </Card>
        );
    }

    if (isAssignmentsLoading) {
        return (
            <Card className="p-card">
                <div className="flex items-center gap-2 text-text-secondary">
                    <LoaderCircle size={16} className="animate-spin" />
                    生成今日词单中...
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-card space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHeader
                    title="Longman 每日词单"
                    description={`${formatDisplayDate(today)} · ${progress.completed}/${progress.total} 已完成 · ${wordBankStats?.total ?? 0} 词已入库`}
                />
                <div className="flex items-center gap-2">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="gap-2"
                        onClick={handlePickFile}
                        disabled={importWordBankMutation.isPending}
                    >
                        <FileUp size={14} />
                        更新词库
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between text-caption text-text-secondary">
                    <span>今日推进</span>
                    <span>{percent}%</span>
                </div>
                <div className="h-2 rounded-full bg-bg-tertiary">
                    <div
                        className="h-2 rounded-full bg-accent transition-all duration-normal ease-standard"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                    <div className="glass-list-row px-3 py-2">
                        <div className="text-caption text-text-tertiary">已完成</div>
                        <div className="mt-1 text-h3 font-semibold text-text-primary">{progress.completed}</div>
                    </div>
                    <div className="glass-list-row px-3 py-2">
                        <div className="text-caption text-text-tertiary">剩余</div>
                        <div className="mt-1 text-h3 font-semibold text-text-primary">{progress.remaining}</div>
                    </div>
                    <div className="glass-list-row px-3 py-2">
                        <div className="text-caption text-text-tertiary">跳过</div>
                        <div className="mt-1 text-h3 font-semibold text-text-primary">{progress.skipped}</div>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {assignments.map((assignment) => {
                    const statusConfig = ASSIGNMENT_STATUS_CONFIG[assignment.status];
                    const active = assignment.id === currentAssignment?.id;
                    return (
                        <button
                            key={assignment.id}
                            onClick={() => setSelectedAssignmentId(assignment.id)}
                            className={[
                                'rounded-control border px-3 py-1.5 text-body-sm transition-colors duration-normal ease-standard',
                                active
                                    ? 'border-accent bg-accent/12 text-accent'
                                    : `border-glass-border bg-panel-bg text-text-primary ${statusConfig.softClass}`,
                            ].join(' ')}
                        >
                            {assignment.queue_order}. {assignment.word.term}
                        </button>
                    );
                })}
            </div>

            {currentAssignment ? (
                <AssignmentEditor
                    key={currentAssignment.id}
                    assignment={currentAssignment}
                    assignments={assignments}
                    isBusy={isBusy}
                    saveAssignmentRecordMutation={saveAssignmentRecordMutation}
                    skipAssignmentMutation={skipAssignmentMutation}
                    onSelectAssignment={setSelectedAssignmentId}
                />
            ) : (
                <div className="rounded-inner-card border border-dashed border-glass-border px-4 py-6 text-body-sm text-text-secondary">
                    今天还没有生成单词计划。
                </div>
            )}

            {importWordBankMutation.data ? (
                <div className="rounded-inner-card border border-success/20 bg-success/8 px-4 py-3 text-body-sm text-success">
                    词库已更新，共处理 {importWordBankMutation.data.total} 条词目。
                </div>
            ) : null}

            {importWordBankMutation.error ? (
                <div className="rounded-inner-card border border-danger/20 bg-danger/8 px-4 py-3 text-body-sm text-danger">
                    {importWordBankMutation.error instanceof Error
                        ? importWordBankMutation.error.message
                        : String((importWordBankMutation.error as { message?: string }).message ?? '更新词库失败。')}
                </div>
            ) : null}

            <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,text/markdown,text/plain"
                className="hidden"
                onChange={handleImportFile}
            />
        </Card>
    );
}
