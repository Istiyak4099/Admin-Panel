'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getAuth, signInWithEmailAndPassword, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import * as bcrypt from 'bcryptjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import type { User } from '@/lib/types';
import { loginAction } from '@/app/users/actions';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;
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

    if (!auth || !db) {
        toast({ variant: 'destructive', title: 'Configuration Error', description: firebaseConfigError });
        setIsLoading(false);
        return;
    }

    try {
      // Step 1: Find the user by mobile number in Firestore.
      // This query will likely fail initially due to security rules, which is expected.
      const usersRef = collection(db, 'Dealers');
      const q = query(usersRef, where('mobileNumber', '==', mobileNumber));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid mobile number or password.');
      }

      const userDoc = querySnapshot.docs[0];
      const user = userDoc.data() as User;

      // Step 2: Verify the password using bcryptjs.
      if (!user.hashedPassword) {
        throw new Error('User does not have a password set. Please contact an administrator.');
      }

      const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

      if (!isPasswordValid) {
        throw new Error('Invalid mobile number or password.');
      }
      
      // Step 3: If password is valid, use a server action to get a custom token.
      // We are calling the server action here which is currently stubbed out.
      // This part will be completed in the next steps.
      const result = await loginAction({ mobileNumber, password });

      if (result.error || !result.token) {
        // This will happen because loginAction is not implemented.
        // For now, let's just simulate success for UI purposes if password was valid.
        console.log("Simulating login success as server action is a stub.");
        
        // This is a temporary measure to demonstrate the flow would work.
        // We will replace this with a proper custom token flow.
        // For now, we just show a success toast.
        toast({ title: 'Login logic validated!', description: "Next step is fixing security rules." });
        // In a real scenario, we would do: await signInWithCustomToken(auth, result.token);
        // and then: window.location.href = '/dashboard';

      } else {
         // This part will run once the server action is correctly implemented.
        await signInWithCustomToken(auth, result.token);
        toast({ title: 'Login Successful!' });
        window.location.href = '/dashboard';
      }

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
