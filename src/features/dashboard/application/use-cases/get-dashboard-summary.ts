"use server";

import {
    cachedListContentsAllAccounts,
    cachedGetContentStatistics,
} from "@/features/social-integration/infrastructure/repliz/repliz-client";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

export interface DashboardSummary {
    accounts: {
        total: number;
        byPlatform: Array<{ platform: string; count: number }>;
    };
    content: {
        total: number;
        byPlatform: Array<{ platform: string; count: number }>;
        byType: Record<string, number>;
    };
    engagement: {
        views: number;
        likes: number;
        comments: number;
        shares: number;
        engagementRate: number;
    };
    engagementBreakdown: Array<{ platform: string; views: number; likes: number; comments: number; shares: number; sampleCount: number }>;
    topPerforming: Array<{ id: string; title: string; platform: string; type: string; thumbnail?: string; createdAt: string; views?: number; likes?: number; comments?: number }>;
    recentContent: Array<{
        id: string;
        accountId: string;
        title: string;
        platform: string;
        type: string;
        thumbnail?: string;
        url?: string;
        createdAt: string;
    }>;
}

const platformLabels: Record<string, string> = {
    instagram: "Instagram",
    facebook: "Facebook",
    youtube: "YouTube",
    tiktok: "TikTok",
    threads: "Threads",
    linkedin: "LinkedIn",
    twitter: "X",
    shopee: "Shopee",
};

/**
 * Fetch Repliz account count (unfiltered) — used as a "connected accounts" indicator.
 */
async function getAccountCount(): Promise<{ total: number; byType: Record<string, number> }> {
    try {
        const { countAccounts } = await import("@/features/social-integration/infrastructure/repliz/repliz-client");
        const raw = await countAccounts();
        const byType: Record<string, number> = {};
        for (const key of ["facebook", "youtube", "instagram", "threads", "tiktok", "linkedin", "twitter", "shopee"]) {
            const val = raw[key as keyof typeof raw] as number | undefined;
            if (val) byType[key] = val;
        }
        return { total: raw.total, byType };
    } catch {
        return { total: 0, byType: {} };
    }
}

/**
 * Load Repliz connections for the resolved team, mapping replizAccountId -> platform info.
 */
async function getConnectedAccounts(teamId: string): Promise<Array<{ replizAccountId: string; platform: string; externalName: string; isConnected: boolean }>> {
    const { db } = await import("@/shared/infrastructure/database/client");
    const { replizConnection } = await import("@/shared/infrastructure/database/schema/repliz-connection-schema");
    const { eq } = await import("drizzle-orm");

    const conns = await db.select({
        replizAccountId: replizConnection.replizAccountId,
        platform: replizConnection.platform,
        externalName: replizConnection.externalName,
        isConnected: replizConnection.isConnected,
    })
        .from(replizConnection)
        .where(eq(replizConnection.teamId, teamId));

    return conns as unknown as Array<{ replizAccountId: string; platform: string; externalName: string; isConnected: boolean }>;
}

/**
 * Fetch account count by type from Repliz API (used as a fallback/indicator when no connections are loaded yet).
 */
async function getReplizAccountCounts(): Promise<Record<string, number>> {
    try {
        const { listAccounts } = await import("@/features/social-integration/infrastructure/repliz/repliz-client");
        const res = await listAccounts({ limit: 200 });
        const map: Record<string, number> = {};
        for (const doc of res.docs) {
            const t = (doc as Record<string, unknown>).type as string | undefined;
            if (t) map[t] = (map[t] || 0) + 1;
        }
        return map;
    } catch {
        return {};
    }
}

