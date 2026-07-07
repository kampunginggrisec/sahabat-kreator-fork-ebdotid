"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "@/features/dashboard/application/use-cases/get-dashboard-summary";

export const dashboardKeys = {
    all: () => ["dashboard"] as const,
    summary: () => [...dashboardKeys.all(), "summary"] as const,
};

export function useDashboardSummary() {
    return useQuery({
        queryKey: dashboardKeys.summary(),
        queryFn: () => getDashboardSummary(),
        staleTime: 60 * 1000, // 1 min — analytics rarely change this fast
        retry: 1,
    });
}
