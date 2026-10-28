"use client";

import AppHeader from "@/components/admin/common/AppHeader";
import AppSidebar from "@/components/admin/common/AppSidebar";
import Backdrop from "@/components/admin/common/Backdrop";
import { useSidebar } from "@/context/SidebarContext";
import type { Role } from "@/lib/auth/roles";
import React from "react";

export default function AdminShell({
  children,
  role,
}: {
  children: React.ReactNode;
  role: Role;
}) {
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();

  const mainContentMargin = isMobileOpen
    ? "ml-0"
    : isExpanded || isHovered
      ? "lg:ml-[290px]"
      : "lg:ml-[90px]";

  return (
    <div className="min-h-screen xl:flex">
      <AppSidebar role={role} />
      <Backdrop />
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${mainContentMargin}`}
      >
        <AppHeader />
        <div className="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
