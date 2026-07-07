"use server";

import { db } from "@/shared/infrastructure/database/client";
import { generatedContent, contentSchedule, replizConnection } from "@/shared/infrastructure/database/schema";
import { eq, and } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { parseActionInput } from "@/shared/lib/validation/action-validation";
import { createSchedule } from "../../infrastructure/repliz/repliz-schedule-client";
import { nanoid } from "nanoid";
import { isTypeSupportedForPlatform, getSupportedTypesLabel } from "../../domain/value-objects/schedule-status.vo";
import { scheduleContentSchema } from "@/features/shared/domain/validation-input-schemas";

export const scheduleContentAction = withWorkspacePermission(
    ["owner", "admin", "member"],
    async (ctx, input: unknown) => {
        const validated = parseActionInput(scheduleContentSchema, input);
        const content = await db.query.generatedContent.findFirst({
            where: and(eq(generatedContent.id, validated.generatedContentId), eq(generatedContent.workspaceId, ctx.teamId)),
        });
        if (!content) throw new Error("Konten tidak ditemukan.");

        const connection = await db.query.replizConnection.findFirst({
            where: and(eq(replizConnection.id, validated.connectionId), eq(replizConnection.teamId, ctx.teamId)),
        });
        if (!connection) throw new Error("Akun sosial tidak ditemukan.");
        if (!connection.isConnected) throw new Error("Akun ini perlu disambungkan ulang sebelum bisa dijadwalkan.");



        const mediaUrls = content.contentFormat === "carousel"
            ? content.slides?.map((s) => ({ type: "image" as const, url: s.imageUrl }))
            : validated.mediaUrls;

        const scheduleType = mediaUrls?.length
            ? mediaUrls[0].type === "video" ? "video" : (mediaUrls.length > 1 ? "album" : "image")
            : "text";

        if (!isTypeSupportedForPlatform(scheduleType, connection.platform)) {
            throw new Error(
                `${connection.platform} tidak mendukung tipe konten "${scheduleType}". Tipe yang didukung: ${getSupportedTypesLabel(connection.platform)}.`
            );
        }

        const { scheduleId } = await createSchedule({
            accountId: connection.replizAccountId,
            title: content.selectedHook,
            description: content.hashtags?.length ? `${content.caption}\n\n${content.hashtags.join(" ")}` : content.caption,
            topic: content.selectedPillar,
            type: scheduleType,
            medias: mediaUrls?.map((m: { type: "image" | "video"; url: string }) => ({ type: m.type, url: m.url })) ?? [],
            scheduleAt: validated.scheduleAt,
        });

        await db.insert(contentSchedule).values({
            id: nanoid(),
            workspaceId: ctx.teamId,
            generatedContentId: validated.generatedContentId,
            connectionId: validated.connectionId,
            replizScheduleId: scheduleId,
            scheduleAt: new Date(validated.scheduleAt),
            status: "pending",
            createdBy: ctx.userId,
        });

        await db
            .update(generatedContent)
            .set({ status: "scheduled", updatedAt: new Date() })
            .where(eq(generatedContent.id, validated.generatedContentId));
    }
);