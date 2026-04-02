import { supabase } from '@/lib/supabase';
import { REVIEW_INTERVALS } from '../constants';
import { wordBankApi } from './wordBankApi';
import type {
    DailyAssignment,
    Difficulty,
    Familiarity,
    LearningLog,
    SaveAssignmentRecordInput,
    WordBankEntry,
} from '../types';

const DAILY_WORD_TARGET = 8;

type AssignmentHistory = {
    assignment_date: string;
    familiarity: Familiarity | null;
};

function shuffleArray<T>(items: T[]): T[] {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
}

function getWordPriority(word: Pick<WordBankEntry, 'levels'>): number {
    const levels = word.levels ?? [];
    if (levels.includes('S1') || levels.includes('W1')) return 0;
    if (levels.includes('S2') || levels.includes('W2')) return 1;
    if (levels.includes('S3') || levels.includes('W3')) return 2;
    return 3;
}

function compareHistory(
    left: AssignmentHistory | undefined,
    right: AssignmentHistory | undefined,
): number {
    const leftFamiliarity = left?.familiarity ?? 0;
    const rightFamiliarity = right?.familiarity ?? 0;

    if (leftFamiliarity !== rightFamiliarity) {
        return leftFamiliarity - rightFamiliarity;
    }

    return (left?.assignment_date ?? '').localeCompare(right?.assignment_date ?? '');
}

function getReviewDifficulty(word: Pick<WordBankEntry, 'levels'>): Difficulty {
    const levels = word.levels ?? [];
    if (levels.includes('S3') || levels.includes('W3')) return 'hard';
    if (levels.includes('S1') || levels.includes('W1')) return 'easy';
    return 'medium';
}

function getNextReviewAt(familiarity: Familiarity): string {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + REVIEW_INTERVALS[familiarity]);
    return nextReview.toISOString();
}

function mergeTags(word: WordBankEntry, existingTags: string[] = []): string[] {
    return Array.from(
        new Set([
            ...existingTags,
            word.pos,
            ...word.levels,
            'longman_3000',
            'daily_plan',
        ]),
    ).filter(Boolean);
}

function buildCardBackText(
    word: WordBankEntry,
    studyNote?: string,
    exampleSentence?: string,
    reflection?: string,
): string {
    const parts = [
        `词性：${word.pos}`,
        word.levels.length ? `Longman 等级：${word.levels.join(', ')}` : '',
        exampleSentence?.trim() ? `我的例句：${exampleSentence.trim()}` : '',
        studyNote?.trim() ? `学习备注：${studyNote.trim()}` : '',
        reflection?.trim() ? `今日心得：${reflection.trim()}` : '',
    ].filter(Boolean);

    return parts.join('\n\n');
}

async function getOrCreateReviewCard(
    word: WordBankEntry,
    familiarity: Familiarity,
    studyNote?: string,
    exampleSentence?: string,
    reflection?: string,
): Promise<string> {
    const { data: existing, error: existingError } = await supabase
        .from('english_cards')
        .select('*')
        .eq('word_id', word.id)
        .maybeSingle();

    if (existingError) throw existingError;

    const now = new Date().toISOString();
    const nextReviewAt = getNextReviewAt(familiarity);
    const payload = {
        word_id: word.id,
        front_text: word.term,
        back_text: buildCardBackText(word, studyNote, exampleSentence, reflection),
        phonetic: null,
        difficulty: getReviewDifficulty(word),
        tags: mergeTags(word, existing?.tags ?? []),
        source: 'longman_3000',
        familiarity,
        last_reviewed_at: now,
        next_review_at: nextReviewAt,
        updated_at: now,
    };

    if (!existing) {
        const { data: created, error: createError } = await supabase
            .from('english_cards')
            .insert({
                ...payload,
                query_id: null,
                review_count: 1,
            })
            .select('id')
            .single();

        if (createError) throw createError;
        return created.id as string;
    }

    const { data: updated, error: updateError } = await supabase
        .from('english_cards')
        .update({
            ...payload,
            review_count: (existing.review_count ?? 0) + 1,
        })
        .eq('id', existing.id)
        .select('id')
        .single();

    if (updateError) throw updateError;
    return updated.id as string;
}

async function fetchAssignments(date: string): Promise<DailyAssignment[]> {
    const { data, error } = await supabase
        .from('english_daily_assignments')
        .select(`
            *,
            word:word_id (*)
        `)
        .eq('assignment_date', date)
        .order('queue_order', { ascending: true });

    if (error) throw error;
    return (data ?? []) as DailyAssignment[];
}

