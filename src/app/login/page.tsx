import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, FileText } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth-components';

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
        <Card className="flex flex-col border-primary/50 bg-primary/10">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-primary/20 p-3">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="mt-4">Admin Panel</CardTitle>
            <CardDescription>
              Full system access and management
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
            <GoogleSignInButton />
          </CardContent>
        </Card>

        {/* Super Distributor Panel */}
        <Card className="flex flex-col border-secondary/50 bg-secondary/10">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-secondary/20 p-3">
              <Users className="h-8 w-8 text-secondary-foreground" />
            </div>
            <CardTitle className="mt-4">Super Login</CardTitle>
            <CardDescription>
              Super distributor management access
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
            <Button asChild className="w-full" variant="secondary">
              <Link href="/credentials-login?role=Super+Distributor">Super Login</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Distributor Panel */}
        <Card className="flex flex-col border-accent/50 bg-accent/10">
          <CardHeader className="items-center text-center">
            <div className="rounded-full bg-accent/20 p-3">
              <FileText className="h-8 w-8 text-accent-foreground" />
            </div>
            <CardTitle className="mt-4">Distributor Login</CardTitle>
            <CardDescription>
              Distributor and retailer management
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto flex flex-col items-center">
             <Button asChild className="w-full" variant="outline">
              <Link href="/credentials-login?role=Distributor">Distributor Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 rounded-md border bg-muted p-3 text-xs text-muted-foreground shadow-lg">
          <p className="font-bold">Firebase Studio Diagnostic:</p>
          <p>
            App is trying to connect to Project ID:{' '}
            <code className="font-mono text-foreground">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                'NOT SET! Please check your .env file.'}
            </code>
          </p>
        </div>
      )}

    </div>
  );
}
