"use server";

import { db } from "@/shared/infrastructure/database/client";
import { knowledgeEntry } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { generateEmbedding } from "../../infrastructure/embedding/embedding-service";
import { updateKnowledgeEntrySchema } from "@/features/shared/domain/validation-input-schemas";

export const updateKnowledgeEntryAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (ctx, input: unknown) => {
    const validated = parseActionInput(updateKnowledgeEntrySchema, input);
    // Re-generate embedding kalau title/content berubah — wajib, kalau tidak pencarian jadi basi
    const embedding = await generateEmbedding(`${validated.title}\n${validated.content}`);

    await db
      .update(knowledgeEntry)
      .set({
        title: validated.title,
        content: validated.content,
        category: validated.category,
        tags: validated.tags,
        isPinned: validated.isPinned,
        embedding,
        updatedAt: new Date(),
      })
      .where(and(eq(knowledgeEntry.id, validated.id), eq(knowledgeEntry.workspaceId, ctx.teamId)));
  }
);