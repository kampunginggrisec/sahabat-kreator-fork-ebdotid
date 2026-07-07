"use server";

import { db } from "@/shared/infrastructure/database/client";
import { contentStatistic, contentSchedule, generatedContent } from "@/shared/infrastructure/database/schema";
import { eq, and, gte } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { cacheAsync } from "@/shared/lib/cache";
import { getTotalInteraction, getReachOrViews } from "../../domain/value-objects/platform-metrics.vo";
import { z } from "zod";

const daysBackSchema = z.number().int().min(1).max(365);

export type AnalyticsOverview = {
    totalPublished: number;
    byPlatform: Record<string, { totalInteraction: number; totalReach: number; count: number }>;
    byPillar: Record<string, { totalInteraction: number; count: number }>;
    topContent: { caption: string; interaction: number } | null;
};

/**
 * Internal implementation: heavy DB query + aggregation.
 * Cached for 30s in-memory to avoid repeating the expensive nested join
 * across multiple server actions (recommendations, dashboard widgets, etc.).
 */
async function fetchAnalyticsOverviewImpl(
    ctx: { teamId: string },
    daysBack: number
): Promise<AnalyticsOverview> {
    const since = new Date();
    since.setDate(since.getDate() - daysBack);

    const stats = await db.query.contentStatistic.findMany({
        where: and(eq(contentStatistic.workspaceId, ctx.teamId), gte(contentStatistic.fetchedAt, since)),
        with: {
            schedule: {
                columns: { generatedContentId: true },
                with: { generatedContent: { columns: { platform: true, selectedPillar: true, caption: true } } },
            },
        },
    });

    const byPlatform: Record<string, { totalInteraction: number; totalReach: number; count: number }> = {};
    const byPillar: Record<string, { totalInteraction: number; count: number }> = {};

    let topContent: { caption: string; interaction: number } | null = null;

    for (const stat of stats) {
        const metrics = stat.metrics as Record<string, number>;
        const interaction = getTotalInteraction(metrics);
        const reach = getReachOrViews(metrics);
        const platform = stat.platform;
        const pillar = stat.schedule?.generatedContent?.platform ? stat.schedule.generatedContent.selectedPillar : "Lainnya";

        if (!byPlatform[platform]) byPlatform[platform] = { totalInteraction: 0, totalReach: 0, count: 0 };
        byPlatform[platform].totalInteraction += interaction;
        byPlatform[platform].totalReach += reach;
        byPlatform[platform].count += 1;

        if (!byPillar[pillar]) byPillar[pillar] = { totalInteraction: 0, count: 0 };
        byPillar[pillar].totalInteraction += interaction;
        byPillar[pillar].count += 1;

        const caption = stat.schedule?.generatedContent?.caption ?? "";
        if (!topContent || interaction > topContent.interaction) {
            topContent = { caption, interaction };
        }
    }

    return {
        totalPublished: stats.length,
        byPlatform,
        byPillar,
        topContent,
    };
}

/** Cached wrapper — TTL 30s. Same (teamId, daysBack) returns the cached result. */
const cachedFetchAnalyticsOverview = cacheAsync(fetchAnalyticsOverviewImpl, { ttl: 30_000 });

export const getAnalyticsOverviewAction = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (ctx, daysBack: unknown = 30): Promise<AnalyticsOverview> => {
        const validatedDays = daysBackSchema.parse(daysBack);
        return cachedFetchAnalyticsOverview(ctx, validatedDays);
    }
);