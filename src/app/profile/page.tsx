"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { User } from "@/lib/types";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Skeleton } from "@/components/ui/skeleton";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

function ProfilePageSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={<Skeleton className="h-8 w-48" />} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-7 w-32" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-24" /></CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                ))}
            </div>
             <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full max-w-sm" />
            </div>
            <div className="flex items-center space-x-4 rounded-md border p-4">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          const userDocRef = doc(db, 'Dealers', authUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ ...userDoc.data(), uid: userDoc.id } as User);
          } else {
             setUser(null);
          }
        } catch (error) {
          console.warn("Warning fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return <ProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="Profile Not Found" />
        <main className="flex-1 p-4 pt-6 md:p-8">
          <p>Your user profile could not be loaded. Please try logging in again.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="My Profile" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>{user.name}</CardTitle>
            <CardDescription>{user.role}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Shop Name</p>
                    <p>{user.shopName}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Dealer Code</p>
                    <p>{user.dealerCode}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p>{user.email}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                    <p>{user.mobileNumber}</p>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{user.address}</p>
            </div>
             <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                    Your Code Balance
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Total codes you currently hold.
                    </p>
                </div>
                <p className="text-2xl font-bold">{user.codeBalance}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
