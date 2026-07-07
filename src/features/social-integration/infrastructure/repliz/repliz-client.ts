const REPLIZ_BASE_URL = process.env.REPLIZ_API_BASE_URL ?? "https://api.repliz.com";

function getAuthHeader(): string {
    const raw = `${process.env.REPLIZ_ACCESS_KEY}:${process.env.REPLIZ_SECRET_KEY}`;
    return `Basic ${Buffer.from(raw).toString("base64")}`;
}

/** Reusable Basic-auth header value for direct fetch() calls */
export function getReplizAuthHeader(): string {
    return getAuthHeader();
}

import type { z } from "zod";
import {
    replizAccountListResponseSchema,
    replizChatListResponseSchema,
    replizChatListSchema,
    replizChatMessageSchema,
    replizChatMessagesResponseSchema,
    replizChatSchema,
    replizCommentListResponseSchema,
    replizCommentSchema,
    replizContentListResponseSchema,
    replizContentSchema,
} from "./repliz-schemas";

async function replizFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${REPLIZ_BASE_URL}${path}`, {
        ...options,
        headers: {
            Authorization: getAuthHeader(),
            "Content-Type": "application/json",
            ...options.headers,
        },
    });

    if (!response.ok) {
        const body = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Repliz API error (${response.status}): ${body.message ?? "unknown error"}`);
    }

    if (response.status === 204) return undefined as T;
    return response.json();
}

/**
 * Same as `replizFetch` but parses the JSON body through a Zod schema so the
 * caller gets a typed, runtime-validated result. Use for every endpoint that
 * has a schema in `repliz-schemas.ts`.
 */
async function validatedFetch<S extends z.ZodTypeAny>(
    path: string,
    schema: S,
    options?: RequestInit
): Promise<z.infer<S>> {
    const raw = await replizFetch<unknown>(path, options);
    const result = schema.safeParse(raw);
    if (!result.success) {
        throw new Error(
            `Repliz response shape mismatch at ${path}: ${result.error.issues
                .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
                .join("; ")}`
        );
    }
    return result.data;
}

export async function getAuthorizeUrl(platform: string, redirectUrl: string): Promise<string> {
    const result = await replizFetch<{ url: string }>(
        `/public/account/${platform}/authorize?redirect=${encodeURIComponent(redirectUrl)}`
    );
    return result.url;
}

