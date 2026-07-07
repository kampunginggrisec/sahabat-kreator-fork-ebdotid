"use client";

import { useRecommendations } from "./hooks/use-recommendations";
import { RecommendationCard } from "./components/recommendation-card";

export function RecommendationList({ orgSlug, workspaceSlug }: { orgSlug: string; workspaceSlug: string }) {
  const { data: recommendations, isLoading, isError } = useRecommendations(orgSlug, workspaceSlug);

  if (isLoading || !recommendations) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse rounded-lg border bg-card p-4 h-28" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-sm text-muted-foreground">
        Tidak dapat memuat rekomendasi saat ini.
      </p>
    );
  }

  if (recommendations.length === 0) {
    return <p className="text-sm text-muted-foreground">Semua terlihat baik — tidak ada rekomendasi mendesak saat ini.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {recommendations.map((rec, i) => <RecommendationCard key={i} rec={rec} />)}
    </div>
  );
}
