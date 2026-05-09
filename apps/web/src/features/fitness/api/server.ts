import { createClient } from '@/lib/supabase/server';
import { createFitnessApi } from './fitnessApi';

export async function getFitnessServerApi() {
    const supabase = await createClient();
    return createFitnessApi(supabase);
}
