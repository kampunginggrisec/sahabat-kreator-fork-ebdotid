"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";
import { Badge } from "@/shared/presentation/components/ui/badge";
import { Card } from "@/shared/presentation/components/ui/card";
import { Avatar } from "@/shared/presentation/components/ui/avatar";
import {
  listMembersWithWorkspaceRolesAction,
  type MemberWithWorkspaceRoles,
} from "@/features/organization-member/application/use-cases/list-members-with-workspace-roles";
import {
  updateOrgMemberRoleAction,
  removeOrgMemberAction,
  updateWorkspaceMemberRoleAction,
  removeWorkspaceMemberRoleAction,
} from "@/features/organization-member/application/use-cases/update-member-role";
import { useOrgSession } from "@/shared/infrastructure/context/org-session-context";
import {
  WORKSPACE_ROLE_LABELS,
  type WorkspaceRole,
  outranks,
} from "@/features/organization-member/domain/value-objects/workspace-role.vo";
import { Lock, Users, Trash2, ChevronDown, ChevronUp } from "lucide-react";

const ORG_ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

export default function AdvancedMembersPage() {
  const { data: sessionData } = useOrgSession();
  const [members, setMembers] = useState<MemberWithWorkspaceRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [roleTarget, setRoleTarget] = useState<string>("member");
  const [actingId, setActingId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMembersWithWorkspaceRolesAction();
      setMembers(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const updateRole = useCallback(
    async (body: { memberId: string; role: "admin" | "member" }) => {
      setActingId(body.memberId);
      try {
        await updateOrgMemberRoleAction(body);
        await loadMembers();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal mengubah role.");
      } finally {
        setActingId(null);
      }
    },
    [loadMembers]
  );

  const removeMember = useCallback(
    async (memberIdOrEmail: string) => {
      if (!confirm("Hapus anggota ini dari seluruh organisasi?")) return;
      setActingId(memberIdOrEmail);
      try {
        await removeOrgMemberAction({ memberIdOrEmail });
        await loadMembers();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus anggota.");
      } finally {
        setActingId(null);
      }
    },
    [loadMembers]
  );

  const updateWorkspaceRole = useCallback(
    async (body: { userId: string; teamId: string; role: WorkspaceRole }) => {
      setActingId(body.userId);
      try {
        await updateWorkspaceMemberRoleAction(body);
        await loadMembers();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal mengubah role workspace.");
      } finally {
        setActingId(null);
      }
    },
    [loadMembers]
  );

  const removeWorkspaceRole = useCallback(
    async (body: { userId: string; teamId: string }) => {
      setActingId(body.userId);
      try {
        await removeWorkspaceMemberRoleAction(body);
        await loadMembers();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Gagal menghapus akses workspace.");
      } finally {
        setActingId(null);
      }
    },
    [loadMembers]
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Lock className="size-5" />
            Pengaturan Lanjutan
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola role org &amp; workspace per-anggota. Peran workspace menentukan
            akses mereka ke setiap workspace.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Memuat anggota...
        </div>
      ) : members.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          Tidak ada anggota di organisasi ini.
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m) => {
            const isExpanded = expandedUserId === m.userId;
            const isOwnerSelf = sessionData?.userId === m.userId;
            return (
              <Card
                key={m.memberId}
                className="overflow-hidden"
              >
                {/* Row utama */}
                <div className="flex items-center gap-4 p-4">
                  <Avatar className="size-8" fallback={m.name || m.email}>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">{m.name || m.email}</span>
                      <span className="text-xs text-muted-foreground">@{m.email}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {ORG_ROLE_LABELS[m.orgRole] ?? m.orgRole}
                      </Badge>
                      {m.workspaceRoles.map((wr) => (
                        <Badge key={wr.teamId} variant="outline" className="text-xs">
                          {wr.teamName}: {WORKSPACE_ROLE_LABELS[wr.role]}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Role dropdown */}
                    <select
                      className="h-8 rounded-md border px-2 text-xs"
                      value={roleTarget}
                      onChange={(e) => setRoleTarget(e.target.value)}
                      disabled={isOwnerSelf || outranks("member" as WorkspaceRole, m.orgRole as WorkspaceRole)}
                    >
                      {["admin", "member"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      isLoading={actingId === m.userId}
                      disabled={isOwnerSelf || m.orgRole === roleTarget}
                      onClick={() => updateRole({ memberId: m.memberId, role: roleTarget as "admin" | "member" })}
                    >
                      Terapkan
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      isLoading={actingId === m.userId}
                      onClick={() => removeMember(m.memberId)}
                      disabled={isOwnerSelf}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setExpandedUserId(isExpanded ? null : m.userId)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="size-4" />
                      ) : (
                        <ChevronDown className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Detail expandable */}
                {isExpanded && (
                  <div className="border-t bg-muted/30 px-4 py-3">
                    <p className="mb-2 text-xs text-muted-foreground">
                      Role per workspace untuk {m.name || m.email}:
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {m.workspaceRoles.map((wr) => (
                        <div key={wr.teamId} className="rounded-md border bg-background p-2">
                          <p className="text-xs font-medium">{wr.teamName}</p>
                          <select
                            className="mt-1 w-full rounded border bg-transparent px-1 py-0.5 text-xs"
                            value={wr.role}
                            onChange={(e) => {
                              const role = e.target.value as WorkspaceRole;
                              updateWorkspaceRole({ userId: m.userId, teamId: wr.teamId, role });
                              // Optimistic update
                              setMembers((prev) =>
                                prev.map((mm) =>
                                  mm.userId === m.userId
                                    ? {
                                        ...mm,
                                        workspaceRoles: mm.workspaceRoles.map((w) =>
                                          w.teamId === wr.teamId ? { ...w, role } : w
                                        ),
                                      }
                                    : mm
                                )
                              );
                            }}
                          >
                            {Object.entries(WORKSPACE_ROLE_LABELS).map(([key, label]) => (
                              <option key={key} value={key}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <button
                            className="mt-1 px-1 text-[10px] text-red-600 underline hover:text-red-800"
                            onClick={() => removeWorkspaceRole({ userId: m.userId, teamId: wr.teamId })}
                          >
                            Hapus Akses
                          </button>
                        </div>
                      ))}
                    </div>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Anggota yang belum ada role workspace — secara otomatis menggunakan role org-nya
                      sebagai default saat masuk ke workspace tersebut.
                    </p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <footer className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <Users className="size-4" />
        <span>
          <strong>Ringkasan Peran:</strong> Owner (seluruh organisasi) → Admin (kelola anggota & konfigurasi)
          → Member (akses workspace) → Viewer (baca saja). Perubahan role memerlukan login ulang.
        </span>
      </footer>
    </div>
  );
}
