'use client';

import { useSearchParams } from 'next/navigation';
import NewWorkoutForm from '@/features/fitness/components/NewWorkoutForm';

export default function NewWorkoutPage() {
    const searchParams = useSearchParams();
    const copyFromId = searchParams.get('copy');

    return <NewWorkoutForm copyFromId={copyFromId} />;
}
