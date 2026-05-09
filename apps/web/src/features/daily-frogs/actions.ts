'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth/server';
import { createClient } from '@/lib/supabase/server';

const DASHBOARD_PATH = '/';

async function getAuthorizedSupabase() {
    await requireUser();
    return createClient();
}

function revalidateDashboard() {
    revalidatePath(DASHBOARD_PATH);
}

export async function toggleFrogAction(input: {
    id: string;
    completed: boolean;
}): Promise<void> {
    const supabase = await getAuthorizedSupabase();

    const { error } = await supabase
        .from('daily_frogs')
        .update({
            is_completed: input.completed,
            completed_at: input.completed ? new Date().toISOString() : null,
        })
        .eq('id', input.id);

    if (error) throw error;
    revalidateDashboard();
}

export async function deleteFrogAction(id: string): Promise<void> {
    const supabase = await getAuthorizedSupabase();

    const { error } = await supabase.from('daily_frogs').delete().eq('id', id);

    if (error) throw error;
    revalidateDashboard();
}

export async function saveFrogAction(input: {
    id?: string;
    title: string;
    date: string;
}): Promise<void> {
    const supabase = await getAuthorizedSupabase();
    const title = input.title.trim();

    if (!title) {
        throw new Error('青蛙标题不能为空');
    }

    if (input.id) {
        const { error } = await supabase
            .from('daily_frogs')
            .update({ title, frog_date: input.date })
            .eq('id', input.id);

        if (error) throw error;
        revalidateDashboard();
        return;
    }

    const { count, error: countError } = await supabase
        .from('daily_frogs')
        .select('*', { count: 'exact', head: true })
        .eq('frog_date', input.date);

    if (countError) throw countError;
    if ((count ?? 0) >= 3) {
        throw new Error('每天最多三只青蛙');
    }

    const { error } = await supabase
        .from('daily_frogs')
        .insert({ title, frog_date: input.date });

    if (error) throw error;
    revalidateDashboard();
}
