"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTopPerformingHashtagsAction } from "../../application/use-cases/get-top-performing-hashtags";
import { listHashtagNotesAction } from "../../application/use-cases/list-hashtag-notes";
import { markHashtagProvenAction } from "../../application/use-cases/mark-hashtag-proven";
import type { HashtagPerformance } from "../../domain/entities/hashtag-performance.entity";
import type { HashtagNote } from "../../domain/entities/hashtag-suggestion.entity";

export type {
  HashtagSuggestion,
  HashtagNote,
} from "../../domain/entities/hashtag-suggestion.entity";
export type { HashtagPerformance } from "../../domain/entities/hashtag-performance.entity";

/**
 * Query keys factory for hashtag-research.
 *
 * Three independent buckets invalidated together after markProven:
 * - performance (analytics-driven — won't change here, but kept in family)
 * - notes (manual curation)
 */
export const hashtagKeys = {
  all: () => ["hashtag"] as const,
  performance: (daysBack: number) =>
    [...hashtagKeys.all(), "performance", daysBack] as const,
  notes: () => [...hashtagKeys.all(), "notes"] as const,
};

/* ========== queries ========== */

export function topPerformingHashtagsOptions(daysBack = 90) {
  return {
    queryKey: hashtagKeys.performance(daysBack),
    queryFn: async (): Promise<HashtagPerformance[]> => {
      return (await getTopPerformingHashtagsAction(daysBack)) as HashtagPerformance[];
    },
    staleTime: 5 * 60 * 1000,
  };
}

export function useTopPerformingHashtags(daysBack = 90) {
  return useQuery(topPerformingHashtagsOptions(daysBack));
}

export function hashtagNotesOptions() {
  return {
    queryKey: hashtagKeys.notes(),
    queryFn: async () => {
      return (await listHashtagNotesAction()) as HashtagNote[];
    },
    staleTime: 60 * 1000,
  };
}

export function useHashtagNotes() {
  return useQuery(hashtagNotesOptions());
}

/* ========== mutations ========== */

export function useMarkHashtagProven() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { hashtag: string; note: string }) =>
      markHashtagProvenAction(input.hashtag, input.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: hashtagKeys.notes() }),
  });
}