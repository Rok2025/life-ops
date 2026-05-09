'use client';

import { useState } from 'react';
import { VaccinationList, MedicalRecordList } from '@/features/youyou';
import { SegmentedControl } from '@/components/ui';
import { Syringe, Stethoscope } from 'lucide-react';

const TAB_OPTIONS = [
    { value: 'vaccination', label: '疫苗接种', icon: <Syringe size={12} /> },
    { value: 'medical', label: '就医记录', icon: <Stethoscope size={12} /> },
] as const;

export default function YouyouHealthPage() {
    const [tab, setTab] = useState('vaccination');

    return (
        <div className="space-y-4 xl:space-y-5">
            <SegmentedControl
                value={tab}
                onChange={setTab}
                options={TAB_OPTIONS}
                size="md"
            />
            {tab === 'vaccination' ? <VaccinationList /> : <MedicalRecordList />}
        </div>
    );
}
