"use server";

import { db } from "@/shared/infrastructure/database/client";
import { slideTemplate } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { nanoid } from "nanoid";
import type { LogoPosition } from "../../domain/entities/slide-template.entity";

type CreateTemplateInput = {
  name: string;
  backgroundColor: string;
  backgroundImageUrl: string;
  textColor: string;
  fontFamily: string;
  logoUrl: string;
  logoPosition: LogoPosition;
};

export const createSlideTemplateAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, input: CreateTemplateInput) => {
    if (input.name.trim().length < 2) throw new Error("Nama template terlalu pendek.");

    await db.insert(slideTemplate).values({
      id: nanoid(),
      workspaceId: ctx.teamId,
      name: input.name,
      backgroundColor: input.backgroundColor,
      backgroundImageUrl: input.backgroundImageUrl || null,
      textColor: input.textColor,
      fontFamily: input.fontFamily,
      logoUrl: input.logoUrl || null,
      logoPosition: input.logoPosition,
    });
  }
);
