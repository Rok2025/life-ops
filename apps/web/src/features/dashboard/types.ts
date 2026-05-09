export type HomeDashboardSnapshot = {
    today: string;
    frogsStats: {
        completed: number;
        total: number;
    };
    tilCount: number;
    notesCount: number;
    weeklyWorkoutDays: number;
};
