
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, UserPlus, ChevronRight } from "lucide-react";
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from "@/lib/types";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function AdminsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
      try {
        const q = query(collection(db, "Dealers"), where("role", "==", "Admin"));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="System Administrators">
        <Button asChild size="sm" className="gap-1">
          <Link href="/dashboard/create-account">
            <UserPlus className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Create Account
            </span>
          </Link>
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Accounts</CardTitle>
            <CardDescription>Full access accounts responsible for system-wide configuration.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? users.map(u => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.mobileNumber}</TableCell>
                      <TableCell>{u.key_balance ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/dashboard/users/${u.uid}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No Admin accounts found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
