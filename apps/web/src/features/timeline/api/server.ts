import { createClient } from '@/lib/supabase/server';
import { createTimelineApi } from './timelineApi';

export async function getTimelineServerApi() {
    const supabase = await createClient();
    return createTimelineApi(supabase);
}
