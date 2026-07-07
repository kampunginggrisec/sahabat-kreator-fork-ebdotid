"use client";

import { useState } from "react";
import { Button } from "@/shared/presentation/components/ui/button";
import { generateHashtagSuggestionsAction } from "../application/use-cases/generate-hashtag-suggestions";
import {
  useHashtagNotes,
  useMarkHashtagProven,
  useTopPerformingHashtags,
  type HashtagSuggestion,
} from "./hooks/use-hashtag-research";

const SUGGESTION_LIMIT = 90;

export function HashtagResearchPage() {
  const [briefText, setBriefText] = useState("");
  const [platform, setPlatform] = useState("instagram");
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: topPerforming = [] } = useTopPerformingHashtags(SUGGESTION_LIMIT);
  const { data: notes = [] } = useHashtagNotes();
  const markProven = useMarkHashtagProven();

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateHashtagSuggestionsAction(briefText, platform);
      setSuggestions(result as HashtagSuggestion[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleMarkProven(hashtag: string) {
    const note = prompt(`Catatan untuk #${hashtag} (opsional):`) ?? "";
    markProven.mutate({ hashtag, note });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Hashtag Research</h1>
        <p className="text-sm text-muted-foreground">
          Saran AI, data performa dari kontenmu sendiri, dan catatan pribadi.
        </p>
      </div>

      <div className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-semibold">Saran AI</h2>
        <textarea
          value={briefText}
          onChange={(e) => setBriefText(e.target.value)}
          rows={3}
          placeholder="Tempel brief atau caption di sini..."
          className="w-full rounded-md border bg-background p-3 text-sm outline-none focus:border-foreground/40"
        />
        <div className="flex gap-2">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="youtube">YouTube</option>
          </select>
          <Button
            type="button"
            isLoading={isGenerating}
            onClick={handleGenerate}
            disabled={briefText.trim().length < 5}
          >
            Generate Saran
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}

        {suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {suggestions.map((s) => (
              <button
                key={s.hashtag}
                onClick={() => handleMarkProven(s.hashtag)}
                title={s.reasoning}
                className="rounded-full border px-2.5 py-1 text-xs hover:bg-accent"
              >
                #{s.hashtag} <span className="text-muted-foreground">({s.type})</span>
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          ⚠️ Ini estimasi AI, bukan data reach/volume pencarian real-time.
        </p>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">
          Terbukti dari Data Kamu (90 hari terakhir)
        </h2>
        {topPerforming.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Belum cukup data performa — perlu minimal 2x pemakaian hashtag yang sama di
            konten yang sudah terbit.
          </p>
        ) : (
          <div className="space-y-2">
            {topPerforming.map((h) => (
              <div
                key={h.hashtag}
                className="flex items-center justify-between rounded-md border p-2 text-sm"
              >
                <span>#{h.hashtag}</span>
                <span className="text-xs text-muted-foreground">
                  {h.usageCount}x dipakai · rata-rata {h.avgInteraction} interaksi
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Ditandai Manual</h2>
        {notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Belum ada hashtag yang ditandai.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-md border p-2 text-sm">
                <span className="font-medium">#{n.hashtag}</span>
                {n.note && <p className="text-xs text-muted-foreground">{n.note}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}