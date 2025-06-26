"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Lock,
  Users,
  CreditCard,
  FileText,
  Smartphone,
  LifeBuoy,
  ImageIcon,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/lockers", icon: Lock, label: "Locker Management" },
  { href: "/dashboard/users", icon: Users, label: "User Accounts" },
  { href: "/dashboard/payments", icon: CreditCard, label: "Payment History" },
  { href: "/dashboard/devices", icon: Smartphone, label: "Device Tracking" },
  { href: "/dashboard/activity", icon: FileText, label: "Activity Logs" },
  { href: "/dashboard/banners", icon: ImageIcon, label: "App Banners" },
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
