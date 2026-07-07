import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { db } from "@/shared/infrastructure/database/client";
import { and, eq } from "drizzle-orm";
import { member, organization } from "@/shared/infrastructure/database/schema/auth-schema";

/**
 * Hierarchy of roles (higher overrides lower).
 * Owner → Admin → Member.
 */
const ROLE_RANK = {
  owner: 3,
  admin: 2,
  member: 1,
} as const;

export type OrgPermissionRole = keyof typeof ROLE_RANK;

type OrgPermissionContext = {
  userId: string;
  organizationId: string;
  role: OrgPermissionRole;
};

/**
 * Wraps an organization-level handler with RBAC checks.
 *
 * The wrapper resolves the current org via (in order of preference):
 *  1. `args[0]` if it looks like a 21-char nanoid org id
 *  2. The session's `activeOrganizationId` (BetterAuth tracks this)
 *
 * Usage:
 *   export const myOrgAction = withOrgPermission(
 *     ["owner", "admin"],
 *     async (ctx, input) => {
 *       // ctx has { userId, organizationId, role }
 *     }
 *   );
 */
export function withOrgPermission<
  T extends unknown[],
  R,
>(
  requiredRoles: OrgPermissionRole[],
  handler: (ctx: OrgPermissionContext, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  const maxRequiredRank = Math.max(...requiredRoles.map((r) => ROLE_RANK[r]));

  return async (...rawArgs: T): Promise<R> => {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({
      query: { disableCookieCache: true },
      headers: reqHeaders,
    });

    if (!session?.user) {
      throw new Error("UNAUTHORIZED");
    }

    // --- Resolve organizationId ---

    let organizationId: string | undefined;

    // 1. Explicit args[0] — caller passes org id (21-char nanoid).
    if (
      typeof rawArgs[0] === "string" &&
      rawArgs[0].length === 21 &&
      /^[A-Za-z0-9_-]+$/.test(rawArgs[0])
    ) {
      organizationId = rawArgs[0];
    }

    // 2. Fall back to the session's active organization.
    if (!organizationId) {
      organizationId = session.session.activeOrganizationId ?? undefined;
    }

    if (!organizationId) {
      throw new Error("MISSING_ORGANIZATION_ID");
    }

    // Verify the org exists.
    const orgRow = await db.query.organization.findFirst({
      where: eq(organization.id, organizationId),
      columns: { id: true },
    });

    if (!orgRow) {
      throw new Error("ORGANIZATION_NOT_FOUND");
    }

    // --- Check 1: Is the user a member of the organization? ---
    const orgMember = await db.query.member.findFirst({
      where: and(
        eq(member.userId, session.user.id),
        eq(member.organizationId, organizationId)
      ),
    });

    if (!orgMember) {
      throw new Error("FORBIDDEN");
    }

    const orgRole = (orgMember.role as OrgPermissionRole) ?? "member";
    const userRank = ROLE_RANK[orgRole];
    if (userRank < maxRequiredRank) {
      throw new Error("FORBIDDEN");
    }

    return handler(
      {
        userId: session.user.id,
        organizationId,
        role: orgRole,
      },
      ...rawArgs
    );
  };
}