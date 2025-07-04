'use client';

import { getAuth, signOut, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut } from 'lucide-react';
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

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
const firebaseConfigError = "Firebase is not configured. Please add your client-side Firebase project configuration to the .env file.";

async function ensureAdminUserInFirestore(uid: string, email: string, name: string): Promise<User> {
  if (!db) {
    throw new Error("Firestore is not initialized.");
  }
  const userDocRef = doc(db, 'Users', uid);
  const userDoc = await getDoc(userDocRef);

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }
  
  // If the user document doesn't exist, create it.
  // This makes the first login for a console-created admin self-healing.
  const adminUserData: User = {
    uid,
    name: name || 'Admin',
    email: email,
    role: 'Admin',
    createdAt: new Date().toISOString(),
    status: 'active',
    createdByUid: null,
    lockerId: null,
    address: 'Admin Center',
    shopName: 'Admin Panel',
    dealerCode: 'ADMIN',
    codeBalance: 99999,
    mobileNumber: '0000000000', // Default value
  };

  await setDoc(userDocRef, adminUserData);
  console.log(`Created Firestore document for new Admin user: ${uid}`);
  return adminUserData;
}

export function UserNav() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: AuthUser | null) => {
      if (user) {
        try {
          // Ensure the user exists in Firestore, creating them if they don't.
          const userProfile = await ensureAdminUserInFirestore(user.uid, user.email || '', user.displayName || 'Admin');
          setCurrentUser(userProfile);
        } catch (error) {
          console.error("Failed to fetch or create user data in Firestore:", error);
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

  if (loading) {
    return (
       <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="w-32 space-y-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
            </div>
        </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  const fallback = currentUser.name.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://placehold.co/40x40.png?text=${fallback}`} alt={currentUser.name} data-ai-hint="person user" />
            <AvatarFallback>{fallback}</AvatarFallback>
          </Avatar>
          <div className="text-left">
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
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
