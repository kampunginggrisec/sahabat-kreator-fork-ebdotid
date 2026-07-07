"use client";

import { queryOptions } from "@tanstack/react-query";
import { listConnectionsAction } from "../../application/use-cases/list-connections";
import { connections } from "@/features/shared/lib/query-keys";

export const listConnectionsOptions = () =>
    queryOptions({
        queryKey: connections(),
        queryFn: () => listConnectionsAction(),
        staleTime: 30 * 1000,
    });