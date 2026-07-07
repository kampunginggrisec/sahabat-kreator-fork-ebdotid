"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listChatsAction, listChatMessagesAction } from "../application/use-cases/list-chats";
import { sendChatMessageAction } from "../application/use-cases/manage-chat";
import { useConnectedAccounts } from "@/features/social-integration/presentation/hooks/use-connected-accounts";
import type { ReplizChat, ReplizChatMessage } from "@/features/social-integration/infrastructure/repliz/repliz-client";

import { Button } from "@/shared/presentation/components/ui/button";
import { Input } from "@/shared/presentation/components/ui/input";
import { EmptyState } from "@/shared/presentation/components/ui/empty-state";
import { Spinner } from "@/shared/presentation/components/ui/spinner";
import { Badge } from "@/shared/presentation/components/ui/badge";
import { chats, chatMessages } from "@/features/shared/lib/query-keys";

export function InboxPage() {
    const accountsQuery = useConnectedAccounts();
    const connectedAccounts = accountsQuery.data?.accountIds ?? [];

    const [chatsPage, setChatsPage] = useState(1);
    const [messagesPage, setMessagesPage] = useState(1);
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [search, setSearch] = useState("");

    // ── Chats query ──
    const chatsQuery = useQuery({
        queryKey: chats({
            page: chatsPage,
            limit: 20,
            accountIds: connectedAccounts,
            search: search.trim() || undefined,
        }),
        queryFn: () =>
            listChatsAction({
                page: chatsPage,
                limit: 20,
                accountIds: connectedAccounts,
                search: search.trim() ? search.trim() : undefined,
            }),
        staleTime: 30 * 1000,
    });

    const chatList: ReplizChat[] = chatsQuery.data?.docs ?? [];
    const chatsTotal = chatsQuery.data?.totalPages ?? 1;
    const selectedChat = selectedChatId
        ? chatList.find((c) => c.id === selectedChatId) ?? null
        : null;

    // ── Messages query (only when a chat is selected) ──
    const messagesQuery = useQuery({
        queryKey: chatMessages(selectedChatId ?? "", messagesPage),
        queryFn: () => listChatMessagesAction(selectedChatId as string, { page: messagesPage, limit: 50 }),
        enabled: Boolean(selectedChatId),
        staleTime: 15 * 1000,
    });

    const messages: ReplizChatMessage[] = messagesQuery.data?.docs ?? [];
    const messagesTotal = messagesQuery.data?.totalDocs ?? 0;

    // ── Send message mutation ──
    const qc = useQueryClient();
    const sendMutation = useMutation({
        mutationFn: (args: { chatId: string; text: string }) =>
            sendChatMessageAction(args.chatId, { type: "text", text: args.text }),
        onSuccess: () => {
            setReplyText("");
            qc.invalidateQueries({ queryKey: ["chats"] });
            if (selectedChatId) {
                qc.invalidateQueries({ queryKey: chatMessages(selectedChatId, messagesPage) });
            }
        },
    });

    const handleSend = () => {
        if (!replyText.trim() || !selectedChatId) return;
        sendMutation.mutate({ chatId: selectedChatId, text: replyText.trim() });
    };

    const selectChat = (chatId: string) => {
        setSelectedChatId(chatId);
        setMessagesPage(1);
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-lg border overflow-hidden">
            {/* Chat List Sidebar */}
            <div className={`${selectedChatId ? "hidden md:block md:w-80" : "w-full"} flex flex-col border-r`}>
                <div className="p-4 border-b space-y-3">
                    <Input
                        placeholder="Cari chat..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setChatsPage(1); }}
                    />
                    {chatsQuery.isFetching && <Spinner className="h-3 w-3" />}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {chatsQuery.isLoading && chatList.length === 0 ? (
                        <p className="p-4 text-sm text-muted-foreground">Memuat...</p>
                    ) : chatList.length === 0 ? (
                        <EmptyState title="Tidak ada chat" description="Pesan masuk akan muncul di sini." />
                    ) : (
                        chatList.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => selectChat(chat.id)}
                                className={`w-full text-left p-4 border-b transition-colors hover:bg-muted ${selectedChatId === chat.id ? "bg-muted" : ""}`}
                            >
                                <div className="flex items-start gap-3">
                                    {chat.senderPicture && (
                                        <img src={chat.senderPicture} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm truncate">{chat.senderName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage?.text ?? "(Media)"}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(chat.lastMessage?.sendAt ?? chat.updatedAt).toLocaleString("id-ID")}</p>
                                    </div>
                                    {(chat.unreadCount ?? 0) > 0 && (
                                        <Badge variant="danger" className="shrink-0">{chat.unreadCount}</Badge>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
                {chatsTotal > 1 && (
                    <div className="p-2 flex justify-between border-t">
                        <Button variant="outline" size="sm" disabled={chatsPage <= 1} onClick={() => setChatsPage(p => p - 1)}>
                            ←
                        </Button>
                        <span className="text-xs text-muted-foreground self-center">{chatsPage}/{chatsTotal}</span>
                        <Button variant="outline" size="sm" disabled={chatsPage >= chatsTotal} onClick={() => setChatsPage(p => p + 1)}>
                            →
                        </Button>
                    </div>
                )}
            </div>

            {/* Chat Detail */}
            <div className={`${!selectedChatId ? "hidden md:flex" : "flex"} flex-1 flex-col min-w-0`}>
                {!selectedChat ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Pilih percakapan untuk memulai
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b flex items-center gap-3">
                            {selectedChat.senderPicture && (
                                <img src={selectedChat.senderPicture} alt="" className="h-8 w-8 rounded-full object-cover" />
                            )}
                            <div>
                                <p className="font-medium text-sm">{selectedChat.senderName}</p>
                                <p className="text-xs text-muted-foreground">{selectedChat.account?.name}</p>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {messagesQuery.isLoading && messages.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Memuat pesan...</p>
                            ) : (
                                messages.map((msg) => (
                                    <div key={msg.id} className={`flex ${msg.isFromMe ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[70%] rounded-lg p-3 text-sm ${
                                            msg.isFromMe ? "bg-primary text-primary-foreground" : "bg-muted"
                                        }`}>
                                            {msg.text && <p>{msg.text}</p>}
                                            {msg.type === "image" && msg.attachment && (
                                                <p className="text-xs opacity-70">[Foto]</p>
                                            )}
                                            <p className="text-xs mt-1 opacity-60 text-right">
                                                {new Date(msg.sendAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-4 border-t flex gap-2">
                            <Input
                                autoFocus
                                placeholder="Tulis pesan..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                            />
                            <Button onClick={handleSend} disabled={sendMutation.isPending || !replyText.trim()}>
                                Kirim
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}