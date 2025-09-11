
"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";

export default function DashboardLayout({ children }) {
  const { status, isConnected } = useAccount();
  const router = useRouter();

  useEffect(() => {
    // Only redirect when clearly disconnected
    if (status === "disconnected") {
      router.replace("/");
    }
  }, [status, router]);

  if (status !== "connected" && !isConnected) {
    return null;
  }

  return (
    <div>
      <Navigation />
      {children}
    </div>
  );
}
