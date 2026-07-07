"use server";

import { db } from "@/shared/infrastructure/database/client";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const deleteSlideTemplateAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, templateId: string) => {
    await db.delete(slideTemplate).where(and(eq(slideTemplate.id, templateId), eq(slideTemplate.workspaceId, ctx.teamId)));
  }
);
