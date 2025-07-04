
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth, GoogleAuthProvider, signInWithCustomToken, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

const firebaseConfigError = "Firebase client configuration is invalid or missing. Please ensure your .env file is correctly populated with values from your Firebase project settings.";

function GoogleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.219,44,30.556,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );
}

export function GoogleSignInButton() {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true); // Start true to check for redirect result on initial load
  const [isRedirecting, setIsRedirecting] = useState(false); // For button click action

  useEffect(() => {
    if (!auth) {
      setIsProcessing(false);
      return;
    }

    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User has just returned from the redirect.
          toast({ title: "Authenticating..." });
          const idToken = await result.user.getIdToken();

          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Google Sign-In failed on the server.');
          }
          
          await signInWithCustomToken(auth, data.customToken);

          toast({ title: 'Sign-in Successful!' });
          window.location.href = '/dashboard';
          return; // Stop further execution, we are navigating away
        }
      } catch (error: any) {
        console.error('Google Sign-In Redirect Error:', error);
        toast({
          variant: 'destructive',
          title: 'Sign-In Failed',
          description: error.message || 'An unexpected error occurred.',
        });
      }
      // If there was no redirect result to process, or an error occurred, stop processing.
      setIsProcessing(false);
    };

    processRedirectResult();
  }, [toast]);

  const handleSignIn = async () => {
    setIsRedirecting(true);
    if (!auth) {
      toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
      setIsRedirecting(false);
      return;
    }
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider); // This will navigate the user away
  };

  const isLoading = isProcessing || isRedirecting;

  if (isLoading) {
    return (
      <Button disabled className="w-full">
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        {isProcessing ? "Authenticating..." : "Redirecting..."}
      </Button>
    );
  }

  return (
    <Button onClick={handleSignIn} disabled={!auth} className="w-full">
      <GoogleIcon />
      Sign in with Google
    </Button>
  );
}


export function CredentialsLoginForm() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const role = searchParams.get('role') || 'User';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!auth) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
        setIsLoading(false);
        return;
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      
      await signInWithCustomToken(auth, data.customToken);

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
        <CardDescription>Enter your credentials to access your panel.</CardDescription>
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
