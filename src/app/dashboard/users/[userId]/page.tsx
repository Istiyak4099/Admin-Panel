"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import type { User, CodeTransfer } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import { Skeleton } from "@/components/ui/skeleton";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

function UserProfileSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={<Skeleton className="h-8 w-48" />} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle><Skeleton className="h-7 w-32" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-24" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle><Skeleton className="h-7 w-48" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-7 w-52" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-72" /></CardDescription>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}


export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const [user, setUser] = useState<User | null>(null);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<CodeTransfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user profile
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: userDoc.id } as User);
        }

        // Fetch managed users
        const managedUsersQuery = query(collection(db, "users"), where("createdByUid", "==", userId));
        const managedUsersSnapshot = await getDocs(managedUsersQuery);
        setManagedUsers(managedUsersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));

        // Fetch transfer history (assuming subcollection 'transfers')
        const transfersQuery = query(collection(db, "users", userId, "transfers"));
        const transfersSnapshot = await getDocs(transfersQuery);
        setTransfers(transfersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CodeTransfer)));

      } catch (error) {
        console.error("Error fetching user profile data:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) {
    return <UserProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="User Not Found" />
        <main className="flex-1 p-4 pt-6 md:p-8">
          <p>The requested user could not be found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={user.name} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>{user.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Shop Name</p>
                <p>{user.shopName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                <p>{user.mobileNumber}</p>
              </div>
               <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{user.address}</p>
              </div>
               <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dealer Code</p>
                <p>{user.dealerCode}</p>
              </div>
              {user.password && (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Password</p>
                  <p className="font-semibold">{user.password}</p>
                </div>
              )}
            </CardContent>
            <CardFooter>
                 <Button variant="outline">Reset Password</Button>
            </CardFooter>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Code Management</CardTitle>
              <CardDescription>Assign or retrieve codes from this user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Current Code Balance
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total codes this user currently holds.
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{user.codeBalance}</p>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="code-quantity">Quantity</Label>
                  <div className="flex gap-2">
                    <Input id="code-quantity" type="number" placeholder="e.g., 100" />
                    <Button><ArrowDown className="mr-2 h-4 w-4" /> Assign</Button>
                    <Button variant="outline"><ArrowUp className="mr-2 h-4 w-4" /> Retrieve</Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Code Transfer History</CardTitle>
                <CardDescription>Log of all code assignments and retrievals for this user.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.length > 0 ? (
                            transfers.map((transfer: CodeTransfer) => (
                                <TableRow key={transfer.id}>
                                    <TableCell>
                                        <Badge variant={transfer.type === 'assigned' ? 'default' : 'secondary'} className="capitalize">{transfer.type}</Badge>
                                    </TableCell>
                                    <TableCell>{transfer.from}</TableCell>
                                    <TableCell>{transfer.to}</TableCell>
                                    <TableCell>{transfer.quantity}</TableCell>
                                    <TableCell>{transfer.date}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No transfer history found.
                                 </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {managedUsers.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Managed Users</CardTitle>
                    <CardDescription>Users created and managed by {user.name}. Click a user to see their profile.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Code Balance</TableHead>
                                <TableHead>
                                  <span className="sr-only">Actions</span>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managedUsers.map((managedUser: User) => (
                                <TableRow key={managedUser.uid} className="group hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                      <Link href={`/dashboard/users/${managedUser.uid}`} className="block hover:underline">
                                        {managedUser.name}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <Link href={`/dashboard/users/${managedUser.uid}`} className="block">
                                        <Badge variant="outline">{managedUser.role}</Badge>
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <Link href={`/dashboard/users/${managedUser.uid}`} className="block">
                                        {managedUser.shopName}
                                      </Link>
                                    </TableCell>
                                    <TableCell>
                                      <Link href={`/dashboard/users/${managedUser.uid}`} className="block">
                                        {managedUser.codeBalance}
                                      </Link>
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Button asChild variant="ghost" size="icon">
                                        <Link href={`/dashboard/users/${managedUser.uid}`}>
                                          <ChevronRight className="h-4 w-4" />
                                          <span className="sr-only">View User</span>
                                        </Link>
                                      </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
