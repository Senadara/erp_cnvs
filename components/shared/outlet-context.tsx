"use client";

import * as React from "react";

const OutletContext = React.createContext<string | null>(null);

export function OutletProvider({
  outletId,
  children,
}: {
  outletId: string | null;
  children: React.ReactNode;
}) {
  return <OutletContext.Provider value={outletId}>{children}</OutletContext.Provider>;
}

export function useOutletId(): string | null {
  return React.useContext(OutletContext);
}
