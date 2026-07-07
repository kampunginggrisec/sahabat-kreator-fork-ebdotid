"use server";

import { db } from "@/shared/infrastructure/database/client";
import { knowledgeEntry } from "@/shared/infrastructure/database/schema";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { generateEmbedding } from "../../infrastructure/embedding/embedding-service";
import { addKnowledgeEntrySchema } from "@/features/shared/domain/validation-input-schemas";
import { nanoid } from "nanoid";

export const addKnowledgeEntryAction = withWorkspacePermission(
  ["owner", "admin", "member"],
  async (_ctx, input: unknown) => {
    const validated = parseActionInput(addKnowledgeEntrySchema, input);
    if (validated.title.trim().length < 3 || validated.content.trim().length < 10) {
      throw new Error("Judul dan isi terlalu pendek.");
    }

    // Embed gabungan title+content supaya pencarian menangkap konteks judul juga
    const embedding = await generateEmbedding(`${validated.title}\n${validated.content}`);

    await db.insert(knowledgeEntry).values({
      id: nanoid(),
      workspaceId: _ctx.teamId,
      title: validated.title,
      content: validated.content,
      category: validated.category,
      tags: validated.tags,
      isPinned: validated.isPinned,
      embedding,
    });
  }
);