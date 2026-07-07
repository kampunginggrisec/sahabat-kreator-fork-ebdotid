"use server";

import { generateAiText } from "@/features/ai-provider/application/use-cases/generate-ai-text";
import { buildCaptionPrompt } from "../../infrastructure/prompts/caption.prompt";
import { db } from "@/shared/infrastructure/database/client";
import { brandVoice, brandVoicePlatformOverride } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import type { ContentIdea } from "../../domain/entities/content-idea.entity";
import { buildKnowledgeContext } from "@/features/knowledge-base/application/use-cases/build-knowledge-context";

export const generateCaptionFromIdeaAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, idea: ContentIdea, platform: "instagram" | "tiktok" | "youtube" | "facebook" | "x") => {
    const bv = await db.query.brandVoice.findFirst({
      where: eq(brandVoice.workspaceId, ctx.teamId),
    });

    const override = await db.query.brandVoicePlatformOverride.findFirst({
      where: and(
        eq(brandVoicePlatformOverride.workspaceId, ctx.teamId),
        eq(brandVoicePlatformOverride.platform, platform)
      ),
    });

    const brandVoiceData = bv
      ? {
          brandName: bv.brandName,
          tagline: bv.tagline,
          industry: bv.industry,
          toneDescription: bv.toneDescription,
          personalityTraits: bv.personalityTraits ?? [],
          dos: bv.dos ?? [],
          donts: bv.donts ?? [],
          targetAudience: bv.targetAudience,
        }
      : null;

    const knowledgeContext = await buildKnowledgeContext(ctx.teamId, idea.hook);
    const { systemPrompt: baseSystemPrompt, userMessage } = buildCaptionPrompt(
      idea,
      platform,
      brandVoiceData,
      override?.toneAdjustment ?? null
    );
    const systemPrompt = knowledgeContext ? `${baseSystemPrompt}\n\n${knowledgeContext}` : baseSystemPrompt;

    const result = await generateAiText(
      ctx.teamId,
      { systemPrompt, userMessage, maxTokens: 600 },
      "caption-generation"
    );

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as { caption: string; hashtags: string[] };
    } catch {
      throw new Error("Gagal memproses caption dari AI. Coba generate ulang.");
    }
  }
);
