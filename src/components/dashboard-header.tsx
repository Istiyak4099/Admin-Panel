
"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { NotificationsDropdown } from "@/components/notifications-dropdown";

interface DashboardHeaderProps {
  title: string | React.ReactNode;
  children?: React.ReactNode;
}

export function DashboardHeader({ title, children }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>
      <SidebarTrigger className="hidden peer-data-[state=expanded]:hidden md:flex" />
      <h1 className="flex-1 text-2xl font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        {children}
      </div>
    </header>
  );
}
