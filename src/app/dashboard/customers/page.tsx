"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, LoaderCircle, Plus } from "lucide-react";
import { getFirestore, collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { Customer } from "@/lib/types";
import { ManagementFilters } from "@/components/management-filters";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function CustomersPage() {
  const [users, setUsers] = useState<Customer[]>([]);
  const [supers, setSupers] = useState<{ label: string; value: string }[]>([]);
  const [distributors, setDistributors] = useState<{ label: string; value: string; parentId: string }[]>([]);
  const [retailers, setRetailers] = useState<{ label: string; value: string; parentId: string }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [creators, setCreators] = useState<Record<string, string>>({});
  
  // Hierarchy mapping for multi-level filtering
  const [accountHierarchy, setAccountHierarchy] = useState<Record<string, { distributorId: string; superId: string }>>({});

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState("all");
  
  const [selectedSuper, setSelectedSuper] = useState("all");
  const [selectedDistributor, setSelectedDistributor] = useState("all");
  const [selectedRetailer, setSelectedRetailer] = useState("all");

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

        // Fetch hierarchy data
        const superSnap = await getDocs(query(collection(db, "Dealers"), where("role", "==", "Super Distributor")));
        setSupers(superSnap.docs.map(d => ({ label: d.data().name, value: d.id })));

        const distSnap = await getDocs(query(collection(db, "Dealers"), where("role", "==", "Distributor")));
        const dists = distSnap.docs.map(d => ({ label: d.data().name, value: d.id, parentId: d.data().createdByUid }));
        setDistributors(dists);

        const retailSnap = await getDocs(collection(db, "Retailers"));
        const retails = retailSnap.docs.map(d => ({ label: d.data().name, value: d.id, parentId: d.data().createdByUid }));
        setRetailers(retails);

        // Build hierarchy map for fast filtering
        const hierarchy: Record<string, { distributorId: string; superId: string }> = {};
        retails.forEach(r => {
          const dist = dists.find(d => d.value === r.parentId);
          hierarchy[r.value] = {
            distributorId: r.parentId,
            superId: dist?.parentId || ''
          };
        });
        setAccountHierarchy(hierarchy);

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
    
    // Hierarchy filters
    const matchesRetailer = selectedRetailer === 'all' || u.created_by_uid === selectedRetailer;
    const h = accountHierarchy[u.created_by_uid] || { distributorId: '', superId: '' };
    const matchesDistributor = selectedDistributor === 'all' || h.distributorId === selectedDistributor;
    const matchesSuper = selectedSuper === 'all' || h.superId === selectedSuper;

    let createdDate: Date | null = null;
    if (u.createdAt) {
      createdDate = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
    }
    
    const matchesFrom = !fromDate || (createdDate && createdDate >= new Date(fromDate));
    const matchesTo = !toDate || (createdDate && createdDate <= new Date(toDate));
    
    return matchesSearch && matchesStatus && matchesFrom && matchesTo && matchesRetailer && matchesDistributor && matchesSuper;
  });

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Customers">
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
              statusOptions={[
                { label: 'All', value: 'all' },
                { label: 'Unlocked', value: 'unlocked' },
                { label: 'Locked', value: 'locked' },
                { label: 'Removed', value: 'removed' },
              ]}
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
                  options: distributors.filter(d => selectedSuper === 'all' || d.parentId === selectedSuper),
                  value: selectedDistributor,
                  onChange: setSelectedDistributor
                },
                {
                  label: "Select Retailer",
                  placeholder: "All Retailers",
                  options: retailers.filter(r => selectedDistributor === 'all' || r.parentId === selectedDistributor),
                  value: selectedRetailer,
                  onChange: setSelectedRetailer
                }
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
                            View Details
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found.</TableCell>
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
