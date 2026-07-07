"use server";

import { db } from "@/shared/infrastructure/database/client";
import { generatedContent } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { nanoid } from "nanoid";
import type { ReplizPlatform } from "@/features/social-integration/domain/value-objects/repliz-platform.vo";

type SaveTransformInput = {
  parentContentId: string | null; // null kalau source-nya paste teks bebas, bukan dari draft existing
  transformType: "variant" | "repurpose";
  platform: ReplizPlatform;
  caption: string;
  hashtags: string[];
};

export const saveTransformedContentAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, input: SaveTransformInput) => {
    await db.insert(generatedContent).values({
      id: nanoid(),
      workspaceId: ctx.teamId,
      brief: `[${input.transformType === "variant" ? "Variasi" : input.transformType === "repurpose" ? "Repurpose" : "Carousel"} dari konten lain]`,
      platform: input.platform,
      selectedHook: "-",
      selectedPillar: "-",
      selectedAngle: "-",
      caption: input.caption,
      hashtags: input.hashtags,
      status: "draft",
      createdBy: ctx.userId,
      parentContentId: input.parentContentId,
      transformType: input.transformType,
    });
  }
);