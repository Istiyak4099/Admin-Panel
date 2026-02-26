
import { AppProvider } from "@/app/provider";
import React from "react";

export default function UsersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AppProvider>{children}</AppProvider>;
}
