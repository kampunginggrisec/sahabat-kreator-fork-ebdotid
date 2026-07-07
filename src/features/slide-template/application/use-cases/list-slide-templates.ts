"use server";

import { db } from "@/shared/infrastructure/database/client";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { eq, desc } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const listSlideTemplatesAction = withWorkspacePermission(
  ["owner", "admin", "member", "viewer"],
  async (ctx) => {
    return db.query.slideTemplate.findMany({
      where: eq(slideTemplate.workspaceId, ctx.teamId),
      orderBy: [desc(slideTemplate.isDefault), desc(slideTemplate.updatedAt)],
    });
  }
);

export async function getDefaultTemplate(workspaceId: string) {
  const templates = await db.query.slideTemplate.findMany({ where: eq(slideTemplate.workspaceId, workspaceId) });
  return templates.find((t) => t.isDefault) ?? templates[0] ?? null;
}
