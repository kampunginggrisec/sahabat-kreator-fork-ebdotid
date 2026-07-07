/**
 * Skeleton placeholder for the recommendations list.
 * Used by Suspense fallback while the page is streaming.
 */
export function RecommendationListSkeleton() {
    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg border bg-card p-4 h-28" />
            ))}
        </div>
    );
}