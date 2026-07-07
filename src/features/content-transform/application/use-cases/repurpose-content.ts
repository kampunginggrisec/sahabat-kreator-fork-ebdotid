"use server";

import { generateAiText } from "@/features/ai-provider/application/use-cases/generate-ai-text";
import { buildRepurposePrompt } from "../../infrastructure/prompts/repurpose.prompt";
import { buildKnowledgeContext } from "@/features/knowledge-base/application/use-cases/build-knowledge-context";
import { db } from "@/shared/infrastructure/database/client";
import { brandVoice } from "@/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const repurposeContentAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, sourceText: string, sourcePlatform: string, targetPlatform: string) => {
    if (sourceText.trim().length < 10) {
      throw new Error("Teks sumber terlalu pendek untuk direpurpose.");
    }

    const bv = await db.query.brandVoice.findFirst({ where: eq(brandVoice.workspaceId, ctx.teamId) });
    const knowledgeContext = await buildKnowledgeContext(ctx.teamId, sourceText);

    const { systemPrompt, userMessage } = buildRepurposePrompt(
      sourceText,
      sourcePlatform,
      targetPlatform,
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

    const result = await generateAiText(ctx.teamId, { systemPrompt, userMessage, maxTokens: 800 }, "content-repurpose");

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as { caption: string; hashtags: string[] };
    } catch {
      throw new Error("Gagal memproses hasil repurpose dari AI. Coba lagi.");
    }
  }
);