"use client";

import { useQuery } from "@tanstack/react-query";
import { getConnectedAccountsAction } from "../../application/use-cases/get-connected-accounts";

export type { ConnectionMeta } from "../../application/use-cases/get-connected-accounts";

export function useConnectedAccounts() {
  return useQuery({
    queryKey: ["connected-accounts"],
    queryFn: async () => {
      return getConnectedAccountsAction();
    },
    staleTime: 30 * 1000,
  });
}
