"use client";

import { useQuery } from "@tanstack/react-query";
import { getContentStatisticsAction } from "../../application/use-cases/list-contents";
import { contentStats } from "@/features/shared/lib/query-keys";

/**
 * Hook for fetching per-content statistics. Cached per `(contentId, accountId)`
 * so toggling stats panel does not refetch.
 */
export function useContentStats(contentId: string, accountId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: contentStats(contentId, accountId),
    queryFn: async () => getContentStatisticsAction(contentId, accountId),
    enabled: Boolean(contentId && accountId) && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // stats are slow-changing, cache 5 min
    gcTime: 10 * 60 * 1000,
    retry: false, // stats endpoint often returns empty/null on missing content
  });
}
