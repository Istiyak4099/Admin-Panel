import React from "react";
import Link from "next/link";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from "@/components/ui/sidebar";
import { DashboardNav } from "@/components/dashboard-nav";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { UserNav } from "@/components/user-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-primary hover:bg-primary/10 size-10 rounded-full">
              <ShieldCheck className="size-6" />
            </Button>
            <div className="flex flex-col">
              <span className="text-lg font-semibold tracking-tight text-primary">
                LockerAdmin
              </span>
              <span className="text-xs text-muted-foreground">Pro</span>
            </div>
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
