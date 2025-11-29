
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
import { useState, useEffect, useCallback } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const firebaseConfigError = "Firebase is not configured. Please add your client-side Firebase project configuration to the .env file.";

async function fetchUserProfile(uid: string): Promise<User | null> {
  if (!db) {
    console.warn("Firestore is not initialized for user profile fetch.");
    return null;
  }
  const userDocRef = doc(db, 'Dealers', uid);
  const userDoc = await getDoc(userDocRef);
  if (userDoc.exists()) {
    return { uid: userDoc.id, ...userDoc.data() } as User;
  }
  return null;
}

export function UserNav() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = useCallback(async () => {
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
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An unexpected error occurred.',
      });
    }
  }, [toast]);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: AuthUser | null) => {
      if (user) {
        try {
          const userProfile = await fetchUserProfile(user.uid);
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Failed to fetch user data:", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const skeleton = (
    <div className="flex items-center gap-3 p-2">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="w-32 space-y-1 group-data-[collapsible=icon]:hidden">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  );
  
  if (!mounted || loading) {
    return skeleton;
  }

  if (!currentUser) {
    return (
        <Link href="/" legacyBehavior>
            <Button variant="ghost" className="h-auto w-full justify-start gap-3 p-2 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>?</AvatarFallback>
                </Avatar>
                <div className="text-left group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium">Guest</p>
                    <p className="text-sm text-muted-foreground">Click to log in</p>
                </div>
            </Button>
        </Link>
    );
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
