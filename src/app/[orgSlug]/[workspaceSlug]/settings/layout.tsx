import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Pengaturan",
};

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return children;
}
