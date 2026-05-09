import { redirect } from 'next/navigation';

/** 动作类型管理已迁移至系统配置页面 */
export default function ExercisesPage() {
    redirect('/settings');
}
