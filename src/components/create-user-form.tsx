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
import type { User, UserRole } from '@/lib/types';
import { useTransition, useState, useEffect } from 'react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';
import { getAuth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import { createUserAction } from '@/app/users/actions';

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

const ALL_ROLES: UserRole[] = ["Admin", "Super", "Distributor", "Retailer"];

const roleHierarchy: Record<UserRole, UserRole[]> = {
  Admin: ["Admin", "Super", "Distributor", "Retailer"],
  Super: ["Distributor", "Retailer"],
  Distributor: ["Retailer"],
  Retailer: [],
};

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: "Please enter a valid email." }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  shopName: z.string().min(2, { message: 'Shop Name is required.' }),
  address: z.string().min(5, { message: 'Address is required.' }),
  dealerCode: z.string().min(1, { message: 'Dealer Code is required.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(ALL_ROLES as [string, ...string[]]),
});

type CreateUserFormValues = z.infer<typeof CreateUserSchema>;

interface CreateUserFormProps {
    onSuccess: () => void;
}

export function CreateUserForm({ onSuccess }: CreateUserFormProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  
  const availableRoles = currentUser ? roleHierarchy[currentUser.role] : [];

  useEffect(() => {
    if (!auth || !db) {
        setAuthChecked(true);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, async (user: AuthUser | null) => {
      if (user) {
         try {
          const userDocRef = doc(db, 'Dealers', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setCurrentUser({ uid: user.uid, ...userDoc.data() } as User);
          } else {
            // This might be the initial Admin user who doesn't have a Firestore doc yet
            // or an unhandled case. For now, assume null profile.
            setCurrentUser(null);
          }
        } catch (error) {
          console.warn("Could not fetch user profile", error);
          setCurrentUser(null);
        }
      } else {
        setCurrentUser(null);
      }
      setAuthChecked(true);
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

  useEffect(() => {
    if (availableRoles.length > 0 && !availableRoles.includes(form.getValues('role'))) {
      form.setValue('role', availableRoles[0]);
    }
  }, [availableRoles, form]);

  async function onSubmit(data: CreateUserFormValues) {
    startTransition(async () => {
        const result = await createUserAction({
            ...data,
            createdByUid: currentUser?.uid ?? null,
        });
        
        if (result.error) {
            toast({
                variant: 'destructive',
                title: 'Error creating user',
                description: result.error,
            });
        } else {
            toast({
                title: 'User created successfully',
                description: `User ${data.name} has been created.`,
            });
            onSuccess();
            form.reset();
        }
    });
  }
  
  if (!authChecked) {
      return <div className="flex justify-center items-center p-8"><LoaderCircle className="animate-spin"/></div>
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
              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                <FormControl>
                  <SelectTrigger disabled={availableRoles.length === 0}>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableRoles.length > 0 ? (
                    availableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      You cannot create users
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending || availableRoles.length === 0}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create User
        </Button>
      </form>
    </Form>
  );
}
