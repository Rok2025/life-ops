import { Dumbbell } from 'lucide-react';
import Link from 'next/link';
import DailyFrogs from '@/components/DailyFrogs';
import DailyTIL from '@/components/DailyTIL';
import QuickNotes from '@/components/QuickNotes';
import WelcomeHeader from '@/components/WelcomeHeader';
import { supabase } from '@/lib/supabase';

// 获取本地日期字符串 (YYYY-MM-DD)，避免 toISOString 的 UTC 时区问题
function getLocalDateStr(date: Date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取今日青蛙完成情况
async function getTodayFrogsStats() {
  const today = getLocalDateStr();

  const { data, error } = await supabase
    .from('daily_frogs')
    .select('is_completed')
    .eq('frog_date', today);

  if (error) {
    console.error('获取今日青蛙失败:', error);
    return { completed: 0, total: 0 };
  }

  const total = data?.length || 0;
  const completed = data?.filter(f => f.is_completed).length || 0;
  return { completed, total };
}

// 获取今日 TIL 数量
async function getTodayTilCount() {
  const today = getLocalDateStr();

  const { count, error } = await supabase
    .from('daily_til')
    .select('*', { count: 'exact', head: true })
    .eq('til_date', today);

  if (error) {
    console.error('获取今日 TIL 失败:', error);
    return 0;
  }

  return count || 0;
}

// 获取今日随手记数量
async function getTodayNotesCount() {
  const today = getLocalDateStr();

  const { count, error } = await supabase
    .from('quick_notes')
    .select('*', { count: 'exact', head: true })
    .eq('note_date', today);

  if (error) {
    console.error('获取今日随手记失败:', error);
    return 0;
  }

  return count || 0;
}

// 获取本周训练天数
async function getWeeklyWorkoutDays() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('workout_sessions')
    .select('workout_date')
    .gte('workout_date', getLocalDateStr(startOfWeek));

  if (error) {
    console.error('获取本周训练次数失败:', error);
    return 0;
  }

  const uniqueDates = new Set(data?.map(s => s.workout_date) || []);
  return uniqueDates.size;
}

// Area 状态卡片组件
function AreaCard({
  name,
  icon: Icon,
  href,
  current,
  target,
  unit
}: {
  name: string;
  icon: React.ElementType;
  href: string;
  current: number;
  target: number;
  unit: string;
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
            className={`h-full rounded-full transition-all ${status === 'success' ? 'bg-success' :
              status === 'warning' ? 'bg-warning' : 'bg-danger'
              }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  // 并行获取所有数据
  const [weeklyWorkoutDays, frogsStats, tilCount, notesCount] = await Promise.all([
    getWeeklyWorkoutDays(),
    getTodayFrogsStats(),
    getTodayTilCount(),
    getTodayNotesCount(),
  ]);

  return (
    <div>
      {/* WelcomeHeader - 动态时间 + 问候语 + 数据汇总 */}
      <WelcomeHeader
        userName="Rok"
        frogsCompleted={frogsStats.completed}
        frogsTotal={frogsStats.total}
        tilCount={tilCount}
        notesCount={notesCount}
        workoutDays={weeklyWorkoutDays}
        workoutTarget={3}
      />

      {/* 三只青蛙 + TIL 并排显示 */}
      <section className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailyFrogs />
        <DailyTIL />
      </section>

      {/* 随手记 - 全宽 */}
      <section className="mb-8">
        <QuickNotes />
      </section>

      {/* Area Cards Grid */}
      <section>
        <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wide mb-4">
          人生领域
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AreaCard
            name="健身"
            icon={Dumbbell}
            href="/fitness"
            current={weeklyWorkoutDays}
            target={3}
            unit="天"
          />
          {/* 其他领域卡片将在后续添加 */}
        </div>
      </section>
    </div>
  );
}
