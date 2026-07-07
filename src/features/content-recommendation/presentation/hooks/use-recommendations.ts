"use client";

import { useQuery } from "@tanstack/react-query";
import { getRecommendationsAction } from "../../application/use-cases/get-recommendations";
import type { Recommendation } from "../../domain/entities/recommendation.entity";

export const recommendationKeys = {
    all: () => ["recommendations"] as const,
    list: (orgSlug: string, workspaceSlug: string) => [...recommendationKeys.all(), orgSlug, workspaceSlug] as const,
};

export function useRecommendations(orgSlug: string, workspaceSlug: string) {
    return useQuery<Recommendation[]>({
        queryKey: recommendationKeys.list(orgSlug, workspaceSlug),
        queryFn: () => getRecommendationsAction(orgSlug, workspaceSlug),
        staleTime: 60 * 1000, // 1 min
        retry: 1,
        enabled: !!orgSlug && !!workspaceSlug,
    });
}
