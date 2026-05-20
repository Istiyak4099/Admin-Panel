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
import { ArrowDown, ArrowUp, ChevronRight, Trash2, LoaderCircle, Users } from "lucide-react";
import type { User, CodeTransfer, Customer } from "@/lib/types";
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

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

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
  const [managedDealers, setManagedDealers] = useState<User[]>([]);
  const [managedCustomers, setManagedCustomers] = useState<Customer[]>([]);
  const [transfers, setTransfers] = useState<CodeTransfer[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (!userId || !db) return;

    const fetchData = async () => {
      setPageLoading(true);
      try {
        let userDocRef = doc(db, "Dealers", userId);
        let userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
           userDocRef = doc(db, "Retailers", userId);
           userDoc = await getDoc(userDocRef);
        }

        if (userDoc.exists()) {
          const userData = { ...userDoc.data(), uid: userDoc.id } as User;
          setUser(userData);

          if (userData.role === 'Retailer') {
            // Fetch Customers for Retailer
            const customersQuery = query(collection(db, "Customers"), where("created_by_uid", "==", userId));
            const customersSnap = await getDocs(customersQuery);
            setManagedCustomers(customersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Customer)));
          } else {
            // Fetch managed Dealers/Retailers
            const dealersQuery = query(collection(db, "Dealers"), where("createdByUid", "==", userId));
            const retailersQuery = query(collection(db, "Retailers"), where("createdByUid", "==", userId));
            
            const [dealersSnap, retailersSnap] = await Promise.all([
              getDocs(dealersQuery),
              getDocs(retailersQuery)
            ]);
            
            setManagedDealers([
               ...dealersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)),
               ...retailersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User))
            ]);
          }

          const transfersQuery = query(collection(userDocRef, "transfers"), orderBy("date", "desc"));
          const transfersSnapshot = await getDocs(transfersQuery).catch(() => ({ docs: [] }));
          setTransfers(transfersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CodeTransfer)));

        } else {
            setUser(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [userId, refreshKey]);

  useEffect(() => {
    if (!auth || !db) return;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setActor(user);
      if (user) {
        let actorDocRef = doc(db, 'Dealers', user.uid);
        let actorDoc = await getDoc(actorDocRef);
        if (!actorDoc.exists()) {
          actorDocRef = doc(db, 'Retailers', user.uid);
          actorDoc = await getDoc(actorDocRef);
        }
        if (actorDoc.exists()) {
          setActorProfile({ uid: user.uid, ...actorDoc.data() } as User);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleCodeManagement = (formData: FormData) => {
    if (!actor) return;
    const quantityValue = Number(quantity);
    if (isNaN(quantityValue) || quantityValue <= 0) return;
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
        setRefreshKey(prev => prev + 1);
        setQuantity("");
      }
    });
  };

  if (pageLoading) return <div className="flex h-screen items-center justify-center"><LoaderCircle className="animate-spin" /></div>;

  if (!user) return <div className="p-8 text-center">Account not found.</div>;

  const isSelf = actor?.uid === user.uid;
  const isRetailer = user.role === 'Retailer';

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={user.name} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{isRetailer ? 'Retailer' : 'Dealer'} Profile</CardTitle>
              <CardDescription>{user.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-md bg-primary/10 p-3">
                <p className="text-sm font-medium">Key Balance</p>
                <p className="text-2xl font-bold">{user.key_balance ?? 0}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Shop Name</p>
                <p>{user.shopName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                <p>{user.mobileNumber}</p>
              </div>
               <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dealer Code</p>
                <p>{user.dealerCode}</p>
              </div>
            </CardContent>
            {!isSelf && (
              <CardFooter className="flex-col gap-2">
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>Permanent deletion of this account and all associated data.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => startDeleteTransition(() => deleteUserAction({ userId }))}>Continue</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
              </CardFooter>
            )}
          </Card>

          {!isSelf && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Transfer Keys</CardTitle>
                <CardDescription>Adjust the numeric key balance for this account.</CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleCodeManagement} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        id="quantity" 
                        type="number" 
                        placeholder="0" 
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" name="actionType" value="assign" disabled={codeActionPending}>
                        {codeActionPending ? <LoaderCircle className="animate-spin" /> : <ArrowDown className="mr-2 h-4 w-4" />}
                        Assign
                      </Button>
                      <Button type="submit" name="actionType" value="retrieve" variant="outline" disabled={codeActionPending}>
                        {codeActionPending ? <LoaderCircle className="animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
                        Retrieve
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Managed Entities Section */}
        <Card>
          <CardHeader>
            <CardTitle>{isRetailer ? 'Customers' : 'Managed Accounts'}</CardTitle>
            <CardDescription>
              {isRetailer ? `Accounts created by Retailer ${user.name}` : `Dealers and Retailers created by ${user.name}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile</TableHead>
                  {!isRetailer && <TableHead>Role</TableHead>}
                  {!isRetailer && <TableHead>Balance</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isRetailer ? (
                  managedCustomers.length > 0 ? managedCustomers.map(customer => (
                    <TableRow key={customer.uid}>
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell>{customer.mobileNumber}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">View Details</Button>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={3} className="text-center py-4">No customers found.</TableCell></TableRow>
                ) : (
                  managedDealers.length > 0 ? managedDealers.map(dealer => (
                    <TableRow key={dealer.uid}>
                      <TableCell className="font-medium">{dealer.name}</TableCell>
                      <TableCell>{dealer.mobileNumber}</TableCell>
                      <TableCell><Badge variant="outline">{dealer.role}</Badge></TableCell>
                      <TableCell>{dealer.key_balance ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/users/${dealer.uid}`}>View Dealer</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="text-center py-4">No managed accounts found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Transfer History */}
        <Card>
            <CardHeader>
                <CardTitle>Transfer Logs</CardTitle>
                <CardDescription>Audit log of all balance changes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Qty</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfers.map(t => (
                            <TableRow key={t.id}>
                                <TableCell><Badge variant={t.type === 'assigned' ? 'default' : 'secondary'}>{t.type}</Badge></TableCell>
                                <TableCell>{t.from}</TableCell>
                                <TableCell>{t.to}</TableCell>
                                <TableCell>{t.quantity}</TableCell>
                                <TableCell>{format(new Date(t.date), "MMM d, h:mm a")}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}
