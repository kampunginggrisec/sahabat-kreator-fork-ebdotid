/**
 * Server-side version of dashboard summary that bypasses withWorkspacePermission.
 *
 * Purpose: the workspace layout (Server Component) already resolves session + teamId
 * and does RBAC. Calling getDashboardSummary via the server-action wrapper would add an
 * extra serialization/deserialization round-trip (React-server → RPC).
 *
 * Import this in Server Components only.
 */
import {
    cachedListContentsAllAccounts,
    cachedGetContentStatistics,
} from "@/features/social-integration/infrastructure/repliz/repliz-client";
import type { DashboardSummary } from "./get-dashboard-summary";

/**
 * Invalidate tag for revalidating dashboard data.
 * Call `revalidateTag('dashboard-summary', 'max')` after mutations
 * that affect account status or content stats.
 *
 * In Next.js 16 with the new `revalidateTag` API (v16+),
 * the second argument is required and specifies the cacheLife profile.
 */
const DASHBOARD_CACHE_TAG = "dashboard-summary";

export { DASHBOARD_CACHE_TAG as DashboardCacheTag };

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

export async function getDashboardSummaryDirect(teamId: string): Promise<DashboardSummary> {
    // --- Connected Accounts ---
    const { db } = await import("@/shared/infrastructure/database/client");
    const { replizConnection } = await import("@/shared/infrastructure/database/schema/repliz-connection-schema");
    const { eq } = await import("drizzle-orm");

    const connectedAccounts = await db.select({
        replizAccountId: replizConnection.replizAccountId,
        platform: replizConnection.platform,
        externalName: replizConnection.externalName,
        isConnected: replizConnection.isConnected,
    })
        .from(replizConnection)
        .where(eq(replizConnection.teamId, teamId));

    const connectedAccountIdSet = new Set(
        connectedAccounts.filter((a) => a.isConnected).map((a) => a.replizAccountId)
    );
    const accountIds = Array.from(connectedAccountIdSet);
    const accountPlatformMap = new Map(
        connectedAccounts.map((a) => [a.replizAccountId, a.platform])
    );

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

    // --- Content ---
    const contentResult = await cachedListContentsAllAccounts({ accountIds, type: "media" });
    const allContents = contentResult.docs;

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

    // --- Engagement ---
    const sampleContents = allContents.slice(0, 10);
    const BATCH_SIZE = 5;

    const statsMap = new Map<string, Record<string, unknown>>();
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

    const getVal = (stat: Record<string, unknown>, ...keys: string[]) => {
        for (const k of keys) {
            if (typeof stat[k as keyof typeof stat] === "number") return Number(stat[k as keyof typeof stat]);
        }
        return 0;
    };

    for (const c of sampleContents) {
        const stat = statsMap.get(c.id) ?? {};
        const platform = accountPlatformMap.get(c.accountId) ?? "unknown";
        const platformLabel = platformLabels[platform] ?? platform;

        const v = getVal(stat, "views", "view", "Views", "View");
        const l = getVal(stat, "likes", "like", "Likes", "Like");
        const cm = getVal(stat, "comments", "comment", "Comments", "Comment");
        const sh = getVal(stat, "shares", "share", "Shares", "Share");

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

    // --- Top Performing ---
    const topPerforming = allContents
        .filter((c) => statsMap.has(c.id))
        .map((c) => {
            const stat = statsMap.get(c.id) ?? {};
            const platform = accountPlatformMap.get(c.accountId) ?? "unknown";
            const score =
                getVal(stat, "views", "view") +
                (getVal(stat, "likes", "like") * 2) +
                (getVal(stat, "comments", "comment") * 5);
            return {
                id: c.id,
                accountId: c.accountId,
                title: c.title || "Tanpa judul",
                platform,
                type: c.type,
                thumbnail: c.medias?.[0]?.thumbnail,
                url: c.url,
                createdAt: c.createdAt,
                views: getVal(stat, "views", "view"),
                likes: getVal(stat, "likes", "like"),
                comments: getVal(stat, "comments", "comment"),
                _score: score,
            };
        })
        .sort((a, b) => b._score - a._score)
        .slice(0, 5)
        .map(({ _score, ...rest }) => rest);

    // --- Recent Content ---
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
        content: { total: allContents.length, byPlatform: contentByPlatform, byType: contentByType },
        engagement: { views: avgViews, likes: avgLikes, comments: avgComments, shares: avgShares, engagementRate },
        engagementBreakdown,
        topPerforming,
        recentContent,
    };
}
