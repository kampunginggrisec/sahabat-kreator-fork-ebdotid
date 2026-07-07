"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { withOrgPermission } from "@/shared/lib/guards/with-org-permission";

/**
 * Update organization name, slug, or logo.
 * Owner/Admin only.
 */
export const updateOrganizationAction = withOrgPermission(
  ["owner", "admin"],
  async (ctx, body: { name?: string; slug?: string; logo?: string | null }) => {
    await auth.api.updateOrganization({
      body: { data: body, organizationId: ctx.organizationId },
      headers: await headers(),
    });
  }
);

/**
 * Delete an organization. Must transfer ownership first if someone else is owner.
 * Owner only.
 */
export const deleteOrganizationAction = withOrgPermission(
  ["owner"],
  async (ctx) => {
    await auth.api.deleteOrganization({
      body: { organizationId: ctx.organizationId },
      headers: await headers(),
    });
  }
);
