"use client";

import { useState } from "react";
import { Button } from "@/shared/presentation/components/ui/button";
import { saveCarouselContentAction } from "../../application/use-cases/save-carousel-content";

type Slide = { order: number; text: string; imageUrl: string };

export function CarouselPreview({
  slides,
  platform,
  parentContentId,
}: {
  slides: Slide[];
  platform: "instagram" | "facebook" | "threads" | "tiktok" | "linkedin" | "youtube";
  parentContentId: string | null;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setIsSaving(true);
    await saveCarouselContentAction({ parentContentId, platform, slides });
    setIsSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 overflow-x-auto pb-2">
        {slides.map((slide) => (
          <div key={slide.order} className="w-48 shrink-0 space-y-1">
            <img src={slide.imageUrl} alt={`Slide ${slide.order}`} className="aspect-[4/5] w-full rounded-md object-cover" />
            <p className="text-xs text-muted-foreground">Slide {slide.order}</p>
          </div>
        ))}
      </div>

      <Button type="button" isLoading={isSaving} disabled={saved} onClick={handleSave}>
        {saved ? "Tersimpan ✓" : "Simpan sebagai draft"}
      </Button>
    </div>
  );
}