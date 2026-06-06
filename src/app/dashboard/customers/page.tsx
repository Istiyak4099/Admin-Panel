
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, LoaderCircle } from "lucide-react";
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { Customer } from "@/lib/types";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function CustomersPage() {
  const [users, setUsers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "Customers"));
        setUsers(snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Customer)));
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Customers" />
      <main className="flex-1 p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Customer Management</CardTitle>
            <CardDescription>View all end-users and device lock statuses.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(u => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell>{u.mobile_number}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === 'unlocked' ? 'default' : 'destructive'}>
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/dashboard/customers/${u.uid}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
