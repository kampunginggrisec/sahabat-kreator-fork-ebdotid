"use server";

import { sendChatMessage, readChat } from "@/features/social-integration/infrastructure/repliz/repliz-client";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { z } from "zod";
import { sendChatMessageSchema } from "@/features/shared/domain/validation-input-schemas";

const chatIdSchema = z.string().min(1, "ID chat tidak valid");

export const sendChatMessageAction = withWorkspacePermission(
    ["owner", "admin", "member"],
    async (_ctx, chatId: unknown, message: unknown) => {
        const id = chatIdSchema.parse(chatId);
        const validated = parseActionInput(sendChatMessageSchema, message);
        return sendChatMessage(id, validated);
    }
);

export const readChatAction = withWorkspacePermission(
    ["owner", "admin", "member"],
    async (_ctx, chatId: unknown) => {
        const id = chatIdSchema.parse(chatId);
        await readChat(id);
    }
);