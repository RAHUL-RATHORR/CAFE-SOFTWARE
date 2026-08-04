import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Menu",
  description: "QR ordering and customer self-service menu",
};

/**
 * Public customer portal shell — no dashboard auth / sidebar.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {children}
    </div>
  );
}
