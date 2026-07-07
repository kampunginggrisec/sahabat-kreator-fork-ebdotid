"use client";

import { queryOptions, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getAnalyticsOverviewAction } from "../../application/use-cases/get-analytics-overview";
import { syncAndFetchPendingAction } from "../../application/use-cases/sync-and-fetch-pending";

export const analyticsKeys = {
    all: () => ["analytics"] as const,
    overview: (daysBack: number) => [...analyticsKeys.all(), "overview", daysBack] as const,
};

export const overviewOptions = (daysBack: number) =>
    queryOptions({
        queryKey: analyticsKeys.overview(daysBack),
        queryFn: () => getAnalyticsOverviewAction(daysBack),
        staleTime: 60 * 1000,
    });
