"use server";

import { generateAiText } from "@/features/ai-provider/application/use-cases/generate-ai-text";
import { buildCarouselPrompt } from "../../infrastructure/prompts/carousel.prompt";
import { buildKnowledgeContext } from "@/features/knowledge-base/application/use-cases/build-knowledge-context";
import { renderSlideToPngBuffer } from "../../infrastructure/render/slide-renderer";
import { getDefaultTemplate } from "@/features/slide-template/application/use-cases/list-slide-templates";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { and } from "drizzle-orm";
import { r2Client } from "@/shared/infrastructure/storage/r2-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/shared/infrastructure/database/client";
import { brandVoice } from "@/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { nanoid } from "nanoid";

export const generateCarouselAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, sourceText: string, slideCount: number = 6, templateId?: string) => {
    if (sourceText.trim().length < 10) {
      throw new Error("Teks sumber terlalu pendek untuk dibuat carousel.");
    }
    if (slideCount < 3 || slideCount > 10) {
      throw new Error("Jumlah slide harus antara 3-10.");
    }

    const bv = await db.query.brandVoice.findFirst({ where: eq(brandVoice.workspaceId, ctx.teamId) });
    const knowledgeContext = await buildKnowledgeContext(ctx.teamId, sourceText);

    const { systemPrompt, userMessage } = buildCarouselPrompt(
      sourceText,
      slideCount,
      bv
        ? {
            brandName: bv.brandName, tagline: bv.tagline, industry: bv.industry,
            toneDescription: bv.toneDescription, personalityTraits: bv.personalityTraits ?? [],
            dos: bv.dos ?? [], donts: bv.donts ?? [], targetAudience: bv.targetAudience,
          }
        : null,
      knowledgeContext
    );

    const result = await generateAiText(ctx.teamId, { systemPrompt, userMessage, maxTokens: 1000 }, "carousel-generation");

    const cleaned = result.text.replace(/```json|```/g, "").trim();
    let slideTexts: string[];
    try {
      slideTexts = JSON.parse(cleaned) as string[];
    } catch {
      throw new Error("Gagal memproses slide dari AI. Coba lagi.");
    }

    // pilih template: parameter eksplisit atau default workspace
    const template = templateId
      ? await db.query.slideTemplate.findFirst({ where: and(eq(slideTemplate.id, templateId), eq(slideTemplate.workspaceId, ctx.teamId)) })
      : await getDefaultTemplate(ctx.teamId);

    // Render tiap slide jadi PNG dan upload ke R2
    const slides = await Promise.all(
      slideTexts.map(async (text, i) => {
        const buffer = await renderSlideToPngBuffer(text, i + 1, slideTexts.length, template ?? null);
        const key = `${ctx.teamId}/carousel/${nanoid()}-slide-${i + 1}.png`;

        await r2Client.send(new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: key,
          Body: buffer,
          ContentType: "image/png",
        }));

        return { order: i + 1, text, imageUrl: `https://${process.env.R2_PUBLIC_URL}/${key}` };
      })
    );

    return slides;
  }
);