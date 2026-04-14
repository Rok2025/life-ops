import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';
const PHOTO_PATH = 'youyou/cover.jpg';
const POSITION_SCOPE = 'youyou-photo';
const TRANSFORM_KEY = 'transform';

export type PhotoTransform = { x: number; y: number; zoom: number };

const DEFAULT_TRANSFORM: PhotoTransform = { x: 50, y: 50, zoom: 100 };

export const youyouPhotoApi = {
    /** Get the public URL for the cover photo (or null) */
    async getPhotoUrl(): Promise<string | null> {
        const { data } = await supabase.storage.from(BUCKET).list('youyou', { limit: 1, search: 'cover' });
        if (!data || data.length === 0) return null;
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(PHOTO_PATH);
        return `${urlData.publicUrl}?t=${Date.now()}`;
    },

    /** Upload or replace the cover photo */
    async uploadPhoto(file: File): Promise<string> {
        const { error } = await supabase.storage.from(BUCKET).upload(PHOTO_PATH, file, {
            upsert: true,
            contentType: file.type,
        });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(PHOTO_PATH);
        return `${urlData.publicUrl}?t=${Date.now()}`;
    },

    /** Delete the cover photo */
    async deletePhoto(): Promise<void> {
        const { error } = await supabase.storage.from(BUCKET).remove([PHOTO_PATH]);
        if (error) throw error;
    },

    /** Get transform (x, y, zoom) */
    async getTransform(): Promise<PhotoTransform> {
        const { data } = await supabase
            .from('system_configs')
            .select('label')
            .eq('scope', POSITION_SCOPE)
            .eq('value', TRANSFORM_KEY)
            .single();
        if (!data) return DEFAULT_TRANSFORM;
        try { return { ...DEFAULT_TRANSFORM, ...JSON.parse(data.label) }; }
        catch { return DEFAULT_TRANSFORM; }
    },

    /** Save transform (x, y, zoom) — upsert */
    async saveTransform(t: PhotoTransform): Promise<void> {
        const json = JSON.stringify(t);
        const { data: existing } = await supabase
            .from('system_configs')
            .select('id')
            .eq('scope', POSITION_SCOPE)
            .eq('value', TRANSFORM_KEY)
            .single();

        if (existing) {
            const { error } = await supabase
                .from('system_configs')
                .update({ label: json })
                .eq('id', existing.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('system_configs')
                .insert({ scope: POSITION_SCOPE, value: TRANSFORM_KEY, label: json });
            if (error) throw error;
        }
    },
};
