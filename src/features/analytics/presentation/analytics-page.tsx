"use client";

import { Suspense } from "react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { getAnalyticsOverviewAction } from "../application/use-cases/get-analytics-overview";
import { syncAndFetchPendingAction } from "../application/use-cases/sync-and-fetch-pending";
import {
    overviewOptions,
    analyticsKeys,
} from "./hooks/use-analytics";

type Overview = {
    totalPublished: number;
    byPlatform: Record<string, { totalInteraction: number; totalReach: number; count: number }>;
    byPillar: Record<string, { totalInteraction: number; count: number }>;
    topContent: { caption: string; interaction: number } | null;
};

type AnalyticsOverviewProps = { daysBack?: number };

export function AnalyticsPage({ daysBack = 30 }: AnalyticsOverviewProps) {
    return (
        <Suspense fallback={<p className="text-sm text-muted-foreground">Memuat...</p>}>
            <AnalyticsContent daysBack={daysBack} />
        </Suspense>
    );
}

function AnalyticsContent({ daysBack }: { daysBack: number }) {
    const qc = useQueryClient();

    const [overviewQuery] = useSuspenseQueries({
        queries: [
            overviewOptions(daysBack),
        ],
    });

    const overview = overviewQuery.data;

    const sync = useMutation({
        mutationFn: syncAndFetchPendingAction,
        onSuccess: () => qc.invalidateQueries({ queryKey: analyticsKeys.all() }),
    });

    if (overview?.totalPublished === 0) {
        return <p className="text-sm text-muted-foreground">Belum ada konten yang terbit dengan data statistik.</p>;
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <MetricCard>
                    <p className="text-xs text-muted-foreground">Total Konten Terbit</p>
                    <p className="mt-1 text-2xl font-semibold">{overview?.totalPublished ?? 0}</p>
                </MetricCard>

                <MetricCard>
                    <p className="text-xs text-muted-foreground">Konten Terbaik</p>
                    <p className="mt-1 line-clamp-2 text-sm">{overview?.topContent?.caption ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                        {overview?.topContent?.interaction ?? 0} interaksi
                    </p>
                </MetricCard>

                <MetricCard>
                    <p className="text-xs text-muted-foreground">Platform Teraktif</p>
                    <p className="mt-1 text-sm font-medium">
                        {overview?.byPlatform
                            ? (Object.entries(overview.byPlatform) as [string, { totalInteraction: number; totalReach: number; count: number }][])
                                .sort((a, b) => b[1].count - a[1].count)[0]?.[0]
                            : "-"}
                    </p>
                </MetricCard>
            </div>

            <PlatformSection platforms={overview?.byPlatform} />
            <PillarSection pillars={overview?.byPillar} />
        </div>
    );
}

function MetricCard({ children }: { children: React.ReactNode }) {
    return <div className="rounded-lg border p-4">{children}</div>;
}

function PlatformSection({ platforms }: { platforms?: Record<string, { totalInteraction: number; totalReach: number; count: number }> }) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-medium">Performa per Platform</h2>
            <div className="space-y-2">
                {platforms && Object.entries(platforms).map(([platform, data]) => (
                    <div key={platform} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span className="font-medium capitalize">{platform}</span>
                        <span className="text-muted-foreground">
                            {data.count} konten · {data.totalInteraction} interaksi · {data.totalReach} reach/views
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PillarSection({ pillars }: { pillars?: Record<string, { totalInteraction: number; count: number }> }) {
    return (
        <div className="space-y-3">
            <h2 className="text-lg font-medium">Performa per Pillar</h2>
            <div className="space-y-2">
                {pillars && Object.entries(pillars).map(([pillar, data]) => (
                    <div key={pillar} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                        <span className="font-medium">{pillar}</span>
                        <span className="text-muted-foreground">
                            {data.count} konten · {data.totalInteraction} interaksi
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}