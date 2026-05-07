const YOUGLISH_ENGLISH_BASE_URL = 'https://youglish.com/pronounce';

export function getYouglishEnglishUrl(text: string): string {
    const query = text.trim().replace(/\s+/g, ' ');
    return `${YOUGLISH_ENGLISH_BASE_URL}/${encodeURIComponent(query)}/english`;
}
