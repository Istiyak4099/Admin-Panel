
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoaderCircle, Shield, Users, FileText } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function LoginHub() {
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // NOTE: The useEffect hook that was checking for authentication and causing
  // a redirect has been removed to allow unauthenticated access to the dashboard.

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
        <Link href="/credentials-login?role=Admin" className="block transition-transform hover:scale-105">
            <Card className="border-red-500/20 bg-red-500/5 dark:bg-red-500/10 h-full">
                <CardHeader className="text-center items-center p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <Shield className="h-8 w-8" />
                    </div>
                    <CardTitle className="pt-4">Admin Panel</CardTitle>
                    <CardDescription>Full system access and management</CardDescription>
                </CardHeader>
            </Card>
        </Link>
        
        <Link href="/credentials-login?role=Super" className="block transition-transform hover:scale-105">
             <Card className="border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/10 h-full">
                <CardHeader className="text-center items-center p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                        <Users className="h-8 w-8" />
                    </div>
                    <CardTitle className="pt-4">Super Login</CardTitle>
                    <CardDescription>Super management access</CardDescription>
                </CardHeader>
            </Card>
        </Link>
        
        <Link href="/credentials-login?role=Distributor" className="block transition-transform hover:scale-105">
            <Card className="border-green-500/20 bg-green-500/5 dark:bg-green-500/10 h-full">
                <CardHeader className="text-center items-center p-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10 text-green-500">
                        <FileText className="h-8 w-8" />
                    </div>
                    <CardTitle className="pt-4">Distributor Login</CardTitle>
                    <CardDescription>Distributor and retailer management</CardDescription>
                </CardHeader>
            </Card>
        </Link>
    </div>
  );
}
