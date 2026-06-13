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
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, EyeOff, Lock } from "lucide-react";

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
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-5 w-40" />
                    </div>
                ))}
            </div>
             <div className="space-y-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-full max-sm" />
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
  const [showSystemPassword, setShowSystemPassword] = useState(false);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          let userDocRef = doc(db, 'Dealers', authUser.uid);
          let userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
             userDocRef = doc(db, 'Retailers', authUser.uid);
             userDoc = await getDoc(userDocRef);
          }

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
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <CardTitle>{user.name}</CardTitle>
                    <CardDescription>{user.role}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase text-xs">Shop Name</p>
                    <p className="font-semibold">{user.shopName}</p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase text-xs">Dealer Code</p>
                    <p className="font-semibold">{user.dealerCode}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase text-xs">Email</p>
                    <p className="font-semibold">{user.email}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase text-xs">Mobile</p>
                    <p className="font-semibold">{user.mobileNumber}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground uppercase text-xs flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        System Password
                    </p>
                    <div className="flex items-center gap-2">
                        <p className="font-semibold font-mono">
                            {showSystemPassword ? user.password : "••••••••"}
                        </p>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setShowSystemPassword(!showSystemPassword)}
                        >
                            {showSystemPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground uppercase text-xs">Address</p>
                <p className="font-semibold">{user.address}</p>
            </div>
             <div className="flex items-center space-x-4 rounded-md border p-4 bg-muted/50">
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                    Current Key Balance
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Total keys currently available in your account.
                    </p>
                </div>
                <p className="text-3xl font-bold text-primary">{user.key_balance ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