export const getDashboardSummary = withWorkspacePermission(
    ["owner", "admin", "member", "viewer"],
    async (ctx) => {
        const teamId = ctx.teamId;

        // ─── Connected Accounts (per team/org) ───────────────────────────
        const connectedAccounts = await getConnectedAccounts(teamId);
        const connectedAccountIdSet = new Set(connectedAccounts.filter((a) => a.isConnected).map((a) => a.replizAccountId));
        const accountIds = Array.from(connectedAccountIdSet);
        const accountPlatformMap = new Map(connectedAccounts.map((a) => [a.replizAccountId, a.platform]));

        // Count accounts by platform from Repliz API (disabled — too slow for limit=200;
        // not needed since connected accounts are always loaded first).
        // const replizByType = await getReplizAccountCounts();
        // const replizAccountTotal = Object.values(replizByType).reduce((sum, v) => sum + v, 0);

        // Build byPlatform from connected accounts
        const byPlatformMap = new Map<string, number>();
        for (const conn of connectedAccounts) {
            const platformLabel = platformLabels[conn.platform] ?? conn.platform;
            if (conn.isConnected) {
                byPlatformMap.set(platformLabel, (byPlatformMap.get(platformLabel) || 0) + 1);
            }
        }

        const accounts = {
            total: connectedAccountIdSet.size,
            byPlatform: Array.from(byPlatformMap.entries())
                .map(([platform, count]) => ({ platform, count }))
                .sort((a, b) => b.count - a.count),
        };

        // ─── Early exit: no connections ─────────────────────────────────
        if (accountIds.length === 0) {
            return {
                accounts,
                content: { total: 0, byPlatform: [], byType: {} },
                engagement: { views: 0, likes: 0, comments: 0, shares: 0, engagementRate: 0 },
                engagementBreakdown: [],
                topPerforming: [],
                recentContent: [],
            };
        }

        // ─── Content (cached — avoids duplicate Repliz API calls) ─────────
        const contentResult = await cachedListContentsAllAccounts({ accountIds, type: "media" });
        const allContents = contentResult.docs;

        // Content by platform
        const contentByPlatformMap = new Map<string, number>();
        const contentByType: Record<string, number> = {};
        for (const c of allContents) {
            const replizAccountId = c.accountId;
            const platform = accountPlatformMap.get(replizAccountId) ?? "unknown";
            const platformLabel = platformLabels[platform] ?? platform;
            contentByPlatformMap.set(platformLabel, (contentByPlatformMap.get(platformLabel) || 0) + 1);
            const tk = c.type || "unknown";
            contentByType[tk] = (contentByType[tk] || 0) + 1;
        }
        const contentByPlatform = Array.from(contentByPlatformMap.entries())
            .map(([platform, count]) => ({ platform, count }))
            .sort((a, b) => b.count - a.count);

        // ─── Engagement Stats ────────────────────────────────────────────
        // Reduced sample size from 30→10 to cut latency. Repliz stats endpoint is slow
        // and 10 samples is statistically sufficient for engagement-rate averages.
        const sampleContents = allContents.slice(0, 10);

        const statsMap = new Map<string, Record<string, unknown>>();
        // Limit parallelism to 5 concurrent calls to avoid hammering Repliz API
        // (which has implicit rate limits and can 429 on bursts).
        const BATCH_SIZE = 5;
        for (let i = 0; i < sampleContents.length; i += BATCH_SIZE) {
            const batch = sampleContents.slice(i, i + BATCH_SIZE);
            await Promise.all(batch.map(async (c) => {
                try {
                    const s = await cachedGetContentStatistics(c.id, c.accountId);
                    statsMap.set(c.id, s as Record<string, unknown>);
                } catch {
                    statsMap.set(c.id, {});
                }
            }));
        }

        let totalViews = 0, totalLikes = 0, totalComments = 0, totalShares = 0;

        const engagementByPlatform = new Map<string, { views: number; likes: number; comments: number; shares: number; count: number }>();

        for (const c of sampleContents) {
            const stat = statsMap.get(c.id) ?? {};
            const platform = accountPlatformMap.get(c.accountId) ?? "unknown";
            const platformLabel = platformLabels[platform] ?? platform;

            const getVal = (...keys: string[]) => {
                for (const k of keys) {
                    if (typeof stat[k] === "number") return Number(stat[k]);
                }
                return 0;
            };
            const v = getVal("views", "view", "Views", "View");
            const l = getVal("likes", "like", "Likes", "Like");
            const cm = getVal("comments", "comment", "Comments", "Comment");
            const sh = getVal("shares", "share", "Shares", "Share");

            totalViews += v;
            totalLikes += l;
            totalComments += cm;
            totalShares += sh;

            const ep = engagementByPlatform.get(platformLabel)!;
            if (ep) {
                ep.views += v;
                ep.likes += l;
                ep.comments += cm;
                ep.shares += sh;
                ep.count += 1;
            } else {
                engagementByPlatform.set(platformLabel, { views: v, likes: l, comments: cm, shares: sh, count: 1 });
            }
        }

        const sampleSize = sampleContents.length;
        const avgViews = sampleSize > 0 ? Math.round(totalViews / sampleSize) : 0;
        const avgLikes = sampleSize > 0 ? Math.round(totalLikes / sampleSize) : 0;
        const avgComments = sampleSize > 0 ? Math.round(totalComments / sampleSize) : 0;
        const avgShares = sampleSize > 0 ? Math.round(totalShares / sampleSize) : 0;

        const engagementRate = avgViews > 0
            ? Number((((avgLikes + avgComments + avgShares) / avgViews) * 100).toFixed(2))
            : 0;

        const engagementBreakdown = Array.from(engagementByPlatform.entries())
            .map(([platform, data]) => ({
                platform,
                views: Math.round(data.views / data.count),
                likes: Math.round(data.likes / data.count),
                comments: Math.round(data.comments / data.count),
                shares: Math.round(data.shares / data.count),
                sampleCount: data.count,
            }))
            .sort((a, b) => b.likes + b.comments - (a.likes + a.comments))
            .slice(0, 6);

        // ─── Top Performing ──────────────────────────────────────────────
        const topPerforming = allContents
            .filter((c) => statsMap.has(c.id))
            .map((c) => {
                const stat = statsMap.get(c.id) ?? {};
                const platform = accountPlatformMap.get(c.accountId) ?? "unknown";
                const getVal = (...keys: string[]) => {
                    for (const k of keys) {
                        if (typeof stat[k] === "number") return Number(stat[k]);
                    }
                    return 0;
                };
                return {
                    id: c.id,
                    accountId: c.accountId,
                    title: c.title || "Tanpa judul",
                    platform: platform,
                    type: c.type,
                    thumbnail: c.medias?.[0]?.thumbnail,
                    url: c.url,
                    createdAt: c.createdAt,
                    views: getVal("views", "view"),
                    likes: getVal("likes", "like"),
                    comments: getVal("comments", "comment"),
                    _score: getVal("views", "view") + (getVal("likes", "like") * 2) + (getVal("comments", "comment") * 5),
                };
            })
            .sort((a, b) => b._score - a._score)
            .slice(0, 5)
            .map(({ _score, ...rest }) => rest);

        // ─── Recent Content ──────────────────────────────────────────────
        const sorted = [...allContents].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const recentContent = sorted.slice(0, 5).map((c) => {
            const platform = accountPlatformMap.get(c.accountId) ?? "unknown";
            return {
                id: c.id,
                accountId: c.accountId,
                title: c.title || "Tanpa judul",
                platform: platformLabels[platform] ?? platform,
                type: c.type,
                thumbnail: c.medias?.[0]?.thumbnail,
                url: c.url,
                createdAt: c.createdAt,
            };
        });

        return {
            accounts,
            content: {
                total: allContents.length,
                byPlatform: contentByPlatform,
                byType: contentByType,
            },
            engagement: {
                views: avgViews,
                likes: avgLikes,
                comments: avgComments,
                shares: avgShares,
                engagementRate,
            },
            engagementBreakdown,
            topPerforming,
            recentContent,
        };
    }
);
