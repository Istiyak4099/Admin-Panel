'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, ShieldCheck, Users } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function LoginHub() {
  const { toast } = useToast();
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const handleAdminLogin = async () => {
    setIsAdminLoading(true);
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'The app is not connected to Firebase. Please check the environment variables.',
      });
      setIsAdminLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, 'admin@lockersystem.com', 'admin123');
      toast({ title: 'Admin login successful!' });
      window.location.href = '/dashboard';
    } catch (error: any) {
      console.error("Admin login error:", error);
      toast({
        variant: 'destructive',
        title: 'Admin Login Failed',
        description: 'Please ensure the admin user (admin@lockersystem.com) exists in Firebase Authentication and has the correct password (admin123).',
      });
      setIsAdminLoading(false);
    }
  };

  return (
    <div className="grid w-full max-w-4xl gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="text-center">
          <ShieldCheck className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>Admin Panel</CardTitle>
          <CardDescription>For system administrators only.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-sm text-muted-foreground">
            Click the button below for one-click access to the admin dashboard.
          </p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAdminLogin} className="w-full" disabled={isAdminLoading || !auth}>
            {isAdminLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Enter Admin Panel
          </Button>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader className="text-center">
          <Users className="mx-auto h-12 w-12 text-primary" />
          <CardTitle>User Panel</CardTitle>
          <CardDescription>For Distributors and Retailers.</CardDescription>
        </CardHeader>
        <CardContent>
           <p className="text-center text-sm text-muted-foreground">
            Use your registered mobile number and password to sign in to your panel.
          </p>
        </CardContent>
        <CardFooter>
            <Button asChild className="w-full">
                <Link href="/credentials-login">User Login</Link>
            </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
