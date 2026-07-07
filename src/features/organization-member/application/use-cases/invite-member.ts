"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";
import type { OrgRole } from "../../domain/value-objects/org-role.vo";

export const inviteMemberAction = withOrgPermission(
  ["owner", "admin"],
  async (ctx, email: string, role: OrgRole) => {
    if (!email.includes("@")) throw new Error("Format email tidak valid.");

    await auth.api.createInvitation({
      body: { email, role, organizationId: ctx.organizationId },
      headers: await headers(),
    });
  }
);
