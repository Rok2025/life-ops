import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import { FrogsWidget } from '@/features/daily-frogs';
import { frogsApi } from '@/features/daily-frogs';
import { TilWidget } from '@/features/daily-til';
import { tilApi } from '@/features/daily-til';
import { NotesWidget } from '@/features/quick-notes';
import { notesApi } from '@/features/quick-notes';
import { fitnessApi } from '@/features/fitness';
import WelcomeHeader from '@/components/WelcomeHeader';
import { getLocalDateStr } from '@/lib/utils/date';


// --- AreaCard 组件（后续将提取到 features/dashboard/components/） ---

function AreaCard({
  name, icon: Icon, href, current, target, unit,
}: {
  name: string; icon: React.ElementType; href: string;
  current: number; target: number; unit: string;
}) {
  const progress = Math.round((current / target) * 100);
  const status = progress >= 100 ? 'success' : progress >= 50 ? 'warning' : 'danger';
  const statusLabel = progress >= 100 ? 'OK' : progress >= 50 ? '进行中' : '需关注';

  return (
    <Link href={href} className="card p-6 block hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-bg-tertiary flex items-center justify-center">
            <Icon size={20} className="text-accent" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
        </div>
        <span className={`pill pill-${status}`}>{statusLabel}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">本周进度</span>
          <span className="font-medium text-text-primary">{current}/{target} {unit}</span>
        </div>
        <div className="h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${status === 'success' ? 'bg-success' : status === 'warning' ? 'bg-warning' : 'bg-danger'
              }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

import { ClientFitnessAreaCard } from '@/features/fitness/components/ClientFitnessAreaCard';

// --- Page ---

export default async function HomePage() {
  const today = getLocalDateStr();

  const [frogsStats, tilCount, notesCount, initialFrogs, initialTils, initialNotes] = await Promise.all([
    frogsApi.getStats(today),
    tilApi.getCount(today),
    notesApi.getCount(today),
    frogsApi.getByDate(today),
    tilApi.getByDate(today),
    notesApi.getByDate(today),
  ]);

  return (
    <div>
      <WelcomeHeader
        userName="Rok"
        frogsCompleted={frogsStats.completed}
        frogsTotal={frogsStats.total}
        tilCount={tilCount}
        notesCount={notesCount}
        workoutDays={0} // 将由客户端组件实际加载
        workoutTarget={3}
      />

      {/* 三只青蛙 + TIL */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FrogsWidget initialFrogs={initialFrogs} initialDate={today} />
        <TilWidget initialTils={initialTils} initialDate={today} />
      </section>

      {/* 随手记 */}
      <section className="mb-8">
        <NotesWidget initialNotes={initialNotes} initialDate={today} />
      </section>

      {/* 领域卡片 */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
          人生领域
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClientFitnessAreaCard target={3} unit="天" />
        </div>
      </section>
    </div>
  );
}
