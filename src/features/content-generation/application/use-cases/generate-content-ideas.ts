"use server";

import { generateAiText } from "@/features/ai-provider/application/use-cases/generate-ai-text";
import { buildContentIdeaPrompt } from "../../infrastructure/prompts/content-idea.prompt";
import { db } from "@/shared/infrastructure/database/client";
import { brandVoice } from "@/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import type { ContentIdea } from "../../domain/entities/content-idea.entity";
import { buildKnowledgeContext } from "@/features/knowledge-base/application/use-cases/build-knowledge-context";
import { z } from "zod";

const briefSchema = z.string().min(5, "Brief terlalu singkat, jelaskan topik/produk yang ingin dibahas.");
const platformSchema = z.string().min(1, "Platform tidak boleh kosong");

export const generateContentIdeasAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, brief: unknown, platform: unknown): Promise<ContentIdea[]> => {
    const validatedBrief = briefSchema.parse(brief);
    const validatedPlatform = platformSchema.parse(platform);

    const bv = await db.query.brandVoice.findFirst({
      where: eq(brandVoice.workspaceId, ctx.teamId),
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

    const knowledgeContext = await buildKnowledgeContext(ctx.teamId, validatedBrief);
    const { systemPrompt: baseSystemPrompt, userMessage } = buildContentIdeaPrompt(
      validatedBrief,
      validatedPlatform,
      brandVoiceData
    );
    const systemPrompt = knowledgeContext ? `${baseSystemPrompt}\n\n${knowledgeContext}` : baseSystemPrompt;

    const result = await generateAiText(
      ctx.teamId,
      { systemPrompt, userMessage, maxTokens: 800 },
      "content-idea-generation"
    );

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned) as ContentIdea[];
    } catch {
      throw new Error("Gagal memproses ide dari AI. Coba generate ulang.");
    }
  }
);
