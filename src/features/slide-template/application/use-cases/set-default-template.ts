"use server";

import { db } from "@/shared/infrastructure/database/client";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const setDefaultTemplateAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, templateId: string) => {
    await db.update(slideTemplate).set({ isDefault: false }).where(eq(slideTemplate.workspaceId, ctx.teamId));
    await db
      .update(slideTemplate)
      .set({ isDefault: true })
      .where(and(eq(slideTemplate.id, templateId), eq(slideTemplate.workspaceId, ctx.teamId)));
  }
);
