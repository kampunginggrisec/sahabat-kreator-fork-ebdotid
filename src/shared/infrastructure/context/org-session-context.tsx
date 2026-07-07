/**
 * OrgSessionContext — resolves session + org + team ONCE in layout
 * and makes it available to all downstream components & server actions.
 *
 * Eliminates redundant session/team/permission lookups across every
 * withWorkspacePermission wrapper.
 */

"use client";

import {
  createContext,
  useContext,
  type ReactNode,
} from "react";

export interface OrgSessionInfo {
  userId: string;
  email: string;
  name: string;
  organizationId: string;
  organizationSlug: string;
  teamId: string;
  teamName: string;
  teamSlug: string;
}

interface OrgSessionCtxValue {
  data: OrgSessionInfo | null;
  isLoading: boolean;
}

const OrgSessionContext = createContext<OrgSessionCtxValue>({
  data: null,
  isLoading: true,
});

export function useOrgSession() {
  return useContext(OrgSessionContext);
}

export function OrgSessionProvider({
  data,
  children,
}: {
  /** Resolved by the layout before rendering children */
  data: OrgSessionInfo;
  children: ReactNode;
}) {
  return (
    <OrgSessionContext.Provider value={{ data, isLoading: false }}>
      {children}
    </OrgSessionContext.Provider>
  );
}

/** Client-side hook that reads the session resolved in layout */
export function useOrgSessionData(): OrgSessionInfo | null {
  return useOrgSession().data;
}
