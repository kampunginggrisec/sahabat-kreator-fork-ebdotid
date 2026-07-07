import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";
import { db } from "@/shared/infrastructure/database/client";
import { and, eq } from "drizzle-orm";
import { workspaceMemberRole } from "@/shared/infrastructure/database/schema/workspace-schema";
import { team as teamTable, member, organization as organizationTable } from "@/shared/infrastructure/database/schema/auth-schema";
import { cache as reactCache } from "react";

/**
 * Hierarchy of roles (higher overrides lower).
 * Owner → Admin → Member → Viewer.
 */
const ROLE_RANK = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
} as const;

export type PermissionRole = keyof typeof ROLE_RANK;

type PermissionContext = {
  userId: string;
  organizationId: string;
  teamId: string;
  role: PermissionRole;
};

/**
 * Per-request cache for `auth.api.getSession()` via React.cache().
 *
 * Why: Better Auth's `getSession` resolves the session token via DB lookup
 * (~200-400ms) PLUS verifies role/status. The dashboard page has multiple
 * parallel server-action calls — each `withWorkspacePermission` invocation
 * would otherwise trigger an independent `getSession`. React.cache dedupes
 * within a single request lifecycle so we only pay the cost once.
 */
const getSessionCached = reactCache(async () => {
  const reqHeaders = await headers();
  return auth.api.getSession({ headers: reqHeaders });
});

/**
 * Resolves the workspace context (teamId, orgId, role, etc.) from orgSlug/workspaceSlug
 * or a bare teamId.
 */
async function resolveWorkspaceContext(
  rawArgs: unknown[],
  requiredMaxRank: number
): Promise<PermissionContext> {
  const session = await getSessionCached();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }

  let teamId: string | undefined;
  let organizationId: string | undefined;

  // 1. orgSlug + workspaceSlug
  if (typeof rawArgs[0] === "string" && typeof rawArgs[1] === "string") {
    const orgRow = await db.query.organization.findFirst({
      where: eq(organizationTable.slug, rawArgs[0] as string),
      columns: { id: true },
    });
    if (orgRow) {
      const teamRow = await db.query.team.findFirst({
        where: and(eq(teamTable.organizationId, orgRow.id), eq(teamTable.slug, rawArgs[1] as string)),
        columns: { id: true, organizationId: true },
      });
      if (teamRow) { teamId = teamRow.id; organizationId = teamRow.organizationId; }
      else {
        organizationId = orgRow.id;
        const ft = await db.query.team.findFirst({
          where: eq(teamTable.organizationId, orgRow.id),
          columns: { id: true },
          orderBy: (t, { asc }) => [asc(t.createdAt)],
        });
        if (ft) teamId = ft.id;
      }
    }
  }

  // 2. Direct teamId (21-char nanoid)
  if (!teamId && typeof rawArgs[0] === "string" && rawArgs[0].length === 21 && /^[A-Za-z0-9_-]+$/.test(rawArgs[0])) {
    teamId = rawArgs[0];
  }

  // 3. Fallback to activeTeamId from session
  if (!teamId) {
    teamId = session.session.activeTeamId ?? undefined;
  }

  // 4. Resolve organizationId
  if (!teamId) {
    const um = await db.query.member.findFirst({
      where: eq(member.userId, session.user.id),
      columns: { organizationId: true },
    });
    if (um) {
      organizationId = um.organizationId;
      const ft = await db.query.team.findFirst({
        where: eq(teamTable.organizationId, um.organizationId),
        columns: { id: true },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
      });
      if (ft) teamId = ft.id;
    }
  }

  if (!teamId) throw new Error("MISSING_TEAM_ID");

  let teamRow;
  if (!organizationId) {
    teamRow = await db.query.team.findFirst({
      where: eq(teamTable.id, teamId),
      columns: { id: true, organizationId: true },
    });
    if (!teamRow) throw new Error("TEAM_NOT_FOUND");
    organizationId = teamRow.organizationId;
  } else {
    teamRow = { id: teamId, organizationId };
  }

  // Org membership check
  const orgMember = await db.query.member.findFirst({
    where: and(eq(member.userId, session.user.id), eq(member.organizationId, organizationId)),
  });
  if (!orgMember) throw new Error("FORBIDDEN");

  // Workspace role check
  const workspaceRoleRow = await db.query.workspaceMemberRole.findFirst({
    where: and(eq(workspaceMemberRole.teamId, teamRow.id), eq(workspaceMemberRole.userId, session.user.id)),
  });
  const workspaceRole: PermissionRole =
    (workspaceRoleRow?.role as PermissionRole | null) ?? ((orgMember.role as PermissionRole | null) ?? "viewer");

  if (!ROLE_RANK[workspaceRole] || ROLE_RANK[workspaceRole] < requiredMaxRank) {
    throw new Error("FORBIDDEN");
  }

  return {
    userId: session.user.id,
    organizationId,
    teamId: teamRow.id,
    role: workspaceRole,
  };
}

/**
 * Per-request memoized context resolver using React.cache().
 *
 * Key: `(requiredMaxRank, args0, args1)` — same args → cached ctx.
 * Within a single server request (Promise.allSettled), this deduplicates
 * the ~4 DB queries that resolve teamId + role. Each action called in parallel
 * reuses the first resolved context.
 */
const memoResolve = reactCache(
  (requiredMaxRank: number, arg0: string | undefined, arg1: string | undefined): Promise<PermissionContext> => {
    return resolveWorkspaceContext([arg0, arg1], requiredMaxRank);
  }
);

/**
 * Wraps a workspace-level handler with RBAC checks.
 *
 * The wrapper resolves the current workspace via (in order of preference):
 *  1. `args[0]` & `args[1]` — if they are orgSlug and workspaceSlug strings
 *  2. `args[0]` — if it looks like a 21-char nanoid team id
 *  3. The session's `activeTeamId` (BetterAuth tracks this — the workspace
 *     layout sets it on every navigation to /[workspaceSlug])
 *
 * Usage:
 *   export const myAction = withWorkspacePermission(
 *     ["owner", "admin"],
 *     async (ctx, orgSlug, workspaceSlug) => {
 *       // ctx has { userId, organizationId, teamId, role }
 *     }
 *   );
 */
export function withWorkspacePermission<
  T extends unknown[],
  R,
>(
  requiredRoles: PermissionRole[],
  handler: (ctx: PermissionContext, ...args: T) => Promise<R>
): (...args: T) => Promise<R> {
  const maxRequiredRank = Math.max(...requiredRoles.map((r) => ROLE_RANK[r]));

  return async (...rawArgs: T): Promise<R> => {
    // Resolve cached context — same (rank, arg0, arg1) → React.cache returns cached result.
    const ctx = await memoResolve(maxRequiredRank, rawArgs[0] as string | undefined, rawArgs[1] as string | undefined);
    return handler(ctx, ...rawArgs);
  };
}
