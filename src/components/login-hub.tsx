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
        <Card className="border-red-500/20 bg-red-500/5 dark:bg-red-500/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                    <Shield className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Admin Panel</CardTitle>
                <CardDescription>Full system access and management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-red-600 text-white hover:bg-red-700" disabled={!auth}>
                    <Link href="/credentials-login?role=Admin">Admin Panel</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <Users className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Super Login</CardTitle>
                <CardDescription>Super management access</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={!auth}>
                    <Link href="/credentials-login?role=Super">Super Login</Link>
                </Button>
            </CardContent>
        </Card>
        
        <Card className="border-green-500/20 bg-green-500/5 dark:bg-green-500/10">
            <CardHeader className="text-center items-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                    <FileText className="h-8 w-8" />
                </div>
                <CardTitle className="pt-2">Distributor Login</CardTitle>
                <CardDescription>Distributor and retailer management</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700" disabled={!auth}>
                    <Link href="/credentials-login?role=Distributor">Distributor Login</Link>
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
