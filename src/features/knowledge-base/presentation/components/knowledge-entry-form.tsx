"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Input } from "@/shared/presentation/components/ui/input";
import { Label } from "@/shared/presentation/components/ui/label";
import { Button } from "@/shared/presentation/components/ui/button";
import { KNOWLEDGE_CATEGORY_LABELS } from "../../domain/value-objects/knowledge-category.vo";
import { useAddKnowledgeEntry } from "../hooks/use-knowledge-entries";

const CATEGORIES = ["product", "pricing", "policy", "faq", "other"] as const;

interface KnowledgeEntryFormProps {
  onClose: () => void;
}

interface FormData {
  title: string;
  content: string;
  category: string;
  tags: string;
  isPinned: boolean;
}

export function KnowledgeEntryForm({ onClose }: KnowledgeEntryFormProps) {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    content: "",
    category: "product",
    tags: "",
    isPinned: false,
  });
  const [error, setError] = useState<string | null>(null);

  const addMutation = useAddKnowledgeEntry();

  function handleInput<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (formData.title.trim().length < 2) {
      setError("Judul minimal 2 karakter");
      return;
    }
    if (formData.content.trim().length < 5) {
      setError("Isi minimal 5 karakter");
      return;
    }

    try {
      await addMutation.mutateAsync({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        isPinned: formData.isPinned,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="kb-title">Judul</Label>
        <Input
          id="kb-title"
          value={formData.title}
          onChange={(e) => handleInput("title", e.target.value)}
          placeholder="Contoh: Paket Berlangganan Bulanan"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kb-category">Kategori</Label>
        <select
          id="kb-category"
          value={formData.category}
          onChange={(e) => handleInput("category", e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {KNOWLEDGE_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kb-content">Isi</Label>
        <textarea
          id="kb-content"
          value={formData.content}
          onChange={(e) => handleInput("content", e.target.value)}
          rows={5}
          placeholder="Tulis fakta lengkap — harga, spesifikasi, kebijakan, dst."
          className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:border-foreground/40"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="kb-tags">Tags (pisahkan koma)</Label>
        <Input
          id="kb-tags"
          value={formData.tags}
          onChange={(e) => handleInput("tags", e.target.value)}
          placeholder="harga, bulanan, promo"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={formData.isPinned}
          onChange={(e) => handleInput("isPinned", e.target.checked)}
        />
        Selalu sertakan (pin)
      </label>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={addMutation.isPending}>Simpan</Button>
        <Button type="button" variant="outline" onClick={onClose} disabled={addMutation.isPending}>
          Batal
        </Button>
      </div>
    </form>
  );
}