import { createClient } from '@/lib/supabase/server';
import { createFinanceApi } from './financeApi';

export async function getFinanceServerApi() {
    const supabase = await createClient();
    return createFinanceApi(supabase);
}
