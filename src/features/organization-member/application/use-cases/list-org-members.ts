"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";

export const listOrgMembersAction = withOrgPermission(
  ["owner", "admin", "member"],
  async (ctx) => {
    const org = await auth.api.getFullOrganization({
      query: { organizationId: ctx.organizationId },
      headers: await headers(),
    });
    return org?.members ?? [];
  }
);