export async function connectOneStep(platform: string, code: string): Promise<{ accountId: string }> {
    return replizFetch(`/public/account/${platform}/connect`, {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

export async function reconnectOneStep(platform: string, accountId: string, code: string): Promise<void> {
    await replizFetch(`/public/account/${platform}/connect/${accountId}`, {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

export async function exchangeToken(platform: string, code: string): Promise<{ token: string }> {
    return replizFetch(`/public/account/${platform}/exchange`, {
        method: "POST",
        body: JSON.stringify({ code }),
    });
}

type TwoStepConfig = { listPath: string; idField: string };

const TWO_STEP_ENTITY_CONFIG: Record<string, TwoStepConfig> = {
    facebook: { listPath: "page", idField: "pageId" },
    youtube: { listPath: "channel", idField: "channelId" },
    linkedin: { listPath: "organization", idField: "organizationId" },
};

export type ReplizTwoStepOption = { id: string; name: string; username?: string; picture?: string; token: string };

export async function getTwoStepOptions(platform: string, token: string): Promise<{ docs: ReplizTwoStepOption[] }> {
    const config = TWO_STEP_ENTITY_CONFIG[platform];
    if (!config) throw new Error(`Platform "${platform}" belum dikonfigurasi sebagai 2-step.`);
    return replizFetch(`/public/account/${platform}/${config.listPath}?token=${encodeURIComponent(token)}`);
}

export async function connectTwoStep(platform: string, entityId: string, token: string): Promise<{ accountId: string }> {
    const config = TWO_STEP_ENTITY_CONFIG[platform];
    if (!config) throw new Error(`Platform "${platform}" belum dikonfigurasi sebagai 2-step.`);
    return replizFetch(`/public/account/${platform}/connect`, {
        method: "POST",
        body: JSON.stringify({ [config.idField]: entityId, token }),
    });
}

export async function reconnectTwoStep(platform: string, accountId: string, entityId: string, token: string): Promise<void> {
    const config = TWO_STEP_ENTITY_CONFIG[platform];
    if (!config) throw new Error(`Platform "${platform}" belum dikonfigurasi sebagai 2-step.`);
    await replizFetch(`/public/account/${platform}/connect/${accountId}`, {
        method: "POST",
        body: JSON.stringify({ [config.idField]: entityId, token }),
    });
}

// ─── Account ────────────────────────────────────────────────────────────────────

export type ReplizAccountDetail = {
    id: string;
    generatedId: string;
    name: string;
    username: string | null;
    picture: string | null;
    isConnected: boolean;
    type: string;
};

export async function getOneAccount(accountId: string): Promise<ReplizAccountDetail> {
    return replizFetch(`/public/account/${accountId}`);
}

export type ReplizAccountListDoc = ReplizAccountDetail & {
    userId: string;
    createdAt: string;
    updatedAt: string;
};

export async function listAccounts(options?: {
    page?: number;
    limit?: number;
    types?: string[];
    search?: string;
}): Promise<z.infer<typeof replizAccountListResponseSchema>> {
    const query = new URLSearchParams();
    query.set("page", String(options?.page ?? 1));
    query.set("limit", String(options?.limit ?? 20));
    options?.types?.forEach((t) => query.append("types[]", t));
    if (options?.search) query.set("search", options.search);
    return validatedFetch(`/public/account?${query.toString()}`, replizAccountListResponseSchema);
}

export type ReplizAccountCount = {
    total: number;
    facebook: number;
    youtube: number;
    instagram: number;
    threads: number;
    tiktok: number;
    linkedin: number;
    twitter: number;
    shopee: number;
    limit: number;
};

export async function countAccounts(): Promise<ReplizAccountCount> {
    return replizFetch("/public/account/count");
}

export async function removeAccount(accountId: string): Promise<void> {
    await replizFetch(`/public/account/${accountId}`, { method: "DELETE" });
}

// ─── Content ────────────────────────────────────────────────────────────────────

export type ReplizContentOwner = { id: string; name: string; picture?: string };

export type ReplizContentMedia = {
    type: "image" | "video";
    thumbnail?: string;
    url: string;
};

export type ReplizContentType = "text" | "image" | "video" | "reel" | "album" | "link" | "story";

export type ReplizContent = z.infer<typeof replizContentSchema>;

export async function listContents(options: {
    accountId: string;
    nextToken?: string;
    type?: "media" | "story";
}) {
    const query = new URLSearchParams({ accountId: options.accountId });
    if (options.nextToken) query.set("nextToken", options.nextToken);
    if (options.type) query.set("type", options.type);
    return validatedFetch(`/public/content?${query.toString()}`, replizContentListResponseSchema);
}

export async function listContentsAllAccounts(options: {
    accountIds: string[];
    type?: "media" | "story";
}): Promise<{ docs: (ReplizContent & { accountId: string })[]; errors: string[] }> {
    const fetchCalls = options.accountIds.map((accountId) =>
        listContents({ accountId, type: options.type }).catch(() => null)
    );
    const results = await Promise.all(fetchCalls);
    const errors: string[] = [];
    const docs: (ReplizContent & { accountId: string })[] = [];
    options.accountIds.forEach((accountId, idx) => {
        const r = results[idx];
        if (!r || !Array.isArray(r.docs)) {
            errors.push(`Akun #${idx + 1} gagal dimuat`);
            return;
        }
        r.docs.forEach((d) => docs.push({ ...d, accountId }));
    });
    return { docs, errors };
}

// ─── Cached wrappers for server-side reuse ───────────────────────────────────────────

/** In-memory cache for content list calls (TTL: 60s). Avoids re-fetching from Repliz for same accountIds. */
import { cacheAsync } from "@/shared/lib/cache";

export const cachedListContentsAllAccounts = cacheAsync(
    listContentsAllAccounts,
    { ttl: 60_000 }
);

/** In-memory cache for content statistics calls (TTL: 60s). Each content+account combo is unique. */
export const cachedGetContentStatistics = cacheAsync(
    (contentId: string, accountId: string) => getContentStatistics(contentId, accountId),
    { ttl: 60_000 }
);

export type ReplizContentStatistics = Record<string, number>;

export async function getContentStatistics(
    contentId: string,
    accountId: string
): Promise<ReplizContentStatistics> {
    const query = new URLSearchParams({ accountId });
    return replizFetch(`/public/content/${encodeURIComponent(contentId)}/statistic?${query.toString()}`);
}

export type ReplyCommentInput = {
    accountId: string;
    commentId: string;
    text?: string;
    button?: { label: string; url: string };
};

export async function replyContentComment(
    contentId: string,
    input: ReplyCommentInput
): Promise<{ messageId: string }> {
    return replizFetch(`/public/content/${encodeURIComponent(contentId)}/message`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

// ─── Comment ────────────────────────────────────────────────────────────────────

export type ReplizComment = z.infer<typeof replizCommentSchema>;

export async function listComments(options: {
    page: number;
    limit: number;
    status?: "pending" | "resolved" | "ignored";
    accountIds?: string[];
    search?: string;
}) {
    const query = new URLSearchParams();
    query.set("page", String(options.page));
    query.set("limit", String(options.limit));
    if (options.status) query.set("status", options.status);
    options.accountIds?.forEach((id) => query.append("accountIds[]", id));
    if (options.search) query.set("search", options.search);
    return validatedFetch(`/public/comment?${query.toString()}`, replizCommentListResponseSchema);
}

export async function getOneComment(commentId: string): Promise<ReplizComment> {
    return replizFetch(`/public/comment/${commentId}`);
}

export async function replyToComment(
    commentId: string,
    text: string
): Promise<{ messageId: string }> {
    return replizFetch(`/public/comment/${commentId}`, {
        method: "POST",
        body: JSON.stringify({ text }),
    });
}

export async function updateCommentStatus(
    commentId: string,
    status: "pending" | "resolved" | "ignored"
): Promise<void> {
    await replizFetch(`/public/comment/${commentId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
    });
}

// ─── Chat ───────────────────────────────────────────────────────────────────────
export type ReplizChat = z.infer<typeof replizChatSchema>;
export type ReplizChatMessage = z.infer<typeof replizChatMessageSchema>;

export type ReplizChatType = "text" | "image" | "video" | "audio" | "document" | "button";

export type ReplizChatAttachment = {
    type: "image" | "video" | "audio" | "document";
    url: string;
    thumbnail?: string;
};

export type ReplizChatButton = {
    label: string;
    url: string;
};

export async function listChats(options: {
    page: number;
    limit: number;
    status?: "unread" | "unreplied";
    accountIds?: string[];
    search?: string;
}) {
    const query = new URLSearchParams();
    query.set("page", String(options.page));
    query.set("limit", String(options.limit));
    if (options.status) query.set("status", options.status);
    options.accountIds?.forEach((id) => query.append("accountIds[]", id));
    if (options.search) query.set("search", options.search);
    return validatedFetch(`/public/chat?${query.toString()}`, replizChatListResponseSchema);
}

export async function getOneChat(chatId: string): Promise<z.infer<typeof replizChatSchema>> {
    return replizFetch(`/public/chat/${chatId}`);
}

export async function listChatMessages(
    chatId: string,
    options: { page: number; limit: number }
) {
    const query = new URLSearchParams({
        page: String(options.page),
        limit: String(options.limit),
    });
    return validatedFetch(`/public/chat/${chatId}/message?${query.toString()}`, replizChatMessagesResponseSchema);
}

export type SendChatMessageInput = {
    type: ReplizChatType;
    text?: string;
    image?: ReplizChatAttachment;
    video?: ReplizChatAttachment;
    audio?: ReplizChatAttachment;
    document?: ReplizChatAttachment;
    button?: ReplizChatButton;
};

export async function sendChatMessage(
    chatId: string,
    input: SendChatMessageInput
): Promise<{ messageId: string }> {
    return replizFetch(`/public/chat/${chatId}/message`, {
        method: "POST",
        body: JSON.stringify(input),
    });
}

export async function readChat(chatId: string): Promise<void> {
    await replizFetch(`/public/chat/${chatId}/read`, { method: "POST", body: JSON.stringify({}) });
}