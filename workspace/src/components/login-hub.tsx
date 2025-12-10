'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth, GoogleAuthProvider, signInWithRedirect, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle, Shield, Users, FileText } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function LoginHub() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsCheckingAuth(false);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard.
        // This will catch the state change after Google redirect.
        window.location.href = '/dashboard';
      } else {
        // User is signed out.
        setIsCheckingAuth(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleAdminLogin = async () => {
    if (!auth) {
      toast({
        variant: 'destructive',
        title: 'Firebase Not Configured',
        description: 'The app is not connected to Firebase.',
      });
      return;
    }
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  if (isCheckingAuth) {
    return (
        <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 md:grid-cols-3">
        <Card className="border-red-500/20 bg-red-50/50 dark:bg-red-900/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Admin Panel</CardTitle>
                <CardDescription>Full system access and management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleAdminLogin} className="w-full bg-red-500 hover:bg-red-600 text-white" disabled={isLoading}>
                    {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    Admin Panel
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-900/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <Users className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Super Login</CardTitle>
                <CardDescription>Super distributor management access</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-blue-500 hover:bg-blue-600 text-white" disabled={isLoading}>
                    <Link href="/credentials-login?role=Super Login">Super Login</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-900/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <FileText className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Distributor Login</CardTitle>
                <CardDescription>Distributor and retailer management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-green-500 hover:bg-green-600 text-white" disabled={isLoading}>
                    <Link href="/credentials-login?role=Distributor Login">Distributor Login</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
