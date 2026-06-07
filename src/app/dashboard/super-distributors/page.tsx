
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, LoaderCircle, Plus } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from "@/lib/types";
import { ManagementFilters } from "@/components/management-filters";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function SuperDistributorsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
      try {
        const q = query(collection(db, "Dealers"), where("role", "==", "Super Distributor"));
        const snap = await getDocs(q);
        const userList = snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        setUsers(userList);

        const creatorIds = Array.from(new Set(userList.map(u => u.createdByUid).filter(Boolean)));
        const creatorMap: Record<string, string> = {};
        for (const id of creatorIds) {
          if (!id) continue;
          const d = await getDoc(doc(db, "Dealers", id!));
          if (d.exists()) creatorMap[id!] = d.data().name;
        }
        setCreators(creatorMap);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase()) || 
                          u.mobileNumber.includes(search);
    const matchesStatus = status === 'all' || u.status === status;
    const createdDate = new Date(u.createdAt);
    const matchesFrom = !fromDate || createdDate >= new Date(fromDate);
    const matchesTo = !toDate || createdDate <= new Date(toDate);
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Super Distributors">
        <Button asChild size="sm" className="gap-1">
          <Link href="/dashboard/create-account">
            <Plus className="h-4 w-4" />
            <span>Add New</span>
          </Link>
        </Button>
      </DashboardHeader>
      <main className="flex-1 p-4 md:p-8 space-y-4">
        <Card>
          <CardHeader>
            <ManagementFilters 
              onSearchChange={setSearch}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onStatusChange={setStatus}
            />
          </CardHeader>
          <CardContent>
            {loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Shop Name</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{creators[u.createdByUid!] || 'System'}</TableCell>
                      <TableCell>{u.shopName}</TableCell>
                      <TableCell>{u.key_balance ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/dashboard/users/${u.uid}`}><ChevronRight className="h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No Super Distributors found.</TableCell>
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
