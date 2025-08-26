"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
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
import { ArrowDown, ArrowUp, ChevronRight, Trash2, LoaderCircle } from "lucide-react";
import type { User, CodeTransfer } from "@/lib/types";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getAuth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteUserAction, manageCodeBalanceAction } from "@/app/users/actions";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CodeListDialog } from "@/components/code-list-dialog";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

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
              <Skeleton className="h-20 w-full" />
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
  const router = useRouter();
  const { toast } = useToast();
  
  const [deletePending, startDeleteTransition] = useTransition();
  const [codeActionPending, startCodeActionTransition] = useTransition();

  const [user, setUser] = useState<User | null>(null);
  const [actor, setActor] = useState<AuthUser | null>(null);
  const [actorProfile, setActorProfile] = useState<User | null>(null);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [transfers, setTransfers] = useState<CodeTransfer[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (!userId || !db) {
      setPageLoading(false);
      return;
    }

    const fetchData = async () => {
      setPageLoading(true);
      try {
        const userDocRef = doc(db, "Dealers", userId);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ ...userDoc.data(), uid: userDoc.id } as User);

          const managedUsersQuery = query(collection(db, "Dealers"), where("createdByUid", "==", userId));
          const managedUsersSnapshot = await getDocs(managedUsersQuery);
          setManagedUsers(managedUsersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));

          const transfersQuery = query(collection(db, "Dealers", userId, "transfers"), orderBy("date", "desc"));
          const transfersSnapshot = await getDocs(transfersQuery);
          setTransfers(transfersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CodeTransfer)));

        } else {
            setUser(null);
        }

      } catch (error) {
        console.warn("Warning fetching user profile data:", error);
        setUser(null);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshKey]);

  useEffect(() => {
    if (!auth || !db) {
      setAuthLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setActor(user);
      if (user) {
        try {
          const actorDocRef = doc(db, 'Dealers', user.uid);
          const actorDoc = await getDoc(actorDocRef);
          if (actorDoc.exists()) {
            setActorProfile({ uid: user.uid, ...actorDoc.data() } as User);
          } else {
            setActorProfile(null);
          }
        } catch (error) {
          console.warn("Warning fetching actor profile:", error);
          setActorProfile(null);
        }
      } else {
        setActorProfile(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleDelete = () => {
    startDeleteTransition(async () => {
      const result = await deleteUserAction({ userId });
      if (result.error) {
        toast({
          variant: "destructive",
          title: "Error deleting user",
          description: result.error,
        });
      } else {
        toast({
          title: "User deleted successfully",
          description: `User ${user?.name} has been removed.`,
        });
        router.push("/dashboard/users");
      }
    });
  };

  const handleCodeManagement = (formData: FormData) => {
    if (!actor) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to perform this action.' });
        return;
    }

    const quantityValue = Number(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) {
      toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Please enter a valid positive number.' });
      return;
    }
    const actionType = formData.get('actionType') as 'assign' | 'retrieve';
    
    startCodeActionTransition(async () => {
      const result = await manageCodeBalanceAction({
        targetUserId: userId,
        actorUid: actor.uid,
        quantity: quantityValue,
        actionType,
      });

      if (result.error) {
        toast({ variant: "destructive", title: "Action Failed", description: result.error });
      } else {
        toast({ title: "Success", description: result.success });
        setRefreshKey(prev => prev + 1); // Trigger refetch
        setQuantity(""); // Reset controlled input
      }
    });
  };

  if (pageLoading || authLoading) {
    return <UserProfileSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="User Not Found" />
        <main className="flex-1 p-4 pt-6 md:p-8">
          <p>The requested user could not be found. They may have been deleted.</p>
        </main>
      </div>
    );
  }

  const isSelf = actor?.uid === user.uid;

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
            </CardContent>
            {!isSelf && (
            <CardFooter className="flex-col items-start gap-2">
                 <Button variant="outline" className="w-full">Reset Password</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete User
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user
                          account and remove their data from our servers. They will no longer
                          be able to log in.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={deletePending} className="bg-destructive hover:bg-destructive/90">
                          {deletePending ? (
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
            </CardFooter>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
               <CardTitle>
                {actorProfile?.role === 'Admin'
                  ? 'Generate & Manage Codes'
                  : 'Code Management'}
              </CardTitle>
              <CardDescription>
                {actorProfile?.role === 'Admin'
                  ? 'Generate new codes by assigning them to this user.'
                  : `Assign or retrieve codes from this user. Your current balance: ${actorProfile?.codeBalance ?? 0}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CodeListDialog userId={user.uid} userName={user.name}>
                <div className="flex cursor-pointer items-center space-x-4 rounded-md border p-4 transition-colors hover:bg-muted/50">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.name}'s Code Balance
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total available codes this user holds. Click to view.
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{user.codeBalance}</p>
                </div>
              </CodeListDialog>
                {!isSelf && (
                 <form action={handleCodeManagement} className="mt-4 space-y-2">
                  <Label htmlFor="code-quantity">Quantity</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="code-quantity" 
                      name="quantity" 
                      type="number" 
                      placeholder="e.g., 100" 
                      min="1" 
                      required
                      className="flex-1"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    <Button type="submit" name="actionType" value="assign" disabled={codeActionPending || !quantity}>
                      {codeActionPending ? <LoaderCircle className="animate-spin" /> : <ArrowDown />}
                       <span className="hidden sm:inline ml-2">Assign</span>
                    </Button>
                    <Button type="submit" name="actionType" value="retrieve" variant="outline" disabled={codeActionPending || !quantity}>
                      {codeActionPending ? <LoaderCircle className="animate-spin" /> : <ArrowUp />}
                       <span className="hidden sm:inline ml-2">Retrieve</span>
                    </Button>
                  </div>
                </form>
                )}
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
                                    <TableCell>{format(new Date(transfer.date), "PPP p")}</TableCell>
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
