'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';
import { Volume2 } from 'lucide-react';

interface PronunciationButtonProps {
    text: string;
    lang?: string;
    rate?: number;
    size?: number;
    className?: string;
    label?: string;
    stopPropagation?: boolean;
}

function subscribeToSpeechSupport(): () => void {
    return () => {};
}

function getSpeechSupportSnapshot(): boolean {
    return (
        typeof window !== 'undefined'
        && 'speechSynthesis' in window
        && 'SpeechSynthesisUtterance' in window
    );
}

function getServerSpeechSupportSnapshot(): boolean {
    return false;
}

export default function PronunciationButton({
    text,
    lang = 'en-US',
    rate = 0.9,
    size = 15,
    className,
    label = '播放发音',
    stopPropagation = false,
}: PronunciationButtonProps) {
    const isSupported = useSyncExternalStore(
        subscribeToSpeechSupport,
        getSpeechSupportSnapshot,
        getServerSpeechSupportSnapshot,
    );
    const [isSpeaking, setIsSpeaking] = useState(false);
    const normalizedText = text.trim();

    const handleSpeak = useCallback((event: MouseEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
            event.stopPropagation();
        }
        if (!isSupported || !normalizedText) return;

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(normalizedText);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        setIsSpeaking(true);
        window.speechSynthesis.speak(utterance);
    }, [isSupported, lang, normalizedText, rate, stopPropagation]);

    const handleKeyDown = useCallback((event: KeyboardEvent<HTMLButtonElement>) => {
        if (stopPropagation) {
            event.stopPropagation();
        }
    }, [stopPropagation]);

    return (
        <button
            type="button"
            onClick={handleSpeak}
            onKeyDown={handleKeyDown}
            disabled={!isSupported || !normalizedText}
            aria-label={`${label}: ${normalizedText}`}
            title={isSupported ? label : '当前浏览器不支持发音'}
            className={[
                'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-control text-text-tertiary transition-colors duration-normal ease-standard hover:bg-selection-bg hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 disabled:pointer-events-none disabled:opacity-40',
                isSpeaking ? 'bg-selection-bg text-accent' : '',
                className,
            ].filter(Boolean).join(' ')}
        >
            <Volume2 size={size} />
        </button>
    );
}
