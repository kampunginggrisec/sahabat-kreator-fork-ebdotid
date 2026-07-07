"use client";

import { useMutation } from "@tanstack/react-query";
import { generateContentIdeasAction } from "../../application/use-cases/generate-content-ideas";
import { generateCaptionFromIdeaAction } from "../../application/use-cases/generate-caption-from-idea";
import { saveGeneratedContentAction } from "../../application/use-cases/save-generated-content";
import type { ContentIdea } from "../../domain/entities/content-idea.entity";

export type { ContentIdea } from "../../domain/entities/content-idea.entity";

export type PlatformType = "instagram" | "tiktok" | "youtube" | "facebook" | "x";
export interface SaveContentPayload {
  brief: string;
  platform: PlatformType;
  idea: { hook: string; pillar: string; angle: string };
  caption: string;
  hashtags: string[];
}

export type SaveContentInput = SaveContentPayload;

export function useGenerateContentIdeas() {
  return useMutation({
    mutationFn: (input: { brief: string; platform: string }) =>
      generateContentIdeasAction(input.brief, input.platform) as Promise<ContentIdea[]>,
  });
}

export function useGenerateCaption() {
  return useMutation({
    mutationFn: (input: { idea: ContentIdea; platform: PlatformType }) =>
      generateCaptionFromIdeaAction(input.idea, input.platform) as Promise<{
        caption: string;
        hashtags: string[];
      }>,
  });
}

export function useSaveGeneratedContent() {
  return useMutation({
    mutationFn: (input: SaveContentInput) => saveGeneratedContentAction(input),
  });
}