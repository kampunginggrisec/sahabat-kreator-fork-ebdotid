"use client";

import { useState } from "react";
import { assignMemberToTeamAction } from "../../application/use-cases/assign-member-to-team";
import { removeMemberFromTeamAction } from "../../application/use-cases/remove-member-from-team";
import { ORG_ROLE_LABELS } from "../../domain/value-objects/org-role.vo";

type Member = {
  id: string;
  userId: string;
  role: string;
  user: { name: string; email: string };
};
type Team = { id: string; name: string };

export function MemberTeamMatrix({
  members,
  teams,
  memberTeamMap,
}: {
  members: Member[];
  teams: Team[];
  memberTeamMap: Record<string, string[]>;
}) {
  const [localMap, setLocalMap] = useState(memberTeamMap);

  async function handleToggle(userId: string, teamId: string, checked: boolean) {
    // Optimistic update
    setLocalMap((prev) => ({
      ...prev,
      [userId]: checked
        ? [...(prev[userId] ?? []), teamId]
        : (prev[userId] ?? []).filter((t) => t !== teamId),
    }));

    try {
      if (checked) {
        await assignMemberToTeamAction(teamId, userId);
      } else {
        await removeMemberFromTeamAction(teamId, userId);
      }
    } catch (err) {
      // Rollback on error
      setLocalMap((prev) => ({
        ...prev,
        [userId]: checked
          ? (prev[userId] ?? []).filter((t) => t !== teamId)
          : [...(prev[userId] ?? []), teamId],
      }));
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-accent/30">
            <th className="p-3 text-left font-medium">Member</th>
            <th className="p-3 text-left font-medium">Role Org</th>
            {teams.map((team) => (
              <th key={team.id} className="p-3 text-center font-medium">
                {team.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id} className="border-b">
              <td className="p-3">
                <p className="font-medium">{member.user.name}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </td>
              <td className="p-3 text-xs">
                {ORG_ROLE_LABELS[member.role as keyof typeof ORG_ROLE_LABELS] ?? member.role}
              </td>
              {teams.map((team) => (
                <td key={team.id} className="p-3 text-center">
                  <input
                    type="checkbox"
                    checked={localMap[member.userId]?.includes(team.id) ?? false}
                    onChange={(e) => handleToggle(member.userId, team.id, e.target.checked)}
                    disabled={member.role === "owner"}
                    aria-label={`Assign ${member.user.name} to ${team.name}`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
