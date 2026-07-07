import { Suspense } from "react";
import { DashboardOverview } from "@/features/dashboard/presentation/components/dashboard-overview";
import { RecommendationList } from "@/features/content-recommendation/presentation/recommendation-server";
import { Button } from "@/shared/presentation/components/ui/button";
import { PageContainer } from "@/shared/presentation/components/ui/page-container";
import { PageHeader } from "@/shared/presentation/components/ui/page-header";
import { getDashboardSummaryDirect } from "@/features/dashboard/application/use-cases/get-dashboard-summary-direct";
import { getRecommendationsDirect } from "@/features/content-recommendation/application/use-cases/get-recommendations-direct";
import { cache as reactCache } from "react";

// Kept for SEO/sharing previews (OG image, etc.)
export const metadata = {
  title: "Dashboard",
};

// Dashboard is dynamic per-user — no static caching at route level.
// Per-request dedup is achieved via React.cache() on internal helpers.

export default async function DashboardPage({
    params,
}: {
    params: Promise<{ orgSlug: string; workspaceSlug: string }>;
}) {
    const { orgSlug, workspaceSlug } = await params;

    // Derive teamId using the same logic as the workspace layout.
    // The layout already authenticated the user and validated this org/team combo.
    const teamId = await resolveTeamId(orgSlug, workspaceSlug);

    // Parallel data fetching on the server — no client-side React Query waterfall.
    // Pages stream via Suspense, so partial UI shows up immediately.
    const summaryPromise = getDashboardSummaryDirect(teamId);
    const recommendationsPromise = getRecommendationsDirect({ teamId, orgSlug, workspaceSlug });

    return (
        <PageContainer>
            <PageHeader
                title="Dashboard"
                description={`Ringkasan aktivitas workspace ${workspaceSlug}.`}
                action={
                    <Button size="md">
                        Create Content
                    </Button>
                }
            />

            <Suspense fallback={<DashboardOverviewSkeleton />}>
                <DashboardOverviewFetcher summaryPromise={summaryPromise} />
            </Suspense>

            <div className="space-y-3 mt-8">
                <h2 className="text-lg font-medium">Rekomendasi Untuk Kamu</h2>
                <RecommendationList recommendations={await recommendationsPromise} />
            </div>
        </PageContainer>
    );
}

async function DashboardOverviewFetcher({
    summaryPromise,
}: {
    summaryPromise: Promise<any>;
}) {
    const summary = await summaryPromise;
    return <DashboardOverview summary={summary} />;
}


/**
 * Resolves teamId from orgSlug/workspaceSlug, matching the workspace layout's logic.
 * Uses react.cache for deduplication within a single request.
 */
const resolveTeamIdCached = reactCache(
    async (orgSlug: string, workspaceSlug: string): Promise<string> => {
        const { db } = await import("@/shared/infrastructure/database/client");
        const { organization, team } = await import("@/shared/infrastructure/database/schema/auth-schema");
        const { eq, and } = await import("drizzle-orm");

        const org = await db.query.organization.findFirst({
            where: eq(organization.slug, orgSlug),
            columns: { id: true },
        });
        if (!org) throw new Error("ORGANIZATION_NOT_FOUND");

        // Prefer exact team slug match; fall back to first team (default workspace)
        const teamRows = await db.query.team.findMany({
            where: and(eq(team.organizationId, org.id), eq(team.slug, workspaceSlug)),
            columns: { id: true },
            limit: 1,
        });

        if (teamRows.length > 0) return teamRows[0].id;

        // Fallback: default workspace team (null slug or earliest created)
        const fallbackTeam = await db.query.team.findFirst({
            where: eq(team.organizationId, org.id),
            columns: { id: true },
            orderBy: (t, { asc }) => [asc(t.createdAt)],
        });

        if (!fallbackTeam) throw new Error("WORKSPACE_NOT_FOUND");
        return fallbackTeam.id;
    }
);

async function resolveTeamId(orgSlug: string, workspaceSlug: string): Promise<string> {
    return resolveTeamIdCached(orgSlug, workspaceSlug);
}

function DashboardOverviewSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-lg border bg-card p-4 h-24" />
                ))}
            </div>
            <div className="rounded-lg border bg-card p-6 h-64" />
            <div className="rounded-lg border bg-card p-6 h-64" />
        </div>
    );
}
