"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, LoaderCircle, Plus } from "lucide-react";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from "@/lib/types";
import { ManagementFilters } from "@/components/management-filters";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function RetailersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [supers, setSupers] = useState<{ label: string; value: string }[]>([]);
  const [distributors, setDistributors] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Record<string, string>>({});
  const [distributorMap, setDistributorMap] = useState<Record<string, string>>({}); // Maps Distributor UID to Super Distributor UID

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedSuper, setSelectedSuper] = useState("all");
  const [selectedDistributor, setSelectedDistributor] = useState("all");

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
      try {
        const snap = await getDocs(collection(db, "Retailers"));
        const userList = snap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as User));
        setUsers(userList);

        const creatorIds = Array.from(new Set(userList.map(u => u.createdByUid).filter(Boolean)));
        const creatorMap: Record<string, string> = {};
        for (const id of creatorIds) {
          if (!id) continue;
          const d = await getDoc(doc(db, "Dealers", id!));
          if (d.exists()) {
            const data = d.data();
            creatorMap[id!] = data.name;
          }
        }
        setCreators(creatorMap);

        // Fetch Supers
        const superSnap = await getDocs(query(collection(db, "Dealers"), where("role", "==", "Super Distributor")));
        setSupers(superSnap.docs.map(d => ({ label: d.data().name, value: d.id })));

        // Fetch Distributors
        const distSnap = await getDocs(query(collection(db, "Dealers"), where("role", "==", "Distributor")));
        const dists = distSnap.docs.map(d => ({ 
          label: d.data().name, 
          value: d.id, 
          createdByUid: d.data().createdByUid 
        }));
        setDistributors(dists);
        
        const dMap: Record<string, string> = {};
        dists.forEach(d => { if (d.createdByUid) dMap[d.value] = d.createdByUid; });
        setDistributorMap(dMap);

      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredUsers = users.filter(u => {
    const name = u.name || "";
    const mobileNumber = u.mobileNumber || "";

    const matchesSearch = name.toLowerCase().includes(search.toLowerCase()) || 
                          mobileNumber.includes(search);
    const matchesStatus = status === 'all' || u.status === status;
    const matchesDistributor = selectedDistributor === 'all' || u.createdByUid === selectedDistributor;
    const matchesSuper = selectedSuper === 'all' || distributorMap[u.createdByUid!] === selectedSuper;
    
    const createdDate = new Date(u.createdAt);
    const matchesFrom = !fromDate || createdDate >= new Date(fromDate);
    const matchesTo = !toDate || createdDate <= new Date(toDate);
    
    return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesDistributor && matchesSuper;
  });

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Retailers">
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
              hierarchyFilters={[
                {
                  label: "Select Super Distributor",
                  placeholder: "All Supers",
                  options: supers,
                  value: selectedSuper,
                  onChange: setSelectedSuper
                },
                {
                  label: "Select Distributor",
                  placeholder: "All Distributors",
                  options: distributors.filter(d => selectedSuper === 'all' || d.createdByUid === selectedSuper),
                  value: selectedDistributor,
                  onChange: setSelectedDistributor
                }
              ]}
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
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Retailers found.</TableCell>
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
