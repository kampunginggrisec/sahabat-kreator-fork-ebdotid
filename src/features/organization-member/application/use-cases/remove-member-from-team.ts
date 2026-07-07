"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";

export const removeMemberFromTeamAction = withOrgPermission(
  ["owner", "admin"],
  async (ctx, teamId: string, userId: string) => {
    await auth.api.removeTeamMember({
      body: { teamId, userId, organizationId: ctx.organizationId },
      headers: await headers(),
    });
  }
);
