"use server";

import { db } from "@/shared/infrastructure/database/client";
import { contentSchedule, replizConnection, generatedContent } from "@/shared/infrastructure/database/schema";
import { eq, and, gte, lte, like } from "drizzle-orm";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";
import { getPillarDistributionAction } from "@/features/content-pillar/application/use-cases/get-pillar-distribution";
import { getUpcomingMomentumAction } from "@/features/momentum-calendar/application/use-cases/get-upcoming-momentum";
import { getAnalyticsOverviewAction } from "@/features/analytics/application/use-cases/get-analytics-overview";
import { PRIORITY_ORDER } from "../../domain/value-objects/recommendation-type.vo";
import type { Recommendation } from "../../domain/entities/recommendation.entity";

export const getRecommendationsAction = withWorkspacePermission(
  ["owner", "admin", "member", "viewer"],
  async (ctx, orgSlug: string, workspaceSlug: string): Promise<Recommendation[]> => {
    const basePath = `/${orgSlug}/${workspaceSlug}`;
    const recommendations: Recommendation[] = [];

    // Run all 4 data sources in parallel — they are independent.
    // Each section still uses its own try/catch so a single failure doesn't
    // poison the entire recommendation list.
    const in3Days = new Date();
    in3Days.setDate(in3Days.getDate() + 3);

    const [distributionResult, scheduleGapResult, momentumResult, overviewResult] = await Promise.allSettled([
      getPillarDistributionAction(30),
      // Schedule gap query: connections + upcoming schedules in parallel
      Promise.all([
        db.query.replizConnection.findMany({
          where: and(eq(replizConnection.teamId, ctx.teamId), eq(replizConnection.isRemoved, false)),
        }),
        db.query.contentSchedule.findMany({
          where: and(
            eq(contentSchedule.workspaceId, ctx.teamId),
            gte(contentSchedule.scheduleAt, new Date()),
            lte(contentSchedule.scheduleAt, in3Days)
          ),
          with: { generatedContent: { columns: { platform: true } } },
        }),
      ]),
      getUpcomingMomentumAction(7),
      getAnalyticsOverviewAction(30),
    ]);

    // ===== 1. Pillar Gap =====
    if (distributionResult.status === "fulfilled") {
      const distribution = distributionResult.value;
      const underTarget = distribution.filter((d) => d.gap < -10).sort((a, b) => a.gap - b.gap);
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
      const distinctPlatforms = [...new Set(connections.map((c) => c.platform))];
      const platformsWithSchedule = new Set(upcomingSchedules.map((s) => s.generatedContent?.platform).filter(Boolean));

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

    // ===== 3. Momentum Mendatang yang Belum Ada Kontennya =====
    if (momentumResult.status === "fulfilled") {
      const upcomingMomentum = momentumResult.value;
      // Batch query: avoid N+1 — check all momentum names in a single query using `or` + `like`
      const { or: drizzleOr } = await import("drizzle-orm");
      const momentumNames = upcomingMomentum.slice(0, 3).map((m) => m.name);
      const existingContents = await db.query.generatedContent.findMany({
        where: and(
          eq(generatedContent.workspaceId, ctx.teamId),
          drizzleOr(...momentumNames.map((name) => like(generatedContent.brief, `%${name}%`))),
        ),
      });
      const namesWithContent = new Set(
        existingContents.flatMap((c) => momentumNames.filter((name) => c.brief?.includes(name)))
      );
      for (const momentum of upcomingMomentum.slice(0, 2)) {
        if (!namesWithContent.has(momentum.name)) {
          recommendations.push({
            type: "momentum_upcoming",
            priority: PRIORITY_ORDER.momentum_upcoming,
            title: `${momentum.name} sebentar lagi`,
            description: momentum.contentAngleHint ?? "Momen ini bisa jadi ide konten yang relevan.",
            actionLabel: "Buat ide konten dari momen ini",
            actionUrl: `${basePath}/content/generate?momentumId=${momentum.id}`,
          });
        }
      }
    }

    // ===== 4. Pillar dengan Performa Terbaik =====
    if (overviewResult.status === "fulfilled") {
      const overview = overviewResult.value;
      const pillarEntries = Object.entries(overview.byPillar);
      if (pillarEntries.length > 0) {
        const best = pillarEntries.sort((a, b) => b[1].totalInteraction / b[1].count - a[1].totalInteraction / a[1].count)[0];
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
);