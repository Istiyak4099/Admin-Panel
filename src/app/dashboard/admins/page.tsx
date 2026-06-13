"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Plus, ChevronRight } from "lucide-react";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from "@/lib/types";
import { ManagementFilters } from "@/components/management-filters";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

export default function AdminsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Record<string, string>>({});

  // Filters state
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!db || !auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (!authUser) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Only show admins created by the currently logged in user
        const q = query(
          collection(db, "Dealers"), 
          where("role", "==", "Admin"),
          where("createdByUid", "==", authUser.uid)
        );
        
        const snap = await getDocs(q);
        const userList = snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        setUsers(userList);

        // Fetch creator names (in this specific case, they will likely all be the current user)
        const creatorIds = Array.from(new Set(userList.map(u => u.createdByUid).filter(Boolean)));
        const creatorMap: Record<string, string> = {};
        for (const id of creatorIds) {
          if (!id) continue;
          const d = await getDoc(doc(db, "Dealers", id!));
          if (d.exists()) {
            creatorMap[id!] = d.data().name;
          }
        }
        setCreators(creatorMap);
      } catch (error) {
        console.error("Error fetching admins:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const filteredUsers = users.filter(u => {
    const name = u.name || "";
    const mobileNumber = u.mobileNumber || "";

    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          mobileNumber.includes(search);
    const matchesStatus = status === 'all' || u.status === status;
    
    let createdDate: Date | null = null;
    if (u.createdAt) {
      createdDate = new Date(u.createdAt);
    }
    
    const matchesFrom = !fromDate || (createdDate && createdDate >= new Date(fromDate));
    const matchesTo = !toDate || (createdDate && createdDate <= new Date(toDate));
    
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="System Administrators">
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
            {loading ? <div className="flex justify-center py-8"><LoaderCircle className="h-8 w-8 animate-spin" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{creators[u.createdByUid!] || 'System'}</TableCell>
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Admin accounts found created by you.</TableCell>
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
