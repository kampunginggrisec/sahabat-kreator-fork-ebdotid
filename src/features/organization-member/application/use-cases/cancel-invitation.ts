"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";

export const cancelInvitationAction = withOrgPermission(
  ["owner", "admin"],
  async (ctx, invitationId: string) => {
    await auth.api.cancelInvitation({
      body: { invitationId },
      headers: await headers(),
    });
  }
);
