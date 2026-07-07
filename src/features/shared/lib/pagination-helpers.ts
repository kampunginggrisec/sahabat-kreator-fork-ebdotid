import { useCallback, useMemo, useState } from "react";

// ── Types ───────────────────────────────────────────────────────

export interface PaginatedRequest {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedFilters {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// ── Utility Functions ───────────────────────────────────────────

/**
 * Builds an offset-based request from page number + limit.
 * Offset = (page - 1) * limit.
 */
export function buildPaginatedRequest(paginated: PaginatedRequest): { offset: number; limit: number } {
  const offset = (paginated.page - 1) * paginated.limit;
  return { offset, limit: paginated.limit };
}

/**
 * Builds paginated request with combined filters.
 */
export function buildPaginatedRequestWithFilters(
  paginated: PaginatedRequest,
  filters?: PaginatedFilters
) {
  const request = buildPaginatedRequest(paginated);
  if (filters) {
    return { ...request, ...filters };
  }
  return request;
}

/**
 * Calculates whether there's a next page.
 */
export function hasNextPage(total: number, page: number, limit: number): boolean {
  return page * limit < total;
}

/**
 * Calculates whether there's a previous page.
 */
export function hasPreviousPage(page: number): boolean {
  return page > 1;
}

// ── React Hook ──────────────────────────────────────────────────

/**
 * Shared hook for managing pagination state across pages.
 * Returns page number, limit, and page change handler.
 *
 * Usage:
 *   const { page, setPage } = usePaginatedOptions({ initialPage: 1 });
 *   const request = useMemo(() => ({ page, limit: 20 }), [page]);
 */

interface UsePaginatedOptions {
  /** Initial page number (defaults to 1) */
  initialPage?: number;
  /** Default items per page (defaults to 20) */
  limit?: number;
  /** Available limit options (e.g. [10, 20, 50, 100]) */
  limitOptions?: number[];
}

export function usePaginatedOptions({
  initialPage = 1,
  limit = 20,
  limitOptions = [10, 20, 50, 100],
}: UsePaginatedOptions = {}) {
  const [page, setPage] = useState(initialPage);
  const [limitState, setLimitState] = useState(limit);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const nextPage = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPage((prev) => Math.max(1, prev - 1));
  }, []);

  return {
    page,
    limit: limitState,
    setPage: goToPage,
    setLimit: setLimitState,
    nextPage,
    previousPage,
    limitOptions,
  };
}
