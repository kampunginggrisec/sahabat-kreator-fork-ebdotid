/**
 * Server-side version of get-recommendations that bypasses withWorkspacePermission.
 *
 * Accepts a pre-resolved teamId so the workspace layout can call it
 * alongside getSession/setActiveTeam without extra RPC overhead.
 */
import { db } from "@/shared/infrastructure/database/client";
import { contentSchedule, replizConnection, generatedContent } from "@/shared/infrastructure/database/schema";
import { eq, and, gte, lte, like } from "drizzle-orm";
import type { Recommendation } from "../../domain/entities/recommendation.entity";
import { PRIORITY_ORDER } from "../../domain/value-objects/recommendation-type.vo";
import { getPillarDistributionDirect } from "@/features/content-pillar/application/use-cases/get-pillar-distribution-direct";
import { getUpcomingMomentumDirect } from "@/features/momentum-calendar/application/use-cases/get-upcoming-momentum-direct";
import { getAnalyticsOverviewDirect } from "@/features/analytics/application/use-cases/get-analytics-overview-direct";

type GetRecsOpts = {
    teamId: string;
    orgSlug?: string;
    workspaceSlug?: string;
};

export async function getRecommendationsDirect(opts: GetRecsOpts): Promise<Recommendation[]> {
    const { teamId, orgSlug, workspaceSlug } = opts;
    const basePath = orgSlug && workspaceSlug ? `/${orgSlug}/${workspaceSlug}` : "";
    const recommendations: Recommendation[] = [];

    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    // Run all 4 data sources in parallel
    const [distributionResult, scheduleGapResult, momentumResult, overviewResult] = await Promise.allSettled([
        getPillarDistributionDirect({ teamId, daysBack: 30 }),
        // Schedule gap query
        Promise.all([
            db.query.replizConnection.findMany({
                where: and(eq(replizConnection.teamId, teamId), eq(replizConnection.isRemoved, false)),
            }),
            db.query.contentSchedule.findMany({
                where: and(
                    eq(contentSchedule.workspaceId, teamId),
                    gte(contentSchedule.scheduleAt, new Date()),
                    lte(contentSchedule.scheduleAt, in3Days)
                ),
                with: { generatedContent: { columns: { platform: true } } },
            }),
        ]),
        getUpcomingMomentumDirect({ teamId, daysAhead: 7 }),
        getAnalyticsOverviewDirect({ teamId, daysBack: 30 }),
    ]);

    // ===== 1. Pillar Gap =====
    if (distributionResult.status === "fulfilled") {
        const distribution = distributionResult.value;
        const underTarget = distribution.filter((d: any) => d.gap < -10).sort((a: any, b: any) => a.gap - b.gap);
        for (const pillar of underTarget.slice(0, 2)) {
            recommendations.push({
                type: "pillar_gap",
                priority: PRIORITY_ORDER.pillar_gap,
                title: `Pillar "${pillar.pillarName}" masih kurang`,
                description: `Baru ${pillar.actualPercent}% dari target ${pillar.targetPercent}% dalam 30 hari terakhir.`,
                actionLabel: "Generate konten pillar ini",
                actionUrl: `${basePath}/content/generate?prefillText=${encodeURIComponent(`Buat konten dengan pillar ${pillar.pillarName}`)}`,
            });
        }
    }

    // ===== 2. Schedule Gap =====
    if (scheduleGapResult.status === "fulfilled") {
        const [connections, upcomingSchedules] = scheduleGapResult.value;
        const distinctPlatforms = [...new Set(connections.map((c: any) => c.platform))];
        const platformsWithSchedule = new Set(
            upcomingSchedules.map((s: any) => s.generatedContent?.platform).filter(Boolean)
        );

        for (const platform of distinctPlatforms) {
            if (!platformsWithSchedule.has(platform)) {
                recommendations.push({
                    type: "schedule_gap",
                    priority: PRIORITY_ORDER.schedule_gap,
                    title: `Belum ada jadwal untuk ${platform} dalam 3 hari ke depan`,
                    description: `Akun ${platform} terhubung tapi kosong dari jadwal publikasi.`,
                    actionLabel: "Buka Content Plan",
                    actionUrl: `${basePath}/content-plan`,
                });
            }
        }
    }

    // ===== 3. Momentum Mendatang =====
    if (momentumResult.status === "fulfilled") {
        const upcomingMomentum = momentumResult.value;
        const momentumNames = upcomingMomentum.slice(0, 3).map((m: any) => m.name);
        const existingContents = await db.query.generatedContent.findMany({
            where: and(
                eq(generatedContent.workspaceId, teamId),
                and(...momentumNames.map((name) => like(generatedContent.brief, `%${name}%`)))
            ),
        });
        const namesWithContent = new Set(
            existingContents.flatMap((c: any) => momentumNames.filter((name: string) => c.brief?.includes(name)))
        );
        for (const momentum of upcomingMomentum.slice(0, 2)) {
            if (!namesWithContent.has(momentum.name)) {
                recommendations.push({
                    type: "momentum_upcoming",
                    priority: PRIORITY_ORDER.momentum_upcoming,
                    title: `${momentum.name} sebentar lagi`,
                    description: (momentum as any).contentAngleHint ?? "Momen ini bisa jadi ide konten yang relevan.",
                    actionLabel: "Buat ide konten dari momen ini",
                    actionUrl: `${basePath}/content/generate?momentumId=${momentum.id}`,
                });
            }
        }
    }

    // ===== 4. Top Performing Pillar =====
    if (overviewResult.status === "fulfilled") {
        const overview = overviewResult.value;
        const pillarEntries = Object.entries(overview.byPillar);
        if (pillarEntries.length > 0) {
            const best = pillarEntries
                .sort((a: any, b: any) => b[1].totalInteraction / b[1].count - a[1].totalInteraction / a[1].count)[0];
            if (best && best[1].count >= 2) {
                recommendations.push({
                    type: "top_performing_pillar",
                    priority: PRIORITY_ORDER.top_performing_pillar,
                    title: `Pillar "${best[0]}" performanya paling bagus`,
                    description: `Rata-rata ${Math.round(best[1].totalInteraction / best[1].count)} interaksi per konten.`,
                    actionLabel: "Bikin lebih banyak pillar ini",
                    actionUrl: `${basePath}/content/generate?prefillText=${encodeURIComponent(`Buat konten dengan pillar ${best[0]}`)}`,
                });
            }
        }
    }

    return recommendations.sort((a, b) => a.priority - b.priority).slice(0, 6);
}
