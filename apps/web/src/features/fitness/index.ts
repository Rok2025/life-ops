export { fitnessApi } from './api/fitnessApi';
export { WeeklyStatsCards } from './components/WeeklyStatsCards';
export { WorkoutList } from './components/WorkoutList';
export { WorkoutCard } from './components/WorkoutCard';
export { QuickActions } from './components/QuickActions';
export { default as FitnessOverview } from './components/FitnessOverview';
export { default as HistoryView } from './components/HistoryView';
export { default as NewWorkoutForm } from './components/NewWorkoutForm';
export { NewWorkoutDialog } from './components/NewWorkoutDialog';
export { WorkoutDetailDialog } from './components/WorkoutDetailDialog';
export { FitnessCalendar } from './components/FitnessCalendar';
export { default as WorkoutDetailView } from './components/WorkoutDetailView';
export type {
	WorkoutSession,
	WorkoutsByDate,
	WorkoutsByMonth,
	WeeklyStats,
	Exercise,
	HistoryStats,
	ExerciseType,
	AggregatedExercise,
} from './types';
export { CATEGORY_CONFIG, getCategoryConfig, WEEKLY_GOAL } from './types';
export { ClientFitnessAreaCard } from './components/ClientFitnessAreaCard';
export { useFitnessHistoryData } from './hooks/useFitnessHistory';
export { useExerciseTypes } from './hooks/useExerciseTypes';
export { useWorkoutDetail } from './hooks/useWorkoutDetail';
