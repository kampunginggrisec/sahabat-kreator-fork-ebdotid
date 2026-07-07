"use server";

import { db } from "@/shared/infrastructure/database/client";
import { generatedContent } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { nanoid } from "nanoid";
import type { ContentIdea } from "../../domain/entities/content-idea.entity";
import { z } from "zod";

const saveGeneratedContentSchema = z.object({
  brief: z.string().min(1, "Brief tidak boleh kosong"),
  platform: z.enum(["instagram", "tiktok", "youtube", "facebook", "x"]),
  idea: z.object({
    hook: z.string().min(1),
    pillar: z.string().min(1),
    angle: z.string().min(1),
  }) as z.ZodType<ContentIdea>,
  caption: z.string().min(1),
  hashtags: z.array(z.string()),
});

export const saveGeneratedContentAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, input: unknown) => {
    const validated = parseActionInput(saveGeneratedContentSchema, input);
    await db.insert(generatedContent).values({
      id: nanoid(),
      workspaceId: ctx.teamId,
      brief: validated.brief,
      platform: validated.platform,
      selectedHook: validated.idea.hook,
      selectedPillar: validated.idea.pillar,
      selectedAngle: validated.idea.angle,
      caption: validated.caption,
      hashtags: validated.hashtags,
      status: "draft",
      createdBy: ctx.userId,
    });
  }
);