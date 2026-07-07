"use client";

import { useState } from "react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";
import { inviteMemberAction } from "../../application/use-cases/invite-member";
import { ORG_ROLES, ORG_ROLE_LABELS, type OrgRole } from "../../domain/value-objects/org-role.vo";

export function InviteMemberForm({ onInvited }: { onInvited: () => void }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("member");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await inviteMemberAction(email, role);
      setEmail("");
      onInvited();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim undangan.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="email@contoh.com"
        className="flex-1 min-w-[200px]"
        required
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as OrgRole)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {ORG_ROLES.map((r) => (
          <option key={r} value={r}>
            {ORG_ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      <Button type="submit" isLoading={isSaving}>Undang</Button>
      {error && <p className="text-xs text-destructive w-full">{error}</p>}
    </form>
  );
}
