"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { db } from "@/shared/infrastructure/database/client";
import { workspaceMemberRole } from "@/shared/infrastructure/database/schema/workspace-schema";
import { team } from "@/shared/infrastructure/database/schema/auth-schema";
import { and, eq } from "drizzle-orm";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";
import type { WorkspaceRole } from "@/features/organization-member/domain/value-objects/workspace-role.vo";

export interface MemberWithWorkspaceRoles {
  memberId: string;
  userId: string;
  email: string;
  name: string;
  orgRole: string;
  orgJoinDate: string;
  workspaceRoles: Array<{
    teamId: string;
    teamName: string;
    teamSlug: string;
    role: WorkspaceRole;
  }>;
}

/**
 * List all org members with their per-workspace role assignments.
 * Owner/Admin only. Returns workspace-level roles for ALL teams in the org.
 */
export const listMembersWithWorkspaceRolesAction = withOrgPermission(
  ["owner", "admin"],
  async (ctx) => {
    const requestHeaders = await headers();

    const org = await auth.api.getFullOrganization({
      query: { organizationId: ctx.organizationId },
      headers: requestHeaders,
    });

    if (!org) return [];

    // Fetch all workspace-level role overrides for this org's teams
    const roleRows = await db
      .select({
        userId: workspaceMemberRole.userId,
        teamId: workspaceMemberRole.teamId,
        teamName: team.name,
        teamSlug: team.slug,
        role: workspaceMemberRole.role,
      })
      .from(workspaceMemberRole)
      .innerJoin(team, eq(workspaceMemberRole.teamId, team.id))
      .where(eq(team.organizationId, ctx.organizationId));

    // Map by userId
    const roleMap = new Map<string, MemberWithWorkspaceRoles["workspaceRoles"]>();
    for (const row of roleRows) {
      if (!roleMap.has(row.userId)) roleMap.set(row.userId, []);
      roleMap.get(row.userId)!.push({
        teamId: row.teamId,
        teamName: row.teamName ?? "",
        teamSlug: row.teamSlug ?? "",
        role: row.role as WorkspaceRole,
      });
    }

    return org.members.map((m) => ({
      memberId: m.id,
      userId: m.userId,
      email: (m.user as { email?: string }).email ?? "",
      name: (m.user as { name?: string }).name ?? "",
      orgRole: m.role,
      orgJoinDate: new Date(m.createdAt).toISOString(),
      workspaceRoles: roleMap.get(m.userId) ?? [],
    }));
  }
);
