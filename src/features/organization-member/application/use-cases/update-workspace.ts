"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withWorkspacePermission } from "@/shared/lib/guards/with-workspace-permission";

/**
 * Update workspace (team) name. Owner/Admin only.
 */
export const updateWorkspaceAction = withWorkspacePermission(
  ["owner", "admin"],
  async (ctx, body: { name: string }) => {
    await auth.api.updateTeam({
      body: { teamId: ctx.teamId, data: { name: body.name } },
      headers: await headers(),
    });
  }
);

/**
 * Delete a workspace (team). Owner only.
 */
export const deleteWorkspaceAction = withWorkspacePermission(
  ["owner"],
  async (ctx) => {
    await auth.api.removeTeam({
      body: { teamId: ctx.teamId },
      headers: await headers(),
    });
  }
);