
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, LoaderCircle } from "lucide-react";
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { Customer } from "@/lib/types";
import { ManagementFilters } from "@/components/management-filters";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function CustomersPage() {
  const [users, setUsers] = useState<Customer[]>([]);
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
        const snap = await getDocs(collection(db, "Customers"));
        const customerList = snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as Customer));
        setUsers(customerList);

        const creatorIds = Array.from(new Set(customerList.map(u => u.created_by_uid).filter(Boolean)));
        const creatorMap: Record<string, string> = {};
        for (const id of creatorIds) {
          if (!id) continue;
          const d = await getDoc(doc(db, "Retailers", id!));
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
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) || 
                          u.mobile_number.includes(search);
    const matchesStatus = status === 'all' || u.status === status;
    
    let createdDate: Date | null = null;
    if (u.createdAt) {
      createdDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    }
    
    const matchesFrom = !fromDate || (createdDate && createdDate >= new Date(fromDate));
    const matchesTo = !toDate || (createdDate && createdDate <= new Date(toDate));
    
    return matchesSearch && matchesStatus && matchesFrom && matchesTo;
  });

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Customers" />
      <main className="flex-1 p-4 md:p-8 space-y-4">
        <Card>
          <CardHeader>
            <ManagementFilters 
              onSearchChange={setSearch}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
              onStatusChange={setStatus}
              statusOptions={[
                { label: 'All', value: 'all' },
                { label: 'Unlocked', value: 'unlocked' },
                { label: 'Locked', value: 'locked' },
                { label: 'Removed', value: 'removed' },
              ]}
            />
          </CardHeader>
          <CardContent>
            {loading ? <LoaderCircle className="mx-auto h-8 w-8 animate-spin" /> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? filteredUsers.map(u => (
                    <TableRow key={u.uid}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{creators[u.created_by_uid] || 'System'}</TableCell>
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
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No customers found.</TableCell>
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
