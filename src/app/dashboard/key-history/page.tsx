
"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { LoaderCircle, History, ArrowRightLeft, Search } from "lucide-react";
import { getFirestore, collection, query, orderBy, limit, onSnapshot, where, or, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import type { CodeTransfer } from "@/lib/types";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

export default function KeyHistoryPage() {
  const [transfers, setTransfers] = useState<CodeTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!auth || !db) return;
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserUid(user.uid);
        // Check if user is Admin
        const adminDocRef = doc(db, "Dealers", user.uid);
        const adminDoc = await getDoc(adminDocRef);
        if (adminDoc.exists() && adminDoc.data().role === "Admin") {
          setIsAdmin(true);
        }
      } else {
        setCurrentUserUid(null);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!db || !currentUserUid) return;

    setLoading(true);
    let q;
    
    // Admins see all history, others see only relevant history
    if (isAdmin) {
      q = query(
        collection(db, "KeyHistory"),
        orderBy("date", "desc"),
        limit(100)
      );
    } else {
      q = query(
        collection(db, "KeyHistory"),
        or(
          where("fromUid", "==", currentUserUid),
          where("toUid", "==", currentUserUid)
        ),
        orderBy("date", "desc"),
        limit(100)
      );
    }

    const unsub = onSnapshot(q, (snap) => {
      setTransfers(snap.docs.map(doc => ({ ...doc.data(), id: doc.id } as CodeTransfer)));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching key history:", error);
      setLoading(false);
    });

    return unsub;
  }, [currentUserUid, isAdmin]);

  const filteredTransfers = transfers.filter(t => 
    t.from.toLowerCase().includes(search.toLowerCase()) || 
    t.to.toLowerCase().includes(search.toLowerCase()) ||
    t.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Key Transaction History" />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Audit Logs
                </CardTitle>
                <CardDescription>
                  Detailed history of all key assignments and retrievals.
                </CardDescription>
              </div>
              <div className="relative w-full md:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by name or type..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <LoaderCircle className="h-10 w-10 animate-spin mb-4" />
                <p>Syncing transaction records...</p>
              </div>
            ) : filteredTransfers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From Account</TableHead>
                    <TableHead className="w-10 text-center"></TableHead>
                    <TableHead>To Account</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Date & Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30">
                      <TableCell>
                        <Badge 
                          variant={t.type === 'assigned' ? 'default' : 'secondary'} 
                          className="capitalize"
                        >
                          {t.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{t.from}</TableCell>
                      <TableCell className="text-center">
                        <ArrowRightLeft className="h-3 w-3 text-muted-foreground mx-auto" />
                      </TableCell>
                      <TableCell className="font-medium">{t.to}</TableCell>
                      <TableCell className="text-right font-bold text-primary">
                        {t.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-xs">
                        {format(new Date(t.date), "MMM d, yyyy · h:mm a")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-lg bg-muted/20">
                <History className="h-12 w-12 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold">No transactions found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  There are no key transfer records matching your current filters or permissions.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
