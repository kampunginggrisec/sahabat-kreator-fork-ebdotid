"use server";

import { auth } from "@/shared/infrastructure/auth/auth";
import { headers } from "next/headers";

export async function acceptInvitationAction(invitationId: string) {
  // User who accepts doesn't need to be a workspace member yet —
  // this is the flow that makes them a member. Better Auth session (login) is still required.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Kamu perlu login/register dulu sebelum menerima undangan.");

  const result = await auth.api.acceptInvitation({
    body: { invitationId },
    headers: await headers(),
  });

  return result;
}
