"use server";

import { db } from "@/shared/infrastructure/database/client";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import type { LogoPosition } from "../../domain/entities/slide-template.entity";

type UpdateTemplateInput = {
  id: string;
  name: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  textColor: string;
  fontFamily: string;
  logoUrl: string;
  logoPosition: LogoPosition;
};

export const updateSlideTemplateAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, input: UpdateTemplateInput) => {
    await db
      .update(slideTemplate)
      .set({
        name: input.name,
        backgroundColor: input.backgroundColor,
        backgroundImageUrl: input.backgroundImageUrl || null,
        textColor: input.textColor,
        fontFamily: input.fontFamily,
        logoUrl: input.logoUrl || null,
        logoPosition: input.logoPosition,
        updatedAt: new Date(),
      })
      .where(and(eq(slideTemplate.id, input.id), eq(slideTemplate.workspaceId, ctx.teamId)));
  }
);
