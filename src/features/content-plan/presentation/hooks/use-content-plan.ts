"use client";

import { useQueryClient } from "@tanstack/react-query";
import { queryOptions } from "@tanstack/react-query";
import { listUnscheduledDraftsAction } from "../../application/use-cases/list-unscheduled-drafts";
import { listScheduledContentAction } from "@/features/content-schedule/application/use-cases/list-scheduled-content";
import { scheduledContent as scheduledContentKey, unscheduledDrafts } from "@/features/shared/lib/query-keys";

export const unscheduledDraftsOptions = () =>
    queryOptions({
        queryKey: unscheduledDrafts(),
        queryFn: () => listUnscheduledDraftsAction(),
        staleTime: 60 * 1000,
    });

export const scheduledContentOptions = (fromDate: string, toDate: string) =>
    queryOptions({
        queryKey: scheduledContentKey(fromDate, toDate),
        queryFn: () => listScheduledContentAction(fromDate, toDate),
        staleTime: 30 * 1000,
    });

export function useInvalidateContentPlan() {
    const qc = useQueryClient();
    return () => {
        qc.invalidateQueries({ queryKey: ["scheduled-content"] });
        qc.invalidateQueries({ queryKey: ["unscheduled-drafts"] });
    };
}
