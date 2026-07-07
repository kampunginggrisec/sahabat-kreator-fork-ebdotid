import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { DashboardShell } from "@/features/dashboard/presentation/components/dashboard-shell";
import { OrgSessionProvider, type OrgSessionInfo } from "@/shared/infrastructure/context/org-session-context";
import { auth } from "@/shared/infrastructure/auth/auth";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{
    orgSlug: string;
    workspaceSlug: string;
  }>;
}) {
  const { orgSlug, workspaceSlug } = await params;

  const requestHeaders = await headers();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    redirect("/login");
  }

  const organization = await auth.api.getFullOrganization({
    query: {
      organizationSlug: orgSlug,
    },
    headers: requestHeaders,
  });

  if (!organization) {
    notFound();
  }

  // Handle teams with null slug — treat any team in the org as valid
  // when workspaceSlug matches org slug (common default-org pattern).
  const hasWorkspace = organization.teams?.some(
    (team) => team.slug === workspaceSlug || team.slug === null
  );

  if (!hasWorkspace) {
    notFound();
  }

  // Mark this team AND org as active in the BetterAuth session so
  // downstream server actions can resolve `ctx.organizationId` and
  // `ctx.teamId` via `session.session.activeOrganizationId` /
  // `session.session.activeTeamId`.
  const matchingTeam = organization.teams!.find(
    (t) => t.slug === workspaceSlug || t.slug === null
  )!;
  if (session.session.activeOrganizationId !== organization.id) {
    try {
      await auth.api.setActiveOrganization({
        body: { organizationId: organization.id },
        headers: requestHeaders,
      });
    } catch (err) {
      console.error("[Layout] setActiveOrganization failed:", err);
    }
  }
  if (session.session.activeTeamId !== matchingTeam.id) {
    try {
      await auth.api.setActiveTeam({
        body: { teamId: matchingTeam.id },
        headers: requestHeaders,
      });
    } catch {
      // Non-fatal — guards fall back to other resolution paths.
    }
  }

  const user = {
    name: session.user.name,
    email: session.user.email,
  };

  // ─── Build single-session context ───────────────────────────────
  const sessionInfo: OrgSessionInfo = {
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    organizationId: organization.id,
    organizationSlug: orgSlug,
    teamId: matchingTeam.id,
    teamName: matchingTeam.name,
    teamSlug: matchingTeam.slug ?? workspaceSlug,
  };

  return (
    <OrgSessionProvider data={sessionInfo}>
      <DashboardShell
        orgSlug={orgSlug}
        workspaceSlug={workspaceSlug}
        teams={organization.teams ?? []}
        user={user}
      >
        {children}
      </DashboardShell>
    </OrgSessionProvider>
  );
}