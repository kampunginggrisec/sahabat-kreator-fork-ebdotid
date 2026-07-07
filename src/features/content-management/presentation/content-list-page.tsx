"use client";

import { useState, useMemo, useCallback } from "react";
import type { ComponentType, SVGProps } from "react";
import { Search, Filter, Image as ImageIcon, BarChart3, ExternalLink, Loader2, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { useConnectedAccounts } from "@/features/social-integration/presentation/hooks/use-connected-accounts";
import type { ConnectionMeta } from "@/features/social-integration/application/use-cases/get-connected-accounts";
import {
    listContentsAllAction,
    type ContentItem,
} from "../application/use-cases/list-contents";
import { Input } from "@/shared/presentation/components/ui/input";
import { Badge } from "@/shared/presentation/components/ui/badge";
import { EmptyState } from "@/shared/presentation/components/ui/empty-state";
import { Spinner } from "@/shared/presentation/components/ui/spinner";
import { Button } from "@/shared/presentation/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/presentation/components/ui/select";
import { ContentGrid } from "@/shared/presentation/components/ui/content-grid";
import { useQuery } from "@tanstack/react-query";
import {
    FacebookIcon,
    InstagramIcon,
    ThreadsIcon,
    TikTokIcon,
    XIcon,
    YoutubeIcon,
    LinkedInIcon,
} from "@/shared/presentation/icons/brand";
import { useContentStats } from "./hooks/use-content-stats";

const ACCOUNT_FILTER_ALL = "__all__";
const TYPE_FILTER_ALL = "__all__";
const PAGE_SIZE = 15;

const PLATFORM_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement> & { className?: string }>> = {
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    threads: ThreadsIcon,
    tiktok: TikTokIcon,
    x: XIcon,
    twitter: XIcon,
    youtube: YoutubeIcon,
    linkedin: LinkedInIcon,
};

function PlatformIcon({ type, className }: { type: string; className?: string }) {
    const Icon = PLATFORM_ICON[type.toLowerCase()];
    if (!Icon) return <Users className={className} aria-hidden />;
    return <Icon className={className} />;
}

export function ContentListPage() {
    // ── Data: connected accounts (shared hook, deduped across the app) ──
    const accountsQuery = useConnectedAccounts();
    const connections = accountsQuery.data?.connections ?? [];

    // ── Local UI state (only what doesn't belong in cache) ──
    const [search, setSearch] = useState("");
    const [accountFilter, setAccountFilter] = useState<string>(ACCOUNT_FILTER_ALL);
    const [typeFilter, setTypeFilter] = useState<string>(TYPE_FILTER_ALL);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [page, setPage] = useState(0);

    const accountIds = useMemo(
        () => connections.map((c) => c.replizAccountId),
        [connections]
    );

    // ── Query: contents list (only runs when we have accountIds) ──
    const contentsQuery = useQuery({
        queryKey: ["contents", accountIds],
        queryFn: async () => {
            return listContentsAllAction({ accountIds, type: "media" });
        },
        enabled: accountIds.length > 0,
        staleTime: 60 * 1000,
    });

    const contents: ContentItem[] = contentsQuery.data?.docs ?? [];
    const loadErrors = contentsQuery.data?.errors ?? [];

    // ── Reset to first page whenever filters change ──
    const handleSearchChange = useCallback((v: string) => {
        setSearch(v);
        setPage(0);
    }, []);
    const handleAccountFilterChange = useCallback((v: string) => {
        setAccountFilter(v);
        setPage(0);
    }, []);
    const handleTypeFilterChange = useCallback((v: string) => {
        setTypeFilter(v);
        setPage(0);
    }, []);

    const accountMap = useMemo(() => {
        const map = new Map<string, ConnectionMeta>();
        for (const conn of connections) map.set(conn.replizAccountId, conn);
        return map;
    }, [connections]);

    const filteredContents = useMemo(() => {
        return contents.filter((c) => {
            if (accountFilter !== ACCOUNT_FILTER_ALL && c.accountId !== accountFilter) return false;
            if (typeFilter !== TYPE_FILTER_ALL && c.type !== typeFilter) return false;
            if (search.trim()) {
                const q = search.toLowerCase();
                const haystack = `${c.title ?? ""} ${c.description ?? ""} ${c.topic ?? ""}`.toLowerCase();
                if (!haystack.includes(q)) return false;
            }
            return true;
        });
    }, [contents, accountFilter, typeFilter, search]);

    const totalFiltered = filteredContents.length;
    const totalPages = Math.ceil(totalFiltered / PAGE_SIZE) || 1;
    const startIdx = page * PAGE_SIZE;
    const endIdx = Math.min(startIdx + PAGE_SIZE, totalFiltered);

    const currentPageContents = useMemo(
        () => filteredContents.slice(startIdx, endIdx),
        [filteredContents, startIdx, endIdx]
    );

    const uniqueTypes = useMemo(
        () => Array.from(new Set(contents.map((c) => c.type).filter((t): t is string => Boolean(t)))),
        [contents]
    );

    const goTo = (direction: "prev" | "next") => {
        setPage((p) => {
            if (direction === "prev") return Math.max(0, p - 1);
            return Math.min(totalPages - 1, p + 1);
        });
        setExpandedId(null);
    };

    // ── Loading / error states ──
    if (accountsQuery.isLoading) {
        return <div className="flex items-center justify-center p-12"><Spinner /></div>;
    }

    if (accountsQuery.error) {
        return (
            <EmptyState
                title="Gagal memuat akun"
                description="Terjadi kesalahan saat memuat akun terhubung. Coba refresh halaman."
            />
        );
    }

    if (connections.length === 0) {
        return (
            <EmptyState
                title="Belum ada akun terhubung"
                description="Hubungkan akun media sosial di halaman Koneksi untuk mulai mengelola konten."
            />
        );
    }

    return (
        <div className="space-y-6">
            {/* Filter bar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Cari judul, topik, atau deskripsi..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={accountFilter} onValueChange={handleAccountFilterChange}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Semua akun" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={ACCOUNT_FILTER_ALL}>
                                <span className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Semua akun</span>
                                </span>
                            </SelectItem>
                            {connections.map((conn) => (
                                <SelectItem key={conn.replizAccountId} value={conn.replizAccountId}>
                                    <span className="flex items-center gap-2">
                                        <PlatformIcon type={conn.platform} className="h-4 w-4 text-muted-foreground" />
                                        <span>{conn.externalName}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Semua tipe" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={TYPE_FILTER_ALL}>Semua tipe</SelectItem>
                            {uniqueTypes.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {loadErrors.length > 0 && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    Gagal memuat konten dari {loadErrors.length} akun. Coba refresh halaman.
                </div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                    Menampilkan <strong className="text-foreground">{totalFiltered === 0 ? 0 : startIdx + 1}–{endIdx}</strong> dari {totalFiltered} konten
                </span>
                {contentsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>

            {contentsQuery.isLoading && currentPageContents.length === 0 ? (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                        <div key={i} className="overflow-hidden rounded-xl border bg-card">
                            <div className="aspect-square w-full animate-pulse bg-muted" />
                            <div className="space-y-3 p-4">
                                <div className="space-y-2">
                                    <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-full animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
                                    <div className="h-3 w-1/4 animate-pulse rounded bg-muted" />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <div className="h-8 flex-1 animate-pulse rounded-md bg-muted" />
                                    <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : totalFiltered === 0 ? (
                <EmptyState
                    title="Tidak ada konten"
                    description={search || accountFilter !== ACCOUNT_FILTER_ALL || typeFilter !== TYPE_FILTER_ALL
                        ? "Coba ubah filter atau kata kunci pencarian."
                        : "Belum ada konten dari akun terhubung."}
                />
            ) : (
                <>
                <ContentGrid>
                    {currentPageContents.map((content) => (
                        <ContentCard
                            key={`${content.accountId}:${content.id}`}
                            content={content}
                            account={content.accountId ? accountMap.get(content.accountId) ?? null : null}
                            isExpanded={expandedId === `${content.accountId}:${content.id}`}
                            onToggleStats={() => setExpandedId(prev => prev === `${content.accountId}:${content.id}` ? null : `${content.accountId}:${content.id}`)}
                        />
                    ))}
                </ContentGrid>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between gap-2 rounded-xl border bg-card px-4 py-3">
                        <p className="text-xs text-muted-foreground">
                            Halaman <strong className="text-foreground">{page + 1}</strong> dari {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goTo("prev")}
                                disabled={page === 0}
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span className="hidden sm:inline">Sebelumnya</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => goTo("next")}
                                disabled={page >= totalPages - 1}
                            >
                                <span className="hidden sm:inline">Selanjutnya</span>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
                </>
            )}
        </div>
    );
}

interface ContentCardProps {
    content: ContentItem;
    account: ConnectionMeta | null;
    isExpanded: boolean;
    onToggleStats: () => void;
}

function ContentCard({ content, account, isExpanded, onToggleStats }: ContentCardProps) {
    const statsQuery = useContentStats(content.id, content.accountId, { enabled: isExpanded });

    const firstMedia = content.medias?.[0];
    const thumbnail = firstMedia?.thumbnail;
    const title = content.title || "Tanpa judul";
    const description = content.description || "";
    const topic = content.topic || "";

    return (
        <div className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
            {/* Thumbnail */}
            <button
                type="button"
                onClick={onToggleStats}
                className="relative block aspect-square w-full overflow-hidden bg-muted"
            >
                {thumbnail ? (
                    <img
                        src={thumbnail}
                        alt={String(title)}
                        className="h-full w-full object-cover transition-transform hover:scale-105"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-12 w-12 text-muted-foreground/40" />
                    </div>
                )}
                {content.hasAutomation && (
                    <Badge className="absolute right-2 top-2">Automated</Badge>
                )}
                {account && (
                    <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 shadow-sm backdrop-blur-sm">
                        <PlatformIcon type={account.platform} className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                            {account.platform}
                        </span>
                    </div>
                )}
            </button>

            {/* Body */}
            <div className="space-y-3 p-4">
                <div>
                    <p className="line-clamp-2 font-medium text-sm leading-tight">
                        {String(title)}
                    </p>
                    {description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {String(description)}
                        </p>
                    )}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {account ? (
                        <span className="flex items-center gap-1.5 truncate">
                            <PlatformIcon type={account.platform} className="h-4 w-4 shrink-0 opacity-70" />
                            <span className="truncate">{account.externalName}</span>
                        </span>
                    ) : (
                        <span>—</span>
                    )}
                    {content.createdAt && (
                        <span>{new Date(String(content.createdAt)).toLocaleDateString("id-ID")}</span>
                    )}
                </div>

                {topic && (
                    <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Topik:</span> {String(topic)}
                    </p>
                )}

                <div className="flex items-center gap-2 pt-1">
                    <Button
                        size="sm"
                        variant={isExpanded ? "default" : "outline"}
                        onClick={onToggleStats}
                        disabled={statsQuery.isLoading}
                        className="flex-1"
                    >
                        {statsQuery.isLoading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <BarChart3 className="h-3 w-3" />
                        )}
                        {isExpanded ? "Sembunyikan" : "Statistik"}
                    </Button>
                    {content.url && (
                        <a
                            href={String(content.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-8 items-center justify-center gap-1 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            <ExternalLink className="h-3 w-3" />
                        </a>
                    )}
                </div>

                {/* Expanded stats */}
                {isExpanded && (
                    <div className="border-t pt-3">
                        {statsQuery.isLoading ? (
                            <div className="flex justify-center py-2"><Spinner /></div>
                        ) : statsQuery.data && Object.keys(statsQuery.data).length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(statsQuery.data).slice(0, 6).map(([k, v]) => (
                                    <div key={k} className="rounded-md bg-muted/50 px-2 py-1.5 text-center">
                                        <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                            {k.replace(/_/g, " ")}
                                        </p>
                                        <p className="text-sm font-semibold">
                                            {typeof v === "number" ? v.toLocaleString("id-ID") : String(v)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-xs text-muted-foreground py-2">
                                Belum ada statistik tersedia.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}