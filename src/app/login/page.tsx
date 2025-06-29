import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, FileText } from 'lucide-react';
import { AdminLoginButton } from '@/components/auth-components';
import { DomainHelper } from '@/components/domain-helper';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-4xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          EMI Locker System
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Select your panel to access the system
        </p>
      </div>

      <div className="mt-10 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {/* Admin Panel */}
        <Card className="flex flex-col border-red-500/50 bg-red-500/10 dark:border-red-500/30 dark:bg-red-900/20">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-red-500/20 p-3">
              <Shield className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle className="mt-4">Admin Panel</CardTitle>
            <CardDescription>
              Full system access and management
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
            <AdminLoginButton />
          </CardContent>
        </Card>

        {/* Super Distributor Panel */}
        <Card className="flex flex-col border-blue-500/50 bg-blue-500/10 dark:border-blue-500/30 dark:bg-blue-900/20">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-blue-500/20 p-3">
              <Users className="h-8 w-8 text-blue-500" />
            </div>
            <CardTitle className="mt-4">Super Login</CardTitle>
            <CardDescription>
              Super distributor management access
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
            <Button asChild className="w-full bg-blue-600 text-white hover:bg-blue-700">
              <Link href="/credentials-login?role=Super+Distributor">Super Login</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Distributor Panel */}
        <Card className="flex flex-col border-green-500/50 bg-green-500/10 dark:border-green-500/30 dark:bg-green-900/20">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-green-500/20 p-3">
              <FileText className="h-8 w-8 text-green-500" />
            </div>
            <CardTitle className="mt-4">Distributor Login</CardTitle>
            <CardDescription>
              Distributor and retailer management
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
             <Button asChild className="w-full bg-green-600 text-white hover:bg-green-700">
              <Link href="/credentials-login?role=Distributor">Distributor Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="w-full max-w-4xl">
        <DomainHelper />
      </div>

    </div>
  );
}
