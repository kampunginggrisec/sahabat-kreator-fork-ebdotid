"use server";

import { eq, and, asc } from "drizzle-orm";
import { db } from "@/shared/infrastructure/database/client";
import { organization, team, member } from "@/shared/infrastructure/database/schema/auth-schema";
import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";

/**
 * Server action that returns the user's first accessible workspace.
 *
 * Used by login/register forms to redirect users immediately after auth
 * without polling authClient.organization.list() in a tight loop.
 *
 * Returns null if the user has no organization yet (e.g. just signed up
 * but the autoCreateOrganizationAndWorkspace hook hasn't finished).
 */
export async function getFirstWorkspaceAction(): Promise<{
    orgSlug: string;
    workspaceSlug: string;
} | null> {
    const reqHeaders = await headers();
    const session = await auth.api.getSession({ headers: reqHeaders });
    if (!session?.user?.id) return null;

    // 1. Find the first org the user is a member of
    const membership = await db.query.member.findFirst({
        where: eq(member.userId, session.user.id),
        columns: { organizationId: true },
        orderBy: (m, { asc: a }) => [a(m.createdAt)],
    });

    if (!membership) {
        // User exists but has no org yet (signup race / incomplete hook).
        // Caller should retry or fall back to /register.
        return null;
    }

    // 2. Get the org slug
    const org = await db.query.organization.findFirst({
        where: eq(organization.id, membership.organizationId),
        columns: { slug: true },
    });

    if (!org) return null;

    // 3. Get the first team (default workspace) under that org
    const teamRow = await db.query.team.findFirst({
        where: eq(team.organizationId, membership.organizationId),
        columns: { slug: true },
        orderBy: (t, { asc }) => [asc(t.createdAt)],
    });

    if (!teamRow) return null;

    // Default workspace team may have null slug — fall back to org slug
    // (which matches the autoCreateOrganizationAndWorkspace behavior).
    return {
        orgSlug: org.slug,
        workspaceSlug: teamRow.slug ?? org.slug,
    };
}