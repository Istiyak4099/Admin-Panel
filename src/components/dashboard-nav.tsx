"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  FileText,
  LifeBuoy,
  User,
} from "lucide-react";
import { useSidebar } from "./ui/sidebar";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/users", icon: Users, label: "User Accounts" },
  { href: "/dashboard/profile", icon: User, label: "My Profile" },
  { href: "/dashboard/activity", icon: FileText, label: "Activity Logs" },
  { href: "/dashboard/support", icon: LifeBuoy, label: "Support Info" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href} onClick={() => setOpenMobile(false)}>
            <SidebarMenuButton
              isActive={pathname === item.href}
              tooltip={item.label}
            >
              <item.icon />
              <span>{item.label}</span>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
