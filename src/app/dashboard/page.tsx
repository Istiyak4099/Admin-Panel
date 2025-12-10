
"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardHeader } from "@/components/dashboard-header";
import { KeyRound, Briefcase, Users, User, LoaderCircle } from "lucide-react";
import { getAuth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User as AppUser } from "@/lib/types";

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [dealersCount, setDealersCount] = useState(0);
  const [retailersCount, setRetailersCount] = useState(0);
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: AuthUser | null) => {
      if (user) {
        try {
          // Fetch current user's full profile
          const userDocRef = doc(db, 'Dealers', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userProfile = { uid: user.uid, ...userDoc.data() } as AppUser;
            setCurrentUser(userProfile);

            // Fetch users created by the current user
            const usersRef = collection(db, "Dealers");
            const q = query(usersRef, where("createdByUid", "==", user.uid));
            const querySnapshot = await getDocs(q);
            
            let dealers = 0;
            let retailers = 0;
            const managedUsersList = querySnapshot.docs.map(doc => {
              const userData = { ...doc.data(), uid: doc.id } as AppUser;
              if (userData.role === 'Retailer') {
                retailers++;
              } else {
                dealers++;
              }
              return userData;
            });

            setDealersCount(dealers);
            setRetailersCount(retailers);

            // Sort by creation date and get the 5 most recent
            managedUsersList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setRecentUsers(managedUsersList.slice(0, 5));

          } else {
             setCurrentUser(null);
          }
        } catch (error) {
            console.error("Error fetching dashboard data:", error);
            setCurrentUser(null);
        } finally {
            setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Link href="/dashboard/users">
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Dealers</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{dealersCount}</div>}
                <p className="text-xs text-muted-foreground">
                  Total accounts created
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/dashboard/users">
            <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{retailersCount}</div>}
                <p className="text-xs text-muted-foreground">Retailer accounts created</p>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Balance Keys</CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{currentUser?.codeBalance ?? 0}</div>}
              <p className="text-xs text-muted-foreground">
                Total codes you currently hold
              </p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Role</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <div className="text-2xl font-bold">{currentUser?.role ?? 'Guest'}</div>}
              <p className="text-xs text-muted-foreground">Your access level in the system</p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Recently Joined Users</CardTitle>
            <CardDescription>An overview of the newest members you've added.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined On</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                   <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : recentUsers.length > 0 ? (
                  recentUsers.map(user => (
                    <TableRow key={user.uid}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.mobileNumber}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      No recent users. Create a new user to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

    