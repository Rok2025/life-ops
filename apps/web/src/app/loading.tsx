export default function Loading() {
    return (
        <div className="animate-pulse space-y-section">
            {/* Header skeleton */}
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-bg-tertiary" />
                <div className="space-y-2">
                    <div className="h-5 w-32 rounded bg-bg-tertiary" />
                    <div className="h-3 w-48 rounded bg-bg-tertiary" />
                </div>
            </div>

            {/* Cards skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-section">
                <div className="card p-card space-y-4">
                    <div className="h-4 w-24 rounded bg-bg-tertiary" />
                    <div className="space-y-2">
                        <div className="h-10 rounded bg-bg-tertiary" />
                        <div className="h-10 rounded bg-bg-tertiary" />
                        <div className="h-10 rounded bg-bg-tertiary" />
                    </div>
                </div>
                <div className="card p-card space-y-4">
                    <div className="h-4 w-24 rounded bg-bg-tertiary" />
                    <div className="space-y-2">
                        <div className="h-10 rounded bg-bg-tertiary" />
                        <div className="h-10 rounded bg-bg-tertiary" />
                    </div>
                </div>
            </div>

            {/* Notes skeleton */}
            <div className="card p-card space-y-4">
                <div className="h-4 w-20 rounded bg-bg-tertiary" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="h-24 rounded bg-bg-tertiary" />
                    <div className="h-24 rounded bg-bg-tertiary" />
                </div>
            </div>
        </div>
    );
}