export const dailyPlanApi = {
    getOrCreateForDate: async (date: string): Promise<DailyAssignment[]> => {
        const existing = await fetchAssignments(date);
        if (existing.length > 0) {
            return existing;
        }

        const words = await wordBankApi.getPlanningWords();
        if (words.length === 0) {
            return [];
        }

        const { data: historyRows, error: historyError } = await supabase
            .from('english_daily_assignments')
            .select('word_id, assignment_date, familiarity')
            .order('assignment_date', { ascending: false });

        if (historyError) throw historyError;

        const latestHistory = new Map<string, AssignmentHistory>();
        for (const row of historyRows ?? []) {
            if (!latestHistory.has(row.word_id as string)) {
                latestHistory.set(row.word_id as string, {
                    assignment_date: row.assignment_date as string,
                    familiarity: (row.familiarity as Familiarity | null) ?? null,
                });
            }
        }

        const unseenBuckets = [0, 1, 2, 3].map(() => [] as WordBankEntry[]);
        const revisitWords: WordBankEntry[] = [];

        for (const word of words) {
            const history = latestHistory.get(word.id);
            if (!history) {
                unseenBuckets[getWordPriority(word)].push(word);
            } else {
                revisitWords.push(word);
            }
        }

        const unseenCandidates = unseenBuckets.flatMap((bucket) => shuffleArray(bucket));
        const revisitCandidates = shuffleArray(revisitWords).sort((left, right) =>
            compareHistory(latestHistory.get(left.id), latestHistory.get(right.id)),
        );

        const picked = [...unseenCandidates, ...revisitCandidates].slice(0, DAILY_WORD_TARGET);
        if (picked.length === 0) {
            return [];
        }

        const { error: insertError } = await supabase
            .from('english_daily_assignments')
            .upsert(
                picked.map((word, index) => ({
                    assignment_date: date,
                    word_id: word.id,
                    queue_order: index + 1,
                    assignment_type: latestHistory.has(word.id) ? 'review' : 'new',
                })),
                { onConflict: 'assignment_date,word_id' },
            );

        if (insertError) throw insertError;

        return fetchAssignments(date);
    },

    saveRecord: async ({
        assignmentId,
        familiarity,
        studyNote,
        exampleSentence,
        reflection,
        action,
    }: SaveAssignmentRecordInput): Promise<DailyAssignment> => {
        const { data: assignmentRow, error: assignmentError } = await supabase
            .from('english_daily_assignments')
            .select(`
                *,
                word:word_id (*)
            `)
            .eq('id', assignmentId)
            .single();

        if (assignmentError) throw assignmentError;

        const assignment = assignmentRow as DailyAssignment;
        const now = new Date().toISOString();
        const normalizedFamiliarity = familiarity ?? assignment.familiarity ?? null;
        let cardId = assignment.card_id;

        if (action === 'completed' && normalizedFamiliarity !== null) {
            cardId = await getOrCreateReviewCard(
                assignment.word,
                normalizedFamiliarity,
                studyNote,
                exampleSentence,
                reflection,
            );
        }

        const nextStatus = action === 'completed' ? 'completed' : assignment.status === 'pending' ? 'in_progress' : assignment.status;
        const { data: updated, error: updateError } = await supabase
            .from('english_daily_assignments')
            .update({
                familiarity: normalizedFamiliarity,
                study_note: studyNote?.trim() || null,
                example_sentence: exampleSentence?.trim() || null,
                reflection: reflection?.trim() || null,
                status: nextStatus,
                started_at: assignment.started_at ?? now,
                completed_at: action === 'completed' ? now : assignment.completed_at,
                card_id: cardId,
                updated_at: now,
            })
            .eq('id', assignmentId)
            .select(`
                *,
                word:word_id (*)
            `)
            .single();

        if (updateError) throw updateError;

        const { error: logError } = await supabase
            .from('english_learning_logs')
            .insert({
                assignment_id: assignmentId,
                word_id: assignment.word_id,
                log_date: assignment.assignment_date,
                action,
                familiarity: normalizedFamiliarity,
                note: studyNote?.trim() || null,
                example_sentence: exampleSentence?.trim() || null,
                reflection: reflection?.trim() || null,
            });

        if (logError) throw logError;

        return updated as DailyAssignment;
    },

    skipAssignment: async (assignmentId: string): Promise<DailyAssignment> => {
        const { data: assignment, error: assignmentError } = await supabase
            .from('english_daily_assignments')
            .select('*')
            .eq('id', assignmentId)
            .single();

        if (assignmentError) throw assignmentError;

        const now = new Date().toISOString();
        const { data: updated, error: updateError } = await supabase
            .from('english_daily_assignments')
            .update({
                status: 'skipped',
                updated_at: now,
            })
            .eq('id', assignmentId)
            .select(`
                *,
                word:word_id (*)
            `)
            .single();

        if (updateError) throw updateError;

        const { error: logError } = await supabase
            .from('english_learning_logs')
            .insert({
                assignment_id: assignmentId,
                word_id: assignment.word_id as string,
                log_date: assignment.assignment_date as string,
                action: 'skipped',
            });

        if (logError) throw logError;

        return updated as DailyAssignment;
    },

    getRecentLogs: async (wordId: string, limit = 3): Promise<LearningLog[]> => {
        const { data, error } = await supabase
            .from('english_learning_logs')
            .select('*')
            .eq('word_id', wordId)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return (data ?? []) as LearningLog[];
    },
};
