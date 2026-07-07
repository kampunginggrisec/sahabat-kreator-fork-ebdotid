import Link from "next/link";
import { RECOMMENDATION_ICONS } from "../../domain/value-objects/recommendation-type.vo";
import type { Recommendation } from "../../domain/entities/recommendation.entity";

export function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <div className="flex items-start gap-2">
        <span className="text-lg">{RECOMMENDATION_ICONS[rec.type]}</span>
        <div>
          <p className="text-sm font-medium">{rec.title}</p>
          <p className="text-xs text-muted-foreground">{rec.description}</p>
        </div>
      </div>
      <Link href={rec.actionUrl} className="inline-block text-xs font-medium text-foreground hover:underline">
        {rec.actionLabel}&nbsp;→
      </Link>
    </div>
  );
}