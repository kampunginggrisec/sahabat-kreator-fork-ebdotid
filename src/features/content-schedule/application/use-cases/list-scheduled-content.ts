"use server";

import { db } from "@/shared/infrastructure/database/client";
import { contentSchedule } from "@/shared/infrastructure/database/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export const listScheduledContentAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (ctx, fromDate: string, toDate: string) => {
        const rows = await db.query.contentSchedule.findMany({
            where: and(
                eq(contentSchedule.workspaceId, ctx.teamId),
                gte(contentSchedule.scheduleAt, new Date(fromDate)),
                lte(contentSchedule.scheduleAt, new Date(toDate))
            ),
            with: {
                generatedContent: { columns: { caption: true, platform: true, selectedHook: true } },
                connection: { columns: { externalName: true, externalPicture: true, platform: true } },
            },
            orderBy: (schedule, { asc }) => [asc(schedule.scheduleAt)],
        });
        return rows.map((row) => ({
            id: row.id,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            workspaceId: row.workspaceId,
            status: row.status,
            createdBy: row.createdBy,
            generatedContentId: row.generatedContentId,
            connectionId: row.connectionId,
            replizScheduleId: row.replizScheduleId,
            scheduleAt: row.scheduleAt.toISOString(),
            errorMessage: row.errorMessage,
            generatedContent: row.generatedContent
                ? { caption: row.generatedContent.caption, platform: row.generatedContent.platform }
                : null,
            connection: row.connection
                ? {
                      externalName: row.connection.externalName,
                      platform: row.connection.platform,
                  }
                : null,
        }));
    }
);