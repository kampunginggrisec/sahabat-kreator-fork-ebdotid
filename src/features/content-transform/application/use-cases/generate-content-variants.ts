"use server";

import { generateAiText } from "@/features/ai-provider/application/use-cases/generate-ai-text";
import { buildVariantPrompt } from "../../infrastructure/prompts/variant.prompt";
import { buildKnowledgeContext } from "@/features/knowledge-base/application/use-cases/build-knowledge-context";
import { db } from "@/shared/infrastructure/database/client";
import { brandVoice } from "@/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const generateContentVariantsAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, sourceText: string, platform: string, count: number = 3) => {
    if (sourceText.trim().length < 10) {
      throw new Error("Teks sumber terlalu pendek untuk dibuat variasi.");
    }

    const bv = await db.query.brandVoice.findFirst({ where: eq(brandVoice.workspaceId, ctx.teamId) });
    const knowledgeContext = await buildKnowledgeContext(ctx.teamId, sourceText);

    const { systemPrompt, userMessage } = buildVariantPrompt(
      sourceText,
      platform,
      count,
      bv
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
        : null,
      knowledgeContext
    );

    const result = await generateAiText(ctx.teamId, { systemPrompt, userMessage, maxTokens: 1200 }, "content-variant");

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as { caption: string; hashtags: string[] }[];
    } catch {
      throw new Error("Gagal memproses variasi dari AI. Coba lagi.");
    }
  }
);