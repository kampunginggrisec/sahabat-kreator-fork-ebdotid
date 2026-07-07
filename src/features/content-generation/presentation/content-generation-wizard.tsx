"use client";

import { useState, useRef } from "react";
import { ContentBriefForm } from "./components/content-brief-form";
import { ContentIdeaList } from "./components/content-idea-list";
import { CaptionEditor } from "./components/caption-editor";
import type { ContentIdea } from "../domain/entities/content-idea.entity";
import type { PlatformType, SaveContentInput } from "./hooks/use-content-generation";
import {
  useGenerateContentIdeas,
  useGenerateCaption,
  useSaveGeneratedContent,
} from "./hooks/use-content-generation";

type Step = "brief" | "ideas" | "caption" | "done";

const PLATFORMS: PlatformType[] = ["instagram", "tiktok", "youtube", "facebook", "x"];

export function ContentGenerationWizard({ prefillBrief }: { prefillBrief?: string }) {
  const [step, setStep] = useState<Step>("brief");
  const [brief, setBrief] = useState("");
  const [platform, setPlatform] = useState<PlatformType>("instagram");
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<ContentIdea | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateIdeasMutation = useGenerateContentIdeas();
  const generateCaptionMutation = useGenerateCaption();
  const saveContentMutation = useSaveGeneratedContent();

  // Track current inputs for regeneration without relying on stale closures
  const stateRef = useRef({ brief, platform });
  stateRef.current = { brief, platform };

  function dismissError() {
    setError(null);
  }

  async function handleGenerateIdeas(briefInput: string, platformInput: string) {
    setBrief(briefInput);
    setPlatform(platformInput as PlatformType);
    dismissError();
    try {
      const result = await generateIdeasMutation.mutateAsync({ brief: briefInput, platform: platformInput });
      setIdeas(result as ContentIdea[]);
      setStep("ideas");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate ide.");
    }
  }

  async function handleSelectIdea(idea: ContentIdea) {
    setSelectedIdea(idea);
    dismissError();
    try {
      const result = await generateCaptionMutation.mutateAsync({ idea, platform });
      setCaption(result.caption);
      setHashtags(result.hashtags);
      setStep("caption");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal generate caption.");
    }
  }

  async function handleSaveCaption(finalCaption: string, finalHashtags: string[]) {
    if (!selectedIdea) return;
    dismissError();
    try {
      const payload: SaveContentInput = {
        brief,
        platform,
        idea: selectedIdea,
        caption: finalCaption,
        hashtags: finalHashtags,
      };
      await saveContentMutation.mutateAsync(payload);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan konten.");
    }
  }

  const isLoading = generateIdeasMutation.isPending || generateCaptionMutation.isPending || saveContentMutation.isPending;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {step === "brief" && (
        <ContentBriefForm
          onGenerate={handleGenerateIdeas}
          isGenerating={isLoading}
          initialBrief={prefillBrief}
        />
      )}

      {step === "ideas" && (
        <ContentIdeaList
          ideas={ideas}
          onSelect={handleSelectIdea}
          onRegenerate={() => handleGenerateIdeas(stateRef.current.brief, stateRef.current.platform)}
          isRegenerating={isLoading}
        />
      )}

      {step === "caption" && (
        <CaptionEditor
          initialCaption={caption}
          initialHashtags={hashtags}
          onSave={handleSaveCaption}
          isSaving={isLoading}
        />
      )}

      {step === "done" && (
        <div className="space-y-3 rounded-lg border p-6 text-center">
          <p className="text-sm font-medium">Konten tersimpan sebagai draft.</p>
          <button
            onClick={() => {
              setStep("brief");
              setBrief("");
              setIdeas([]);
              setSelectedIdea(null);
              setCaption("");
              setHashtags([]);
              dismissError();
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Buat konten baru
          </button>
        </div>
      )}
    </div>
  );
}