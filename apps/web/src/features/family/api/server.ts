import { createClient } from '@/lib/supabase/server';
import { createFamilyApi } from './familyApi';

export async function getFamilyServerApi() {
    const supabase = await createClient();
    return createFamilyApi(supabase);
}
