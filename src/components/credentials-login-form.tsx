'use client';

import { useState, useEffect, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { loginAction, type LoginState } from '@/app/users/actions-login';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const firebaseConfigError = "Firebase client configuration is invalid or missing. Ensure your client-side setup is correct.";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending || !auth}>
      {pending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
      Log In
    </Button>
  );
}

export function CredentialsLoginForm() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'User';

  const [password, setPassword] = useState('');
  
  const initialState: LoginState = { success: false, error: null };
  const [state, formAction] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }

    if (state.success && state.user?.email) {
      if (!auth) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
        return;
      }
      
      // The server has verified the password. Now, complete the sign-in on the client.
      const completeSignIn = async () => {
        try {
          await signInWithEmailAndPassword(auth, state.user!.email, password);
          toast({ title: 'Login Successful!' });
          window.location.href = '/dashboard';
        } catch (e: any) {
           toast({
            variant: 'destructive',
            title: 'Login Finalization Failed',
            description: "Your credentials are correct, but the final sign-in step failed. Please try again.",
          });
        }
      };
      completeSignIn();
    }
  }, [state, toast, password]);


  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{role} Login</CardTitle>
        <CardDescription>Enter your mobile number and password to sign in.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mobileNumber">Mobile Number</Label>
            <Input
              id="mobileNumber"
              name="mobileNumber"
              type="text"
              placeholder="Enter your mobile number"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
