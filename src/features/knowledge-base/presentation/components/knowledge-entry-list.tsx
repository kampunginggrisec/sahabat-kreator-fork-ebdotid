"use client";

import { useDeleteKnowledgeEntry, type KnowledgeEntry } from "../hooks/use-knowledge-entries";
import { KNOWLEDGE_CATEGORY_LABELS } from "../../domain/value-objects/knowledge-category.vo";

interface KnowledgeEntryListProps {
  entries: KnowledgeEntry[];
}

export function KnowledgeEntryList({ entries }: KnowledgeEntryListProps) {
  const deleteMutation = useDeleteKnowledgeEntry();

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada knowledge entry. Tambahkan fakta pertama tentang brand kamu.
      </p>
    );
  }

  function handleDelete(id: string, title: string) {
    if (!confirm(`Hapus "${title}"?`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <div key={entry.id} className="space-y-2 rounded-lg border p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {entry.isPinned && <span className="text-xs">📌</span>}
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium">
                {KNOWLEDGE_CATEGORY_LABELS[entry.category as keyof typeof KNOWLEDGE_CATEGORY_LABELS]}
              </span>
            </div>
            <button
              onClick={() => handleDelete(entry.id, entry.title)}
              disabled={deleteMutation.isPending}
              className="text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
            >
              Hapus
            </button>
          </div>
          <p className="text-sm font-medium">{entry.title}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{entry.content}</p>
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded bg-accent/60 px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}