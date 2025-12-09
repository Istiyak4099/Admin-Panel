'use client';

import { AppProvider } from "@/app/provider";
import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, type User } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { LoaderCircle } from "lucide-react";

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (!auth) {
            router.push('/login');
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push('/login');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
        );
    }
    
    if (!user) {
        // This case is mostly handled by the onAuthStateChanged redirect,
        // but it's a good fallback.
        return null; 
    }

    return <AppProvider>{children}</AppProvider>;
}
