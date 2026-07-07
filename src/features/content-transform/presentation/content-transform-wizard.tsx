"use client";

import { useState } from "react";
import { SourcePicker } from "./components/source-picker";
import { TransformModeSelector } from "./components/transform-mode-selector";
import { TransformResultList } from "./components/transform-result-list";
import { generateContentVariantsAction } from "../application/use-cases/generate-content-variants";
import { repurposeContentAction } from "../application/use-cases/repurpose-content";
import type { TransformMode } from "../domain/value-objects/transform-mode.vo";
import { generateCarouselAction } from "../application/use-cases/generate-carousel";
import { CarouselPreview } from "./components/carousel-preview";
import type { ReplizPlatform } from "@/features/social-integration/domain/value-objects/repliz-platform.vo";

type Step = "source" | "mode" | "result";

export function ContentTransformWizard() {
  const [step, setStep] = useState<Step>("source");
  const [sourceText, setSourceText] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState<ReplizPlatform>("instagram");
  const [sourceContentId, setSourceContentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ caption: string; hashtags: string[] }[]>([]);
  const [resultPlatform, setResultPlatform] = useState<ReplizPlatform>("instagram");
  const [transformType, setTransformType] = useState<TransformMode>("variant");
  const [carouselSlides, setCarouselSlides] = useState<{ order: number; text: string; imageUrl: string }[]>([]);

  function handleSourceSelected(text: string, platform: string, contentId: string | null) {
    setSourceText(text);
    setSourcePlatform(platform as ReplizPlatform);
    setSourceContentId(contentId);
    setStep("mode");
  }

  async function handleGenerate(mode: TransformMode, targetPlatform: string, count: number) {
    setIsGenerating(true);
    setError(null);
    setTransformType(mode);

    try {
      if (mode === "variant") {
        const variants = await generateContentVariantsAction(sourceText, sourcePlatform, count);
        setResults(variants);
        setResultPlatform(sourcePlatform);
      } else if (mode === "carousel") {
        const slides = await generateCarouselAction(sourceText, count);
        setCarouselSlides(slides);
        setResults([]);
        setResultPlatform(sourcePlatform);
      } else {
        const repurposed = await repurposeContentAction(sourceText, sourcePlatform, targetPlatform);
        setResults([repurposed]);
        setResultPlatform(targetPlatform as ReplizPlatform);
      }

      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === "source" && <SourcePicker onSelect={handleSourceSelected} />}

      {step === "mode" && (
        <div className="space-y-4">
          <div className="rounded-lg border bg-accent/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">Konten sumber:</p>
            <p className="text-sm line-clamp-3">{sourceText}</p>
          </div>
          <TransformModeSelector
            sourcePlatform={sourcePlatform}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
        </div>
      )}

      {step === "result" && (
        <div className="space-y-4">
          {transformType === "carousel" ? (
            <CarouselPreview slides={carouselSlides} platform={sourcePlatform} parentContentId={sourceContentId} />
          ) : (
            <TransformResultList
              results={results}
              platform={resultPlatform}
              parentContentId={sourceContentId}
              transformType={transformType}
            />
          )}
          <button
            onClick={() => {
              setStep("source");
              setResults([]);
              setCarouselSlides([]);
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Transform konten lain
          </button>
        </div>
      )}
    </div>
  );
}