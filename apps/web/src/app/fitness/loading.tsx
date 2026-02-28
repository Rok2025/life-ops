export default function FitnessLoading() {
    return (
        <div className="animate-pulse space-y-section">
            {/* Header */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-tertiary" />
                <div className="space-y-2">
                    <div className="h-6 w-28 rounded bg-bg-tertiary" />
                    <div className="h-3 w-40 rounded bg-bg-tertiary" />
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card p-card h-24 bg-bg-tertiary rounded" />
                <div className="card p-card h-24 bg-bg-tertiary rounded" />
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="card p-4 space-y-3">
                        <div className="h-3 w-16 rounded bg-bg-tertiary" />
                        <div className="h-8 w-12 rounded bg-bg-tertiary" />
                    </div>
                ))}
            </div>

            {/* Workout list */}
            <div className="space-y-4">
                <div className="h-4 w-28 rounded bg-bg-tertiary" />
                {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="card p-4 h-32 bg-bg-tertiary rounded" />
                ))}
            </div>
        </div>
    );
}
