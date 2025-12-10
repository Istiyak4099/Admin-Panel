"use client";

import React from "react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";
import { UserNav } from "@/components/user-nav";

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="size-10 rounded-full text-primary hover:bg-primary/10"
              >
                <ShieldCheck className="size-6" />
              </Button>
              <div className="flex flex-col">
                <span className="text-lg font-semibold tracking-tight text-primary">
                  LockerAdmin
                </span>
                <span className="text-xs text-muted-foreground">Pro</span>
              </div>
            </div>
            <SidebarTrigger className="group-data-[collapsible=icon]:hidden">
              <X />
            </SidebarTrigger>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <DashboardNav />
        </SidebarContent>
        <SidebarFooter>
          <UserNav />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
