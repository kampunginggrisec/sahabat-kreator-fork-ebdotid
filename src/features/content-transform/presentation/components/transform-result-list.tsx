"use client";

import { useState } from "react";
import { Button } from "@/shared/presentation/components/ui/button";
import { saveTransformedContentAction } from "../../application/use-cases/save-transformed-content";
import type { ReplizPlatform } from "@/features/social-integration/domain/value-objects/repliz-platform.vo";

type Result = { caption: string; hashtags: string[] };

export function TransformResultList({
  results,
  platform,
  parentContentId,
  transformType,
}: {
  results: Result[];
  platform: ReplizPlatform;
  parentContentId: string | null;
  transformType: "variant" | "repurpose";
}) {

  const [savedIndexes, setSavedIndexes] = useState<Set<number>>(new Set());

  async function handleSave(result: Result, index: number) {
    await saveTransformedContentAction({
      parentContentId,
      transformType,
      platform,
      caption: result.caption,
      hashtags: result.hashtags,
    });
    setSavedIndexes((prev) => new Set(prev).add(index));
  }

  return (
    <div className="space-y-3">
      {results.map((result, i) => (
        <div key={i} className="space-y-2 rounded-lg border p-4">
          <p className="whitespace-pre-wrap text-sm">{result.caption}</p>
          {result.hashtags.length > 0 && (
            <p className="text-xs text-muted-foreground">{result.hashtags.join(" ")}</p>
          )}
          <Button
            type="button"
            variant="outline"
            disabled={savedIndexes.has(i)}
            onClick={() => handleSave(result, i)}
          >
            {savedIndexes.has(i) ? "Tersimpan ✓" : "Simpan sebagai draft"}
          </Button>
        </div>
      ))}
    </div>
  );
}