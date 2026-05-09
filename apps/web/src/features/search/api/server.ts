import { createClient } from '@/lib/supabase/server';
import { createSearchApi } from './searchApi';

export async function getSearchServerApi() {
    const supabase = await createClient();
    return createSearchApi(supabase);
}
