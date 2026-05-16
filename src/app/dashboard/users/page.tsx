"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { DashboardHeader } from "@/components/dashboard-header";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight, LoaderCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateUserForm } from "@/components/create-user-form";
import { getAuth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from "@/lib/types";

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function UsersPage() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [managedUsers, setManagedUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    };
    const unsubscribe = onAuthStateChanged(auth, user => {
      setCurrentUser(user);
      if (!user) {
        setLoading(false);
        setManagedUsers([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser || !db) {
        if (!currentUser) setLoading(false);
        return;
    };

    const fetchManagedUsers = async () => {
      setLoading(true);
      try {
        // Fetch from BOTH collections
        const dealersRef = collection(db, "Dealers");
        const retailersRef = collection(db, "Retailers");
        
        const dq = query(dealersRef, where("createdByUid", "==", currentUser.uid));
        const rq = query(retailersRef, where("createdByUid", "==", currentUser.uid));
        
        const [dealersSnap, retailersSnap] = await Promise.all([
          getDocs(dq),
          getDocs(rq)
        ]);

        const dealersList = dealersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        const retailersList = retailersSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        
        setManagedUsers([...dealersList, ...retailersList]);
      } catch (error) {
        console.error("Error fetching managed users: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManagedUsers();
  }, [currentUser]);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="User Accounts">
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create User
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a new user</DialogTitle>
              <DialogDescription>
                Add a new Dealer or Retailer account.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onSuccess={() => {
              setIsCreateUserOpen(false);
              if (auth?.currentUser) {
                setCurrentUser(auth?.currentUser);
              }
            }} />
          </DialogContent>
        </Dialog>
      </DashboardHeader>
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Users you have created (Dealers & Retailers).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Shop Name</TableHead>
                  <TableHead className="hidden md:table-cell">Keys</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <LoaderCircle className="mx-auto h-6 w-6 animate-spin" />
                    </TableCell>
                  </TableRow>
                ) : managedUsers.length > 0 ? (
                  managedUsers.map((user) => (
                    <TableRow key={user.uid} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/users/${user.uid}`} className="block hover:underline">
                          {user.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/users/${user.uid}`} className="block">
                          <Badge variant="outline">{user.role}</Badge>
                        </Link>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Link href={`/dashboard/users/${user.uid}`} className="block">
                          {user.shopName}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Link href={`/dashboard/users/${user.uid}`} className="block">
                          {user.key_balance ?? 0}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/dashboard/users/${user.uid}`}>
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">View User</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      {currentUser ? "No users found under your management." : "Log in to see managed users."}
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
