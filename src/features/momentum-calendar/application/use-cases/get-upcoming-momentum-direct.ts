/**
 * Server-side version of get-upcoming-momentum that bypasses withWorkspacePermission.
 */
import { db } from "@/shared/infrastructure/database/client";
import { indonesiaMomentum, workspaceMomentumPreference } from "@/shared/infrastructure/database/schema";
import { eq, gte, lte, and } from "drizzle-orm";
import type { MomentumEvent } from "../../domain/entities/momentum-event.entity";

type Opts = { teamId: string; daysAhead?: number };

export async function getUpcomingMomentumDirect({ teamId, daysAhead = 30 }: Opts): Promise<MomentumEvent[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const todayStr = today.toISOString().split("T")[0];
    const futureStr = futureDate.toISOString().split("T")[0];

    const preference = await db.query.workspaceMomentumPreference.findFirst({
        where: eq(workspaceMomentumPreference.workspaceId, teamId),
    });

    const enabledCategories = preference?.enabledCategories ?? [
        "national_holiday", "religious", "commercial", "cultural",
    ];

    const events = await db.query.indonesiaMomentum.findMany({
        where: and(
            gte(indonesiaMomentum.date, todayStr),
            lte(indonesiaMomentum.date, futureStr)
        ),
    });

    const filtered: MomentumEvent[] = events
        .filter((e) => enabledCategories.includes(e.category))
        .map((e) => ({
            id: e.id,
            date: e.date,
            name: e.name,
            category: e.category,
            description: e.description,
            contentAngleHint: e.contentAngleHint,
            isTentative: e.isTentative,
        }));

    const paydayDay = preference?.paydayDayOfMonth;
    if (paydayDay) {
        const paydayEvents = generateUpcomingPaydayEvents(paydayDay, today, futureDate);
        filtered.push(...paydayEvents);
    }

    return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

function generateUpcomingPaydayEvents(dayOfMonth: number, from: Date, to: Date): MomentumEvent[] {
    const events: MomentumEvent[] = [];
    const cursor = new Date(from.getFullYear(), from.getMonth(), dayOfMonth);
    if (cursor < from) cursor.setMonth(cursor.getMonth() + 1);

    while (cursor <= to) {
        events.push({
            id: `payday-${cursor.toISOString().split("T")[0]}`,
            date: cursor.toISOString().split("T")[0],
            name: "Tanggal Gajian",
            category: "payday",
            description: null,
            contentAngleHint: "Momen 'gajian' — bagus untuk promo, self-reward, treat yourself content",
            isTentative: false,
        });
        cursor.setMonth(cursor.getMonth() + 1);
    }

    return events;
}