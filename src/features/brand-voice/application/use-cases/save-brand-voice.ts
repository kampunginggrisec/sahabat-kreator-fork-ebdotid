"use server";

import { db } from "@/shared/infrastructure/database/client";
import { brandVoice } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { saveBrandVoiceSchema } from "@/features/shared/domain/validation-input-schemas";

export const saveBrandVoiceAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, input: unknown) => {
    const validated = parseActionInput(saveBrandVoiceSchema, input);
    const existing = await db.query.brandVoice.findFirst({
      where: eq(brandVoice.workspaceId, ctx.teamId),
    });

    if (existing) {
      await db
        .update(brandVoice)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(brandVoice.workspaceId, ctx.teamId));
    } else {
      await db.insert(brandVoice).values({
        id: nanoid(),
        workspaceId: ctx.teamId,
        ...validated,
      });
    }
  }
);