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
import type { UserRole } from '@/lib/types';
import { createUserAction } from '@/app/users/actions';
import { useTransition, useState } from 'react';
import { LoaderCircle, Eye, EyeOff } from 'lucide-react';

const userRoles: UserRole[] = ["Admin", "Super Distributor", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobile_number: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
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

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(CreateUserSchema),
    defaultValues: {
      name: '',
      mobile_number: '',
      password: '',
      role: 'Retailer',
    },
  });

  function onSubmit(data: CreateUserFormValues) {
    startTransition(async () => {
      const result = await createUserAction(data);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error creating user',
          description: result.error,
        });
      } else {
        toast({
          title: 'User created successfully',
          description: `User ${result.user?.name} has been created. Note: The user list will not update as this is a demo.`,
        });
        onSuccess();
        form.reset();
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
          name="mobile_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input placeholder="123-456-7890" {...field} />
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
          Create User
        </Button>
      </form>
    </Form>
  );
}
