"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCommentsAction, type CommentListInput } from "../application/use-cases/list-comments";
import { replyCommentAction, updateCommentStatusAction } from "../application/use-cases/manage-comment";
import { useConnectedAccounts } from "@/features/social-integration/presentation/hooks/use-connected-accounts";
import type { ReplizComment } from "@/features/social-integration/infrastructure/repliz/repliz-client";
import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { EmptyState } from "@/shared/presentation/components/ui/empty-state";
import { Spinner } from "@/shared/presentation/components/ui/spinner";
import { comments } from "@/features/shared/lib/query-keys";

type StatusFilter = "all" | "pending" | "resolved" | "ignored";

export function CommentsPage() {
    const accountsQuery = useConnectedAccounts();
    const connectedAccountIds = useMemo(
        () => accountsQuery.data?.accountIds ?? [],
        [accountsQuery.data]
    );

    const [page, setPage] = useState(1);
    const [status, setStatus] = useState<StatusFilter>("pending");
    const [search, setSearch] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");

    const filter: Omit<CommentListInput, "accountIds"> = useMemo(
        () => ({
            page,
            limit: 20,
            status: status === "all" ? undefined : status,
            search: search.trim() ? search.trim() : undefined,
        }),
        [page, status, search]
    );

    const commentsQuery = useQuery({
        queryKey: comments({ ...filter, accountIds: connectedAccountIds }),
        queryFn: () => listCommentsAction({ ...filter, accountIds: connectedAccountIds }),
        staleTime: 30 * 1000,
    });

    const docs: ReplizComment[] = commentsQuery.data?.docs ?? [];
    const totalPages = commentsQuery.data?.totalPages ?? 1;

    const qc = useQueryClient();

    const replyMutation = useMutation({
        mutationFn: (args: { commentId: string; text: string }) =>
            replyCommentAction(args),
        onSuccess: () => {
            setReplyText("");
            setReplyingTo(null);
            qc.invalidateQueries({ queryKey: ["comments"] });
        },
    });

    const statusMutation = useMutation({
        mutationFn: (args: { commentId: string; status: "pending" | "resolved" | "ignored" }) =>
            updateCommentStatusAction(args),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["comments"] }),
    });

    const submitReply = (commentId: string) => {
        if (!replyText.trim()) return;
        replyMutation.mutate({ commentId, text: replyText.trim() });
    };

    const updateStatus = (commentId: string, next: "pending" | "resolved" | "ignored") => {
        statusMutation.mutate({ commentId, status: next });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-1 rounded-md border p-1">
                    {(["all", "pending", "resolved", "ignored"] as StatusFilter[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatus(s); setPage(1); }}
                            className={`rounded px-3 py-1 text-xs capitalize ${status === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <Input
                    placeholder="Cari komentar..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="max-w-xs"
                />
                {commentsQuery.isFetching && <Spinner className="h-4 w-4" />}
            </div>

            {commentsQuery.isLoading && docs.length === 0 ? (
                <p className="text-sm text-muted-foreground">Memuat komentar...</p>
            ) : docs.length === 0 ? (
                <EmptyState title="Belum ada komentar" description="Komentar dari semua akun terhubung akan muncul di sini." />
            ) : (
                <div className="space-y-3">
                    {docs.map((comment) => (
                        <div key={comment._id} className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                    {comment.from.picture && (
                                        <img src={comment.from.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm">{comment.from.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            di akun {comment.account.name} · {comment.content.title}
                                        </p>
                                        <p className="mt-2 text-sm">{comment.comment}</p>
                                        {comment.reply && (
                                            <div className="mt-3 rounded-md bg-muted p-3 text-sm">
                                                <p className="text-xs text-muted-foreground mb-1">Balasan kamu:</p>
                                                {comment.reply}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className={`shrink-0 rounded px-2 py-1 text-xs capitalize ${comment.status === "pending" ? "bg-yellow-100 text-yellow-800" : comment.status === "resolved" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                                    {comment.status}
                                </span>
                            </div>

                            {replyingTo === comment._id ? (
                                <div className="flex gap-2">
                                    <Input
                                        autoFocus
                                        placeholder="Tulis balasan..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") submitReply(comment._id);
                                            if (e.key === "Escape") { setReplyingTo(null); setReplyText(""); }
                                        }}
                                    />
                                    <Button onClick={() => submitReply(comment._id)} disabled={replyMutation.isPending || !replyText.trim()}>
                                        Kirim
                                    </Button>
                                    <Button variant="ghost" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                                        Batal
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setReplyingTo(comment._id)}>
                                        Balas
                                    </Button>
                                    {comment.status !== "resolved" && (
                                        <Button size="sm" variant="ghost" onClick={() => updateStatus(comment._id, "resolved")} disabled={statusMutation.isPending}>
                                            Tandai Selesai
                                        </Button>
                                    )}
                                    {comment.status !== "ignored" && (
                                        <Button size="sm" variant="ghost" onClick={() => updateStatus(comment._id, "ignored")} disabled={statusMutation.isPending}>
                                            Abaikan
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-between border-t pt-4">
                    <p className="text-sm text-muted-foreground">Halaman {page} dari {totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                            Sebelumnya
                        </Button>
                        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                            Berikutnya
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
