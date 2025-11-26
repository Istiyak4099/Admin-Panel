'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth, signInWithCustomToken } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { loginAction } from '@/app/users/actions-login';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const firebaseConfigError = "Firebase client configuration is invalid or missing. Please ensure your .env file is correctly populated with values from your Firebase project settings.";

export function CredentialsLoginForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'User';

  const [mobileNumber, setMobileNumber] = useState('01317041181');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
        setIsLoading(false);
        return;
    }

    try {
      // Step 1: Use a server action to validate credentials and get a custom token.
      const result = await loginAction({ mobileNumber, password });

      if (result.error || !result.token) {
        throw new Error(result.error || "Invalid mobile number or password.");
      } 
      
      // Step 2: If the token is returned, sign in on the client.
      await signInWithCustomToken(auth, result.token);
      toast({ title: 'Login Successful!' });
      window.location.href = '/dashboard';

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{role} Login</CardTitle>
        <CardDescription>Enter your mobile number and password to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              type="text"
              placeholder="Enter your mobile number"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || !auth}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
