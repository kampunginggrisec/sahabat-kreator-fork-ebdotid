/**
 * Centralized query key factory for all server actions.
 *
 * Convention: `['feature', 'entity', ...extraParams]`
 *
 * Usage:
 *   import { queryKeys } from "@/features/shared/lib/query-keys";
 *   useQuery({ queryKey: queryKeys.connectedAccounts(), ... });
 *   invalidateQueries({ queryKey: queryKeys.connectedAccounts() });
 */

// ── Shared (cross-feature) ──────────────────────────────────────

export const connectedAccounts = () => ["connected-accounts"] as const;
export const accounts = () => ["accounts"] as const;

// ── Content Management ──────────────────────────────────────────

export const contents = () => ["contents"] as const;
export const content = (contentId: string, accountId: string) =>
  ["contents", contentId, accountId] as const;
export const contentStats = (contentId: string, accountId: string) =>
  ["contents", "stats", contentId, accountId] as const;

// ��─ Content Plan ────────────────────────────────────────────────

export const scheduledContent = (fromDate: string, toDate: string) =>
  ["scheduled-content", fromDate, toDate] as const;
export const unscheduledDrafts = () => ["unscheduled-drafts"] as const;

// ── Comments ────────────────────────────────────────────────────

export const comments = (filters: object) =>
  ["comments", filters] as const;

// ── Inbox ───────────────────────────────────────────────────────

export const chats = (filters: Record<string, unknown>) =>
  ["chats", filters] as const;
export const chatMessages = (chatId: string, page: number) =>
  ["chat-messages", chatId, page] as const;

// ── Knowledge Base ──────────────────────────────────────────────

export const knowledgeEntries = () => ["knowledge-entries"] as const;

// ── Analytics ─────────────���─────────────────────────────────────

export const analyticsOverview = (daysBack: number) =>
  ["analytics-overview", daysBack] as const;
export const syncPending = () => ["sync-pending"] as const;

// ── Hashtag Research ────────────────────────────────────────────

export const topPerformingHashtags = (daysBack: number) =>
  ["hashtags", "top-performing", daysBack] as const;
export const hashtagNotes = () => ["hashtags", "notes"] as const;

// ── Social Integration ──────────────────────────────────────────

export const connections = (params?: { orgId?: string; workspaceId?: string }) =>
  ["connections", params] as const;

// ── Dashboard ───────────────────────────────────────────────────

export const dashboardSummary = () => ["dashboard-summary"] as const;

// ── Momentum Calendar ─────────────────────────────────────��─────

export const momentumEvents = (orgId: string, workspaceId: string) =>
  ["momentum-events", orgId, workspaceId] as const;

// ── Content Recommendations ─────────────────────────────────────

export const recommendations = (orgSlug: string, workspaceSlug: string) =>
  ["recommendations", orgSlug, workspaceSlug] as const;
