"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";
import { db } from "@/shared/infrastructure/database/client";
import { workspaceMemberRole } from "@/shared/infrastructure/database/schema/workspace-schema";
import { and, eq } from "drizzle-orm";

/**
 * Update a member's org-level role (owner/admin/member). Owner only — admins
 * cannot promote others to owner.
 */
export const updateOrgMemberRoleAction = withOrgPermission(
  ["owner"],
  async (ctx, body: { memberId: string; role: "admin" | "member" }) => {
    await auth.api.updateMemberRole({
      body: { memberId: body.memberId, role: body.role, organizationId: ctx.organizationId },
      headers: await headers(),
    });
  }
);

/**
 * Remove a member from the org entirely. Owner only.
 */
export const removeOrgMemberAction = withOrgPermission(
  ["owner"],
  async (ctx, body: { memberIdOrEmail: string }) => {
    await auth.api.removeMember({
      body: {
        memberIdOrEmail: body.memberIdOrEmail,
        organizationId: ctx.organizationId,
      },
      headers: await headers(),
    });
  }
);

/**
 * Update a member's per-workspace role (owner/admin/member/viewer).
 * Owner/Admin only.
 */
export const updateWorkspaceMemberRoleAction = withOrgPermission(
  ["owner", "admin"],
  async (
    _ctx,
    body: { userId: string; teamId: string; role: "owner" | "admin" | "member" | "viewer" }
  ) => {
    const existing = await db.query.workspaceMemberRole.findFirst({
      where: and(
        eq(workspaceMemberRole.userId, body.userId),
        eq(workspaceMemberRole.teamId, body.teamId)
      ),
    });

    if (existing) {
      await db
        .update(workspaceMemberRole)
        .set({ role: body.role, updatedAt: new Date() })
        .where(eq(workspaceMemberRole.id, existing.id));
    } else {
      const { nanoid } = await import("nanoid");
      await db.insert(workspaceMemberRole).values({
        id: nanoid(),
        userId: body.userId,
        teamId: body.teamId,
        role: body.role,
      });
    }
  }
);

/**
 * Remove a member's role on a specific workspace (clears their access without
 * removing them from the org). Owner/Admin only.
 */
export const removeWorkspaceMemberRoleAction = withOrgPermission(
  ["owner", "admin"],
  async (_ctx, body: { userId: string; teamId: string }) => {
    await db
      .delete(workspaceMemberRole)
      .where(
        and(
          eq(workspaceMemberRole.userId, body.userId),
          eq(workspaceMemberRole.teamId, body.teamId)
        )
      );
  }
);
