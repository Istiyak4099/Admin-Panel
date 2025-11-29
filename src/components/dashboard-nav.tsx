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
  Lock,
  Users,
  FileText,
  LifeBuoy,
  Smartphone,
  CreditCard,
  GalleryHorizontal,
} from "lucide-react";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/lockers", icon: Lock, label: "Locker Management" },
  { href: "/users", icon: Users, label: "User Accounts" },
  { href: "/devices", icon: Smartphone, label: "Device Tracking" },
  { href: "/payments", icon: CreditCard, label: "Payments" },
  { href: "/banners", icon: GalleryHorizontal, label: "App Banners" },
  { href: "/activity", icon: FileText, label: "Activity Logs" },
  { href: "/support", icon: LifeBuoy, label: "Support Info" },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <SidebarMenu>
      {navItems.map((item) => (
        <SidebarMenuItem key={item.href}>
          <Link href={item.href}>
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
