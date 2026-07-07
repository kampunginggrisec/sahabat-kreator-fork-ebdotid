"use server";

import { db } from "@/shared/infrastructure/database/client";
import { generatedContent } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { nanoid } from "nanoid";

type SaveCarouselInput = {
  parentContentId: string | null;
  platform: "instagram" | "tiktok" | "facebook" | "threads" | "linkedin" | "youtube";
  slides: { order: number; text: string; imageUrl: string }[];
};

export const saveCarouselContentAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, input: SaveCarouselInput) => {
    await db.insert(generatedContent).values({
      id: nanoid(),
      workspaceId: ctx.teamId,
      brief: "[Carousel dari Content Transform]",
      platform: input.platform,
      selectedHook: input.slides[0]?.text ?? "-",
      selectedPillar: "-",
      selectedAngle: "-",
      caption: input.slides.map((s) => s.text).join("\n\n"), // fallback teks gabungan, buat search/preview
      hashtags: [],
      status: "draft",
      createdBy: ctx.userId,
      parentContentId: input.parentContentId,
      transformType: "carousel",
      slides: input.slides,
      contentFormat: "carousel",
    });
  }
);