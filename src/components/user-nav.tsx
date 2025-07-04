'use client';

import { getAuth, signOut, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import Link from 'next/link';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const firebaseConfigError = "Firebase is not configured. Please add your client-side Firebase project configuration to the .env file.";

async function fetchUserProfile(uid: string): Promise<User | null> {
  if (!db) {
    console.error("Firestore is not initialized.");
    return null;
  }
  
  const userDocRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  
  // This logic is for the rare case of a Google-authenticated Admin logging in
  // for the first time, whose user record might not be in Firestore yet.
  try {
    const authUser = auth?.currentUser;
    if (authUser && authUser.providerData.some(p => p.providerId === 'google.com')) {
       console.log(`User ${uid} not found in Firestore. Attempting to create Admin profile.`);
       const adminUserData: User = {
        uid,
        name: authUser.displayName || 'Admin',
        email: authUser.email || 'admin@example.com',
        role: 'Admin',
        createdAt: new Date().toISOString(),
        status: 'active',
        createdByUid: null,
        lockerId: null,
        address: 'Admin Center',
        shopName: 'Admin Panel',
        dealerCode: 'ADMIN',
        codeBalance: 99999,
        mobileNumber: '0000000000',
      };
      await setDoc(userDocRef, adminUserData);
      console.log(`Created Firestore document for new Admin user: ${uid}`);
      return adminUserData;
    }
  } catch (error) {
     console.error("Error trying to create admin user document:", error);
  }

  console.error(`User profile not found in Firestore for UID: ${uid}`);
  return null;
}

export function UserNav() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This effect runs only on the client, after the initial render.
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: AuthUser | null) => {
      if (user) {
        try {
          const userProfile = await fetchUserProfile(user.uid);
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Failed to fetch user data from Firestore:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: firebaseConfigError,
      });
      return;
    }
    try {
      await signOut(auth);
      toast({ title: 'Logged out successfully.' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An unexpected error occurred.',
      });
    }
  };

  const skeleton = (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="w-32 space-y-1 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
  
  // Before the component is mounted on the client, render a static skeleton
  // to prevent hydration mismatch.
  if (!mounted || loading) {
    return skeleton;
  }

  if (!currentUser) {
    return null;
  }

  const fallback = currentUser.name.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={cn(
            "h-auto w-full justify-start gap-3 p-2",
            "group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0"
            )}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${fallback}`} alt={currentUser.name} data-ai-hint="person user" />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="text-left group-data-[collapsible=icon]:hidden">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-sm text-muted-foreground">{currentUser.email}</p>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {currentUser.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard/profile" className="cursor-pointer">
            <UserIcon className="mr-2 h-4 w-4" />
            <span>My Profile</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
