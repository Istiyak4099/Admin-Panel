'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { UserRole, User } from '@/lib/types';
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as AuthUser, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

const userRoles: UserRole[] = ["Admin", "Super", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: "Please enter a valid email." }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  shopName: z.string().min(2, { message: 'Shop Name is required.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  dealerCode: z.string().min(1, { message: 'Dealer Code is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(userRoles as [string, ...string[]]),
});

type CreateUserFormValues = z.infer<typeof CreateUserSchema>;

interface CreateUserFormProps {
    onSuccess: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      mobileNumber: '',
      password: '',
      role: 'Distributor',
      shopName: '',
      address: '',
      dealerCode: '',
    },
  });

  async function onSubmit(data: CreateUserFormValues) {
    if (!currentUser || !auth || !db) {
        toast({
            variant: 'destructive',
            title: 'Authentication Error',
            description: 'You must be logged in to create a user.',
        });
        return;
    }

    startTransition(async () => {
        try {
            const { name, mobileNumber, email, password, role, address, shopName, dealerCode } = data;

            // Check for existing user by mobile or email in Firestore
            const usersRef = collection(db, 'Dealers');
            const mobileQuery = query(usersRef, where('mobileNumber', '==', mobileNumber));
            const emailQuery = query(usersRef, where('email', '==', email));

            const [mobileSnapshot, emailSnapshot] = await Promise.all([
                getDocs(mobileQuery),
                getDocs(emailQuery)
            ]);

            if (!mobileSnapshot.empty) {
                throw new Error('A user with this mobile number already exists.');
            }
            if (!emailSnapshot.empty) {
                throw new Error('A user with this email address already exists.');
            }

            // Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newAuthUser = userCredential.user;

            // Create user data for Firestore
            const newUser: User = {
                uid: newAuthUser.uid,
                name,
                mobileNumber,
                email,
                // We do NOT store the password in Firestore for security reasons
                role,
                createdAt: new Date().toISOString(),
                status: 'active',
                createdByUid: currentUser.uid,
                lockerId: null,
                address,
                shopName,
                dealerCode,
                codeBalance: 0,
            };

            // Save user data to Firestore
            await setDoc(doc(db, 'Dealers', newAuthUser.uid), newUser);
            
            toast({
                title: 'User created successfully',
                description: `User ${name} has been created.`,
            });
            onSuccess();
            form.reset();

        } catch (error: any) {
            let errorMessage = "An unexpected error occurred.";
            if (error.code) {
                switch (error.code) {
                    case 'auth/email-already-in-use':
                        errorMessage = "This email is already associated with an account.";
                        break;
                    case 'auth/weak-password':
                        errorMessage = "The password is too weak. Please choose a stronger password.";
                        break;
                    default:
                        errorMessage = error.message;
                }
            } else if(error.message) {
                 errorMessage = error.message;
            }
             toast({
                variant: 'destructive',
                title: 'Error creating user',
                description: errorMessage,
            });
        }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="1234567890" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="shopName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Shop Name</FormLabel>
              <FormControl>
                <Input placeholder="The Corner Shop" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main Street, Anytown" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dealerCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dealer Code</FormLabel>
              <FormControl>
                <Input placeholder="DEAL-456" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
               <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••" 
                    {...field} 
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending || !currentUser}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create User
        </Button>
      </form>
    </Form>
  );
}
