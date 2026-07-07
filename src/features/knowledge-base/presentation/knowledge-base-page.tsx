"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KnowledgeEntryForm } from "./components/knowledge-entry-form";
import { KnowledgeEntryList } from "./components/knowledge-entry-list";
import { Button } from "@/shared/presentation/components/ui/button";
import {
  knowledgeEntriesOptions,
  type KnowledgeEntry,
} from "./hooks/use-knowledge-entries";

export function KnowledgeBasePage() {
  const [showForm, setShowForm] = useState(false);
  const { data: entries = [], isLoading } = useQuery(knowledgeEntriesOptions());

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-muted/50" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg border bg-muted/30" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm && <KnowledgeEntryForm onClose={() => setShowForm(false)} />}

      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Tutup" : "+ Tambah Entry"}
        </Button>
      </div>

      <KnowledgeEntryList entries={entries as KnowledgeEntry[]} />
    </div>
  );
}