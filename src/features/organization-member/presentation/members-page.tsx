"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { InviteMemberForm } from "./components/invite-member-form";
import { PendingInvitationsList } from "./components/pending-invitations-list";
import { MemberTeamMatrix } from "./components/member-team-matrix";
import { listOrgMembersAction } from "../application/use-cases/list-org-members";
import { listInvitationsAction } from "../application/use-cases/list-invitations";

type Member = {
  id: string;
  userId: string;
  role: string;
  teamId?: string | null;
  user: { name: string; email: string };
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string | Date;
};

type Team = { id: string; name: string };

/**
 * Derives userId -> teamId[] map from the shape Better Auth returns.
 * Each member has at most one `teamId` (per the plugin schema); if the
 * user is assigned to multiple teams the response includes multiple
 * member rows with the same userId.
 */
function deriveMemberTeamMap(members: Member[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const m of members) {
    if (!m.teamId) continue;
    if (!map[m.userId]) map[m.userId] = [];
    if (!map[m.userId].includes(m.teamId)) map[m.userId].push(m.teamId);
  }
  return map;
}

export function MembersPage({ teams }: { teams: Team[] }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);

  const memberTeamMap = useMemo(() => deriveMemberTeamMap(members), [members]);

  const refresh = useCallback(async () => {
    const [memberList, invitationList] = await Promise.all([
      listOrgMembersAction() as Promise<Member[]>,
      listInvitationsAction() as Promise<Invitation[]>,
    ]);
    setMembers(memberList);
    setInvitations(invitationList);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Kelola Anggota</h1>
        <p className="text-sm text-muted-foreground">
          Undang staff dan atur akses workspace mereka.
        </p>
      </div>

      <section className="space-y-2 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Undang anggota baru</h2>
        <InviteMemberForm onInvited={refresh} />
      </section>

      <PendingInvitationsList invitations={invitations} onCancelled={refresh} />

      <section className="space-y-2">
        <h2 className="text-sm font-medium">Akses Workspace</h2>
        <p className="text-xs text-muted-foreground">
          Centang kotak untuk memberi member akses ke workspace/brand tertentu.
          Owner organization otomatis punya akses ke semua workspace.
        </p>
        <MemberTeamMatrix
          members={members}
          teams={teams}
          memberTeamMap={memberTeamMap}
        />
      </section>
    </div>
  );
}
