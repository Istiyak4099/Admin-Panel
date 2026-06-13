
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
  ShieldAlert,
  Users,
  Briefcase,
  Store,
  UserCheck,
  FileText,
  LifeBuoy,
  User,
  UserPlus,
  KeyRound,
  ImagePlus,
} from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { firebaseApp } from "@/lib/firebase-client";
import { RequestKeyDialog } from "@/components/request-key-dialog";

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

const baseNavItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/create-account", icon: UserPlus, label: "Create Account" },
  { href: "/dashboard/admins", icon: ShieldAlert, label: "Admins" },
  { href: "/dashboard/super-distributors", icon: Users, label: "Super Distributors" },
  { href: "/dashboard/distributors", icon: Briefcase, label: "Distributors" },
  { href: "/dashboard/retailers", icon: Store, label: "Retailers" },
  { href: "/dashboard/customers", icon: UserCheck, label: "Customers" },
  { href: "/dashboard/banners", icon: ImagePlus, label: "Banners" },
  { href: "/dashboard/profile", icon: User, label: "My Profile" },
  { href: "/dashboard/activity", icon: FileText, label: "Activity Logs" },
  { href: "/dashboard/support", icon: LifeBuoy, label: "Support Info" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) return;
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        let dRef = doc(db, "Dealers", user.uid);
        let dSnap = await getDoc(dRef);
        if (dSnap.exists()) {
          setIsAdmin(dSnap.data().role === "Admin");
        } else {
          setIsAdmin(false);
        }
      }
    });
    return unsub;
  }, []);

  return (
    <SidebarMenu>
      {baseNavItems.map((item) => (
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
      {!isAdmin && uid && (
        <SidebarMenuItem>
          <RequestKeyDialog uid={uid}>
            <SidebarMenuButton tooltip="Request Key">
              <KeyRound />
              <span>Request Key</span>
            </SidebarMenuButton>
          </RequestKeyDialog>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
