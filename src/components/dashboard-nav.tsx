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
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/lockers", icon: Lock, label: "Locker Management" },
  { href: "/dashboard/users", icon: Users, label: "User Accounts" },
  { href: "/dashboard/devices", icon: Smartphone, label: "Device Tracking" },
  { href: "/dashboard/payments", icon: CreditCard, label: "Payments" },
  { href: "/dashboard/banners", icon: GalleryHorizontal, label: "App Banners" },
  { href: "/dashboard/activity", icon: FileText, label: "Activity Logs" },
  { href: "/dashboard/support", icon: LifeBuoy, label: "Support Info" },
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
