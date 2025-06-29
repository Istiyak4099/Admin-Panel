'use client';

import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
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

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const firebaseConfigError = "Firebase is not configured. Please add your client-side Firebase project configuration to the .env file.";

// Mock user data for display. In a real app, this would come from the auth state.
const currentUser = {
  name: "Admin User",
  email: "admin@locker.pro",
  avatar: "https://placehold.co/40x40.png",
  fallback: "AD",
  role: "Admin"
};


export function UserNav() {
  const router = useRouter();
  const { toast } = useToast();

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
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        variant: 'destructive',
        title: 'Logout Failed',
        description: 'An unexpected error occurred.',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-auto w-full justify-start gap-3 p-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentUser.avatar} alt={currentUser.name} data-ai-hint="male person" />
            <AvatarFallback>{currentUser.fallback}</AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-muted-foreground">{currentUser.email}</p>
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
