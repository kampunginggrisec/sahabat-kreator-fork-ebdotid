"use server";

import { listChats, getOneChat, listChatMessages } from "@/features/social-integration/infrastructure/repliz/repliz-client";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { z } from "zod";

const listChatsSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
    status: z.enum(["unread", "unreplied"]).optional(),
    search: z.string().optional(),
});

const chatIdSchema = z.string().min(1);
const listChatMessagesSchema = z.object({
    page: z.number().int().min(1),
    limit: z.number().int().min(1).max(100),
});

export const listChatsAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (_ctx, input: unknown) => {
        const options = parseActionInput(listChatsSchema, input);
        return listChats(options);
    }
);

export const getChatAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (_ctx, chatId: unknown) => {
        const id = chatIdSchema.parse(chatId);
        return getOneChat(id);
    }
);

export const listChatMessagesAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (_ctx, chatId: unknown, options: unknown) => {
        const id = chatIdSchema.parse(chatId);
        const opts = parseActionInput(listChatMessagesSchema, options);
        return listChatMessages(id, opts);
    }
);
