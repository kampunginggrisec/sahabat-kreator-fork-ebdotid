"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listKnowledgeEntriesAction } from "../../application/use-cases/list-knowledge-entries";
import { addKnowledgeEntryAction } from "../../application/use-cases/add-knowledge-entry";
import { deleteKnowledgeEntryAction } from "../../application/use-cases/delete-knowledge-entry";
import type { KnowledgeEntry } from "../../domain/entities/knowledge-entry.entity";

// Re-export so consumers don't need to know the domain path
export type { KnowledgeEntry } from "../../domain/entities/knowledge-entry.entity";

export type KnowledgeEntryInput = Parameters<typeof addKnowledgeEntryAction>[0];

/**
 * Query keys factory.
 *
 * Pattern: single source of truth that callers pass to invalidateQueries,
 * keepPreviousData pagination, and infinite loading.
 *
 * Usage:
 * ```ts
 * import { knowledgeKeys, useKnowledgeEntries } from "./hooks/use-knowledge-entries";
 *
 * // query
 * const { data } = useQuery(knowledgeKeys.entries());
 *
 * // invalidation from a mutation
 * qc.invalidateQueries({ queryKey: knowledgeKeys.entries() });
 * ```
 */
export const knowledgeKeys = {
  all: () => ["knowledge"] as const,
  lists: () => [...knowledgeKeys.all(), "list"] as const,
  entry: (id: string) => [...knowledgeKeys.lists(), id] as const,
};

export function knowledgeEntriesOptions() {
  return {
    queryKey: knowledgeKeys.lists(),
    queryFn: async () => {
      const raw = await listKnowledgeEntriesAction();
      return raw as KnowledgeEntry[];
    },
    staleTime: 60 * 1000,
  };
}

export function useKnowledgeEntries() {
  return useQuery(knowledgeEntriesOptions());
}

export function useAddKnowledgeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: KnowledgeEntryInput) => addKnowledgeEntryAction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: knowledgeKeys.lists() }),
  });
}

export function useDeleteKnowledgeEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteKnowledgeEntryAction(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: knowledgeKeys.lists() }),
  });
}