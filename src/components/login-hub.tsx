'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Shield, Users, FileText } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function LoginHub() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (!auth) {
        setIsCheckingAuth(false);
        return;
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, redirect to dashboard.
        window.location.href = '/dashboard';
      } else {
        // User is signed out.
        setIsCheckingAuth(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  if (isCheckingAuth) {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Please wait...</p>
        </div>
    );
  }

  return (
    <div className="grid w-full max-w-5xl gap-8 md:grid-cols-3">
        <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Admin Panel</CardTitle>
                <CardDescription>Full system access and management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" disabled={!auth}>
                    <Link href="/credentials-login?role=Admin">Admin Login</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-secondary-foreground/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <Users className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Super Login</CardTitle>
                <CardDescription>Super distributor management access</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" variant="secondary" disabled={!auth}>
                    <Link href="/credentials-login?role=Super">Super Login</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-secondary-foreground/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
                    <FileText className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Distributor Login</CardTitle>
                <CardDescription>Distributor and retailer management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" variant="secondary" disabled={!auth}>
                    <Link href="/credentials-login?role=Distributor">Distributor Login</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
