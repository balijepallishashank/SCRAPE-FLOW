"use client";

import BreadcrumbHeader from "@/components/BreadcrumbHeader";
import Sidebar from "@/components/Sidebar";
import { ModeToggle } from "@/components/ThemeModeToggle";
import { UserButton } from "@clerk/nextjs";
import React, { useEffect, useState } from "react";

function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-h-screen">
        <header className="flex items-center justify-between p-4 border-b">
          <BreadcrumbHeader />
          <div className="gap-2 flex items-center">
            <ModeToggle />
            <UserButton />
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4">{children}</div>
      </div>
    </div>
  );
}

export default DashboardLayout;