"use server";

import { db } from "@/shared/infrastructure/database/client";
import { aiProviderConfig } from "@/shared/infrastructure/database/schema";
import { eq } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { encryptApiKey } from "../../infrastructure/crypto/encrypt-api-key";
import { nanoid } from "nanoid";
import type { AIProviderType } from "../../domain/value-objects/provider-type.vo";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { z } from "zod";

const saveAiProviderConfigSchema = z.object({
  providerType: z.enum(["anthropic", "openai", "gemini", "custom", "platform_sumopod"]) as z.ZodType<AIProviderType>,
  apiKey: z.string().optional(),
  customBaseUrl: z.string().optional(),
  model: z.string().optional(),
});

export const saveAiProviderConfigAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, input: unknown) => {
    const validated = parseActionInput(saveAiProviderConfigSchema, input);
    const existing = await db.query.aiProviderConfig.findFirst({
      where: eq(aiProviderConfig.workspaceId, ctx.teamId),
    });

    const data = {
      providerType: validated.providerType,
      apiKeyEncrypted: validated.apiKey ? encryptApiKey(validated.apiKey) : null,
      customBaseUrl: validated.customBaseUrl ?? null,
      model: validated.model ?? null,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(aiProviderConfig)
        .set(data)
        .where(eq(aiProviderConfig.workspaceId, ctx.teamId));
    } else {
      await db.insert(aiProviderConfig).values({
        id: nanoid(),
        workspaceId: ctx.teamId,
        ...data,
      });
    }
  }
);