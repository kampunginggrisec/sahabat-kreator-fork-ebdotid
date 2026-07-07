"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";

export const listInvitationsAction = withOrgPermission(
  ["owner", "admin", "member"],
  async (ctx) => {
    const result = await auth.api.listInvitations({
      query: { organizationId: ctx.organizationId },
      headers: await headers(),
    });
    return result.filter((inv: { status: string }) => inv.status === "pending");
  }
);
