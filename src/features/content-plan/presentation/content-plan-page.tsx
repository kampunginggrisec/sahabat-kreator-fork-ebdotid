"use client";

import { useState } from "react";
import { useSuspenseQueries } from "@tanstack/react-query";
import { WeekNavigator } from "./components/week-navigator";
import { UnscheduledDraftList } from "./components/unscheduled-draft-list";
import { ScheduledDayGroup } from "./components/scheduled-day-group";
import { ScheduleFormModal } from "./components/schedule-form-modal";
import { getWeekRange, groupByDay } from "../domain/value-objects/week-range.vo";
import {
    unscheduledDraftsOptions,
    scheduledContentOptions,
} from "./hooks/use-content-plan";
import type { ScheduledItem } from "./components/scheduled-day-group";

type Draft = {
    id: string;
    caption: string;
    platform: string;
    selectedHook: string;
    selectedPillar: string;
    contentFormat?: string;
    slides?: { order: number; text: string; imageUrl: string }[];
};

export function ContentPlanPage() {
    const [referenceDate, setReferenceDate] = useState<Date>(new Date());
    const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);

    const { start, end } = getWeekRange(referenceDate);
    const fromIso = start.toISOString();
    const toIso = end.toISOString();

    const [draftsQuery, scheduledQuery] = useSuspenseQueries({
        queries: [
            unscheduledDraftsOptions(),
            scheduledContentOptions(fromIso, toIso),
        ],
    });

    const drafts = (Array.isArray(draftsQuery.data) ? draftsQuery.data : []) as Draft[];
    const scheduled = (Array.isArray(scheduledQuery.data) ? scheduledQuery.data : []) as ScheduledItem[];

    const grouped = groupByDay(scheduled);

    return (
        <div className="space-y-6">
            <WeekNavigator
                start={start} end={end}
                onPrev={() => setReferenceDate(new Date(start.getTime() - 7 * 86400000))}
                onNext={() => setReferenceDate(new Date(start.getTime() + 7 * 86400000))}
                onToday={() => setReferenceDate(new Date())}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    {Object.keys(grouped).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Belum ada konten terjadwal minggu ini.</p>
                    ) : (
                        Object.entries(grouped)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([date, items]) => (
                                <ScheduledDayGroup
                                    key={date}
                                    date={date}
                                    items={items as ScheduledItem[]}
                                />
                            ))
                    )}
                </div>

                <div className="space-y-3">
                    <h2 className="text-sm font-medium">Draft Belum Terjadwal</h2>
                    <UnscheduledDraftList
                        drafts={drafts}
                        onSchedule={(draft) => setSelectedDraft(draft)}
                    />
                </div>
            </div>

            {selectedDraft && (
                <ScheduleFormModal
                    draft={selectedDraft}
                    onClose={() => setSelectedDraft(null)}
                    onScheduled={() => setSelectedDraft(null)}
                />
            )}
        </div>
    );
}