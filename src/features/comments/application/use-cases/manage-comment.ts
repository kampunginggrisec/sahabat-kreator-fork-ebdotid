"use server";

import { getOneComment, replyToComment, updateCommentStatus } from "@/features/social-integration/infrastructure/repliz/repliz-client";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { replyCommentSchema, updateCommentStatusSchema } from "@/features/shared/domain/validation-input-schemas";
import { z } from "zod";

const commentIdSchema = z.string().min(1, "ID tidak valid");

export const getCommentAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (_ctx, commentId: unknown) => {
        const id = commentIdSchema.parse(commentId);
        return getOneComment(id);
    }
);

export const replyCommentAction = withWorkspacePermission(
    ["owner", "admin", "member"],
    async (_ctx, input: unknown) => {
        const { commentId, text } = parseActionInput(replyCommentSchema, input);
        return replyToComment(commentId, text);
    }
);

export const updateCommentStatusAction = withWorkspacePermission(
    ["owner", "admin", "member"],
    async (_ctx, input: unknown) => {
        const { commentId, status } = parseActionInput(updateCommentStatusSchema, input);
        await updateCommentStatus(commentId, status);
    }
);
