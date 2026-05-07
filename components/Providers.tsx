"use client";
// AuthProvider has been replaced by LayoutShell.
// This file is kept in case other providers (MQTT, etc.) need to be added here.
export default function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
