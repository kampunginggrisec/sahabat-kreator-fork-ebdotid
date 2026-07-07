"use client";

import dynamic from "next/dynamic";
import { MetricsSection } from "./metrics-section";
import { Skeleton } from "@/shared/presentation/components/ui/skeleton";
import type { DashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

// Lazy-load recharts only when these panels actually render.
const PerformanceSection = dynamic(
    () => import("./performance-section").then((m) => ({ default: m.PerformanceSection })),
    {
        ssr: false,
        loading: () => (
            <div className="space-y-3 animate-pulse">
                <Skeleton className="h-8 w-48" />
                <div className="rounded-lg border bg-card p-6 h-72" />
            </div>
        ),
    }
);

const RecentContentSection = dynamic(
    () => import("./recent-content-section").then((m) => ({ default: m.RecentContentSection })),
    {
        ssr: false,
        loading: () => (
            <div className="space-y-3 animate-pulse">
                <Skeleton className="h-6 w-32" />
                <div className="rounded-lg border bg-card p-6 h-64" />
            </div>
        ),
    }
);

type Props = {
    summary: DashboardSummary;
};

export function DashboardOverview({ summary }: Props) {
    return (
        <>
            <MetricsSection summary={summary} />
            <PerformanceSection summary={summary} />
            <RecentContentSection summary={summary} />
        </>
    );
}
