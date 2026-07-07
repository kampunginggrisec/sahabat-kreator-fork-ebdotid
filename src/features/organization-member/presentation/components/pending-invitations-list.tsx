"use client";

import { cancelInvitationAction } from "../../application/use-cases/cancel-invitation";
import { ORG_ROLE_LABELS, type OrgRole } from "../../domain/value-objects/org-role.vo";

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string | Date;
};

export function PendingInvitationsList({
  invitations,
  onCancelled,
}: {
  invitations: Invitation[];
  onCancelled: () => void;
}) {
  async function handleCancel(id: string) {
    await cancelInvitationAction(id);
    onCancelled();
  }

  if (invitations.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Undangan Tertunda</p>
      {invitations.map((inv) => {
        const roleLabel = ORG_ROLE_LABELS[inv.role as OrgRole] ?? inv.role;
        const expires = typeof inv.expiresAt === "string" ? new Date(inv.expiresAt) : inv.expiresAt;
        return (
          <div
            key={inv.id}
            className="flex items-center justify-between rounded-md border p-3 text-sm"
          >
            <div>
              <span className="font-medium">{inv.email}</span>
              <span className="text-xs text-muted-foreground">
                {" "}
                ({roleLabel}) · kadaluarsa {expires.toLocaleDateString("id-ID")}
              </span>
            </div>
            <button
              onClick={() => handleCancel(inv.id)}
              className="text-xs text-destructive hover:underline"
            >
              Batalkan
            </button>
          </div>
        );
      })}
    </div>
  );
}
