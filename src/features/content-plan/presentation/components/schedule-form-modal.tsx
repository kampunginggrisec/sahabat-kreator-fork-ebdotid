"use client";

import { useState } from "react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { Button } from "@/shared/presentation/components/ui/button";
import { listConnectionsOptions } from "@/features/social-integration/presentation/hooks/use-social-connections";
import { scheduleContentAction } from "@/features/content-schedule/application/use-cases/schedule-content";
import { MediaUploader } from "@/features/media-upload/presentation/components/media-uploader";

type Draft = {
    id: string;
    caption: string;
    platform: string;
    contentFormat?: string;
    slides?: { order: number; text: string; imageUrl: string }[];
};

type Connection = { id: string; externalName: string; platform: string; isConnected: boolean };
type UploadedMedia = { type: "image" | "video"; url: string };

export function ScheduleFormModal({ draft, onClose, onScheduled }: {
    draft: Draft;
    onClose: () => void;
    onScheduled: () => void;
}) {
    const [connectionId, setConnectionId] = useState("");
    const [dateTime, setDateTime] = useState("");
    const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia | null>(null);
    const [error, setError] = useState<string | null>(null);

    const { data: connectionList = [] } = useSuspenseQuery(listConnectionsOptions());
    const connections: Connection[] = (connectionList as Connection[])
        .filter((c) => c.platform === draft.platform);

    if (connections.length > 0 && !connectionId) {
        setConnectionId(connections[0].id);
    }

    const mutation = useMutation({
        mutationFn: (input: { connectionId: string; scheduleAt: Date; mediaUrls?: UploadedMedia[] }) =>
            scheduleContentAction({
                generatedContentId: draft.id,
                ...input,
            }),
        onSuccess: () => {
            onScheduled();
        },
        onError: (err: Error) => {
            setError(err.message);
        },
    });

    async function handleSubmit() {
        if (!connectionId || !dateTime) {
            setError("Pilih akun dan waktu jadwal terlebih dahulu.");
            return;
        }
        setError(null);

        const mediaUrls = draft.contentFormat === "carousel"
            ? undefined
            : uploadedMedia
              ? [uploadedMedia]
              : undefined;

        mutation.mutate({
            connectionId,
            scheduleAt: new Date(dateTime),
            mediaUrls,
        });
    }

    if (mutation.isPending) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                <div className="w-full max-w-md space-y-4 rounded-lg bg-background p-5">
                    <p className="text-sm text-muted-foreground">Menjadwalkan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md space-y-4 rounded-lg bg-background p-5">
                <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold">Jadwalkan Konten</h2>
                    <button onClick={onClose} className="text-xs text-muted-foreground">Tutup</button>
                </div>

                <p className="line-clamp-3 rounded-md bg-accent/30 p-2 text-xs text-muted-foreground">{draft.caption}</p>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Akun tujuan</label>
                    {connections.length === 0 ? (
                        <p className="text-xs text-amber-600">Belum ada akun {draft.platform} yang terhubung.</p>
                    ) : (
                        <select
                            value={connectionId}
                            onChange={(e) => setConnectionId(e.target.value)}
                            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            {connections.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.externalName} {!c.isConnected && "(perlu reconnect)"}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Tanggal & Jam</label>
                    <input
                        type="datetime-local"
                        value={dateTime}
                        onChange={(e) => setDateTime(e.target.value)}
                        className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-medium">Media</label>
                    {draft.contentFormat === "carousel" ? (
                        <p className="rounded-md border bg-accent/20 p-2 text-xs text-muted-foreground">
                            Media untuk carousel akan dipakai otomatis dari slide yang sudah dibuat.
                        </p>
                    ) : uploadedMedia ? (
                        <div className="flex items-center justify-between rounded-md border p-2 text-xs">
                            <span>
                                {uploadedMedia.type === "video" ? "🎥" : "🖼️"} Media terupload
                            </span>
                            <button onClick={() => setUploadedMedia(null)} className="text-destructive">
                                Hapus
                            </button>
                        </div>
                    ) : (
                        <MediaUploader onUploaded={setUploadedMedia} />
                    )}
                </div>

                <Button type="button" onClick={handleSubmit} disabled={connections.length === 0}>
                    Jadwalkan
                </Button>
            </div>
        </div>
    );
}