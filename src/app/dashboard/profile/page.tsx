"use client";

import { useState, useEffect, useTransition } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import type { User } from "@/lib/types";
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Skeleton } from "@/components/ui/skeleton";
import { KeyRound, LoaderCircle, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import { updatePasswordAction } from "@/app/users/actions";
import { useToast } from "@/hooks/use-toast";

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
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        try {
          // Check both collections
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

  const handleChangePassword = () => {
    if (!user || !newPassword || newPassword.length < 6) {
        toast({ variant: "destructive", title: "Error", description: "Password must be at least 6 characters." });
        return;
    }

    startTransition(async () => {
        const result = await updatePasswordAction(user.uid, newPassword);
        if (result.error) {
            toast({ variant: "destructive", title: "Update Failed", description: result.error });
        } else {
            toast({ title: "Success", description: result.success });
            setIsChangePasswordOpen(false);
            setNewPassword("");
            // Optimistic update of local user password
            setUser(prev => prev ? { ...prev, password: newPassword } : null);
        }
    });
  };

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
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                            <KeyRound className="h-4 w-4" />
                            Change Password
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Update Password</DialogTitle>
                            <DialogDescription>
                                Set a new password for your account. This will update your login credentials immediately.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleChangePassword} disabled={isPending}>
                                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
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
                            {showCurrentPassword ? user.password : "••••••••"}
                        </p>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                            {showCurrentPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
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
