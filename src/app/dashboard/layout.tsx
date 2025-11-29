import { AppProvider } from "@/app/provider";
import React from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppProvider>{children}</AppProvider>;
}
