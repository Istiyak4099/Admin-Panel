
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, signInWithRedirect, getRedirectResult, GoogleAuthProvider, signInWithCustomToken } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';

const auth = firebaseApp ? getAuth(firebaseApp) : null;

function GoogleIcon() {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48">
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,36.219,44,30.561,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
      </svg>
    );
}

const firebaseConfigError = "Firebase client configuration is invalid or missing. Please ensure your .env file is correctly populated with values from your Firebase project settings.";

export function AdminLoginButton() {
  const [isLoading, setIsLoading] = useState(true); // Start loading to handle redirect
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth) {
      toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
      setIsLoading(false);
      return;
    }

    const processRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          // User has successfully signed in. Now verify on backend.
          const idToken = await result.user.getIdToken();
          const response = await fetch('/api/auth/google-signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken }),
          });
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Admin verification failed.');
          }
          toast({ title: 'Admin login successful!' });
          router.push('/dashboard');
        } else {
          // No redirect result, so we're not in the middle of a login flow.
          setIsLoading(false);
        }
      } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
          toast({
            variant: 'destructive',
            title: 'Action Required: Sign-In Method Disabled',
            description: `Google Sign-In is not enabled for this Firebase project. Go to Firebase Console > Authentication > Sign-in method, and enable the 'Google' provider.`,
            duration: 20000,
          });
        } else if (error.code === 'auth/unauthorized-domain') {
          const currentDomain = window.location.hostname;
          toast({
            variant: 'destructive',
            title: 'Action Required: Unauthorized Domain',
            description: `The domain '${currentDomain}' is not authorized. Go to Firebase Console > Authentication > Settings > Authorized domains, and add this exact domain.`,
            duration: 20000,
          });
        } else if (error.code !== 'auth/no-redirect-result') {
           toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: error.message || 'An unexpected error occurred.',
          });
        }
        setIsLoading(false);
      }
    };
    
    processRedirectResult();
  }, [auth, router, toast]);

  const handleAdminLogin = async () => {
    setIsLoading(true);
    if (!auth) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
        setIsLoading(false);
        return;
    }
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("signInWithRedirect immediate error:", error);
      toast({
        variant: 'destructive',
        title: 'Could Not Start Login',
        description: error.message || 'An unexpected error occurred.',
      });
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleAdminLogin}
      disabled={isLoading || !auth}
      className="w-full bg-red-600 text-white hover:bg-red-700"
    >
      {isLoading ? <LoaderCircle className="animate-spin" /> : <GoogleIcon />}
      <span>Admin Panel</span>
    </Button>
  );
}

export function CredentialsLoginForm() {
  const router = useRouter();
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
      router.push('/dashboard');

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
