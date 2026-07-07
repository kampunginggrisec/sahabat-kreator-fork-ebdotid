"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";
import { useOrgSession } from "@/shared/infrastructure/context/org-session-context";
import {
  updateWorkspaceAction,
  deleteWorkspaceAction,
} from "@/features/organization-member/application/use-cases/update-workspace";

export default function WorkspaceSettingsPage() {
  const router = useRouter();
  const { data: sessionData } = useOrgSession();
  const [name, setName] = useState(sessionData?.teamName ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [success, setSuccess] = useState<string | null>(null);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;
    setIsUpdating(true);
    setSuccess(null);
    try {
      await updateWorkspaceAction({ name });
      setSuccess("Workspace berhasil diperbarui.");
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui.");
    } finally {
      setIsUpdating(false);
    }
  }, [name, router]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm !== sessionData?.teamName) return;
    setIsDeleting(true);
    try {
      await deleteWorkspaceAction();
      // Bounce to first remaining workspace or root.
      window.location.href = sessionData?.organizationSlug
        ? `/${sessionData.organizationSlug}`
        : "/";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus workspace.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, sessionData?.teamName, sessionData?.organizationSlug]);

  if (!sessionData) return <p className="p-6">Memuat workspace...</p>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengaturan Workspace</h1>
        <p className="text-sm text-muted-foreground">
          Pengaturan spesifik untuk workspace aktif.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Detail Workspace</h2>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nama Workspace</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama workspace"
          />
          <p className="text-xs text-muted-foreground">
            Slug saat ini: <code className="rounded bg-muted px-1">{sessionData.teamSlug}</code> — tidak dapat diubah untuk menjaga URL stabil.
          </p>
        </div>

        {success && <p className="text-xs text-green-600">{success}</p>}

        <Button onClick={handleSave} isLoading={isUpdating}>
          Simpan Perubahan
        </Button>
      </section>

      <section className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <h2 className="text-sm font-medium text-destructive">Hapus Workspace</h2>
        <p className="text-xs text-muted-foreground">
          Menghapus workspace akan menghapus semua konten, jadwal, knowledge, dan
          konfigurasi AI terkait. Anggota workspace akan kehilangan akses.
        </p>

        <Input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={`Ketik "${sessionData.teamName}" untuk konfirmasi`}
          className="max-w-sm"
        />
        <Button
          variant="destructive"
          onClick={handleDelete}
          isLoading={isDeleting}
          disabled={deleteConfirm !== sessionData.teamName}
        >
          Hapus Workspace
        </Button>
      </section>
    </div>
  );
}
