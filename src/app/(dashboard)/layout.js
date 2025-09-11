"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Navigation from "../../components/Navigation";

export default function DashboardLayout({ children }) {
  const { address, isConnected, isConnecting } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!isConnecting && !isConnected) {
      router.replace("/");
    }
  }, [isConnecting, isConnected, router]);

  if (!isConnected) {
    return null;
  }

  return (
    <div>
      <Navigation />
      {children}
    </div>
  );
}
