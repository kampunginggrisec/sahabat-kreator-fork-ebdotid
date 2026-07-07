import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/shared/infrastructure/database/client";
import { team } from "@/shared/infrastructure/database/schema/auth-schema";
import { eq } from "drizzle-orm";
import { MembersPage } from "@/features/organization-member/presentation/members-page";

export default async function MembersRoutePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  // Resolve workspace (team) → organizationId
  const teamRow = await db.query.team.findFirst({
    where: eq(team.slug, workspaceSlug),
    columns: { id: true, organizationId: true },
  });

  if (!teamRow) {
    redirect("/");
  }

  const org = await auth.api.getFullOrganization({
    query: { organizationId: teamRow.organizationId },
    headers: await headers(),
  });

  const teams = (org?.teams ?? []).map((t: { id: string; name: string }) => ({
    id: t.id,
    name: t.name,
  }));

  return <MembersPage teams={teams} />;
}
