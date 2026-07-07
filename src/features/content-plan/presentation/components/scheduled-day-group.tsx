"use client";

import { useMutation } from "@tanstack/react-query";
import { SCHEDULE_STATUS_LABELS } from "@/features/content-schedule/domain/value-objects/schedule-status.vo";
import { cancelScheduledContentAction } from "@/features/content-schedule/application/use-cases/cancel-scheduled-content";
import { retryScheduledContentAction } from "@/features/content-schedule/application/use-cases/retry-scheduled-content";
import { useInvalidateContentPlan } from "../hooks/use-content-plan";

export type ScheduledItem = {
    id: string;
    scheduleAt: string;
    status: string;
    errorMessage: string | null;
    generatedContent: { caption: string; platform: string } | null;
    connection: { externalName: string; platform: string } | null;
};

export function ScheduledDayGroup({ date, items }: { date: string; items: ScheduledItem[] }) {
    const invalidate = useInvalidateContentPlan();
    const dateLabel = new Date(date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });

    const cancelMutation = useMutation({
        mutationFn: (id: string) => cancelScheduledContentAction(id),
        onSuccess: invalidate,
    });

    const retryMutation = useMutation({
        mutationFn: (id: string) => retryScheduledContentAction(id),
        onSuccess: invalidate,
    });

    function handleCancel(id: string) {
        if (!confirm("Batalkan jadwal ini?")) return;
        cancelMutation.mutate(id);
    }

    function handleRetry(id: string) {
        retryMutation.mutate(id);
    }

    return (
        <div className="space-y-2">
            <p className="text-sm font-medium">{dateLabel}</p>
            <div className="space-y-2">
                {items.map((item) => {
                    const status = SCHEDULE_STATUS_LABELS[item.status] ?? SCHEDULE_STATUS_LABELS.pending;
                    const time = new Date(item.scheduleAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                    return (
                        <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium">{time}</span>
                                    <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: status.color }}>
                                        {status.label}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{item.connection?.externalName}</span>
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.generatedContent?.caption}</p>
                                {item.status === "error" && item.errorMessage && (
                                    <p className="mt-1 text-xs text-destructive">{item.errorMessage}</p>
                                )}
                            </div>
                            <div className="flex shrink-0 gap-1">
                                {item.status === "error" && (
                                    <button
                                        onClick={() => handleRetry(item.id)}
                                        disabled={retryMutation.isPending}
                                        className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                                    >
                                        Coba lagi
                                    </button>
                                )}
                                {item.status !== "success" && (
                                    <button
                                        onClick={() => handleCancel(item.id)}
                                        disabled={cancelMutation.isPending}
                                        className="text-xs text-destructive hover:underline disabled:opacity-50"
                                    >
                                        Batal
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}