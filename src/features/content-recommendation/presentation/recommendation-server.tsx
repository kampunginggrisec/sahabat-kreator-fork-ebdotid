/**
 * Server component for recommendations.
 * Server Component pages call getRecommendationsDirect() and pass the result here.
 * No client-side React Query or polling needed.
 */

import Link from "next/link";
import { RECOMMENDATION_ICONS } from "@/features/content-recommendation/domain/value-objects/recommendation-type.vo";
import type { Recommendation } from "@/features/content-recommendation/domain/entities/recommendation.entity";

type Props = {
    recommendations: Recommendation[];
};

export function RecommendationList({ recommendations }: Props) {
    if (recommendations.length === 0) {
        return (
            <p className="text-sm text-muted-foreground">
                Semua terlihat baik &mdash; tidak ada rekomendasi mendesak saat ini.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {recommendations.map((rec, i) => (
                <div key={`${rec.type}-${i}`} className="space-y-2 rounded-lg border p-4">
                    <div className="flex items-start gap-2">
                        <span className="text-lg">{RECOMMENDATION_ICONS[rec.type]}</span>
                        <div>
                            <p className="text-sm font-medium">{rec.title}</p>
                            <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                    </div>
                    <Link
                        href={rec.actionUrl}
                        className="inline-block text-xs font-medium text-foreground hover:underline"
                    >
                        {rec.actionLabel} &rarr;
                    </Link>
                </div>
            ))}
        </div>
    );
}