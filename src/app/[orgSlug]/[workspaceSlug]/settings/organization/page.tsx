"use client";

import { useCallback, useEffect, useState } from "react";
import { Input } from "@/shared/presentation/components/ui/input";
import { Button } from "@/shared/presentation/components/ui/button";
import { useOrgSession } from "@/shared/infrastructure/context/org-session-context";
import { useListOrganizations } from "@/shared/infrastructure/auth/auth-client";
import {
  updateOrganizationAction,
  deleteOrganizationAction,
} from "@/features/organization-member/application/use-cases/update-organization";

export default function OrganizationSettingsPage() {
  const { data: sessionData } = useOrgSession();
  const { data: orgs } = useListOrganizations();
  const current = orgs?.find((o) => o.slug === sessionData?.organizationSlug);
  const [name, setName] = useState(current?.name ?? "");
  const [slug, setSlug] = useState(current?.slug ?? "");
  const [logo, setLogo] = useState(current?.logo ?? "");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    if (current) {
      setName(current.name);
      setSlug(current.slug);
      setLogo(current.logo ?? "");
    }
  }, [current]);

  const handleSave = useCallback(async () => {
    setIsUpdating(true);
    setSuccess(null);
    try {
      await updateOrganizationAction({
        name: name || undefined,
        slug: slug || undefined,
        logo: logo || null,
      });
      setSuccess("Organisasi berhasil diperbarui.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal memperbarui.");
    } finally {
      setIsUpdating(false);
    }
  }, [name, slug, logo]);

  const handleDelete = useCallback(async () => {
    if (deleteConfirm !== current?.name) return;
    setIsDeleting(true);
    try {
      await deleteOrganizationAction();
      window.location.href = "/";
    } catch (err) {
      alert(err instanceof Error ? err.message : "Gagal menghapus organisasi.");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirm, current?.name]);

  if (!current) return <p className="p-6">Memuat organisasi...</p>;

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Pengaturan Organisasi</h1>
        <p className="text-sm text-muted-foreground">
          Nama, slug, dan logo organisasi Anda. Perubahan ini terlihat oleh semua anggota.
        </p>
      </div>

      <section className="space-y-3 rounded-lg border p-4">
        <h2 className="text-sm font-medium">Detail Organisasi</h2>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Nama Organisasi</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama organisasi" />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Slug (URL)</label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">/</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="slug-organisasi" />
          </div>
          <p className="text-xs text-muted-foreground">Akses: /{slug}/{sessionData?.teamSlug ?? "..."} (preview)</p>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Logo URL</label>
          <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://..." />
        </div>

        {success && <p className="text-xs text-green-600">{success}</p>}

        <Button onClick={handleSave} isLoading={isUpdating}>Simpan Perubahan</Button>
      </section>

      <section className="space-y-3 rounded-lg border border-destructive/30 p-4">
        <h2 className="text-sm font-medium text-destructive">Hapus Organisasi</h2>
        <p className="text-xs text-muted-foreground">
          Menghapus organisasi akan menghapus semua workspace dan anggota sekaligus.
          Data terkait (konten, jadwal, knowledge, dll.) juga akan hilang.
        </p>

        <Input
          value={deleteConfirm}
          onChange={(e) => setDeleteConfirm(e.target.value)}
          placeholder={`Ketik "${current.name}" untuk konfirmasi`}
          className="max-w-sm"
        />
        <Button
          variant="destructive"
          onClick={handleDelete}
          isLoading={isDeleting}
          disabled={deleteConfirm !== current.name}
        >
          Hapus Organisasi
        </Button>
      </section>
    </div>
  );
}
