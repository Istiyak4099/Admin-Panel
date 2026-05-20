"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
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
import { Label } from "@/components/ui/label";
import { LoaderCircle, User, Phone, MapPin, Mail, Calendar, Info } from "lucide-react";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { Customer, EmiDetail } from "@/lib/types";
import { format } from "date-fns";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [emiRecords, setEmiRecords] = useState<EmiDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId || !db) return;

    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        // 1. Fetch Customer basic info using field names from screenshot
        const customerDoc = await getDoc(doc(db, "Customers", customerId));
        if (customerDoc.exists()) {
          const data = customerDoc.data();
          const customerData: Customer = {
            uid: customerDoc.id,
            full_name: data.full_name || "Unknown",
            mobile_number: data.mobile_number || "N/A",
            email_address: data.email_address || "N/A",
            address: data.address || "N/A",
            created_by_uid: data.created_by_uid || "",
            status: data.status || "N/A",
            android_id: data.android_id,
            latitude: data.latitude,
            longitude: data.longitude,
            last_location_update: data.last_location_update
          };
          setCustomer(customerData);

          // 2. Fetch EMI records linked by mobile number
          const emiQuery = query(
            collection(db, "EmiDetails"),
            where("customerMobile", "==", customerData.mobile_number)
          );
          const emiSnap = await getDocs(emiQuery);
          setEmiRecords(emiSnap.docs.map(doc => ({ ...doc.data(), uid: doc.id } as EmiDetail)));
        }
      } catch (error) {
        console.error("Error fetching customer profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-1 flex-col p-8 text-center">
        <h2 className="text-xl font-semibold">Customer Not Found</h2>
        <p className="text-muted-foreground">The requested customer record does not exist.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={`Customer: ${customer.full_name}`} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Customer Details
              </CardTitle>
              <CardDescription>Personal and device information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Full Name</Label>
                  <p className="font-medium">{customer.full_name}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Mobile Number</Label>
                  <p className="flex items-center gap-1 font-medium">
                    <Phone className="h-3 w-3" />
                    {customer.mobile_number}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Email Address</Label>
                  <p className="flex items-center gap-1 font-medium">
                    <Mail className="h-3 w-3" />
                    {customer.email_address}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Device Status</Label>
                  <div>
                    <Badge variant={customer.status === 'unlocked' ? 'default' : 'destructive'} className="capitalize">
                        {customer.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-1 border-t pt-4">
                <Label className="text-xs uppercase text-muted-foreground">Address</Label>
                <p className="flex items-start gap-1 font-medium">
                  <MapPin className="mt-1 h-3 w-3 shrink-0" />
                  {customer.address}
                </p>
              </div>
              <div className="space-y-1 border-t pt-4">
                <Label className="text-xs uppercase text-muted-foreground">Android ID</Label>
                <p className="font-mono text-sm">{customer.android_id || "N/A"}</p>
              </div>
            </CardContent>
          </Card>

          {/* EMI Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                EMI Overview
              </CardTitle>
              <CardDescription>Overview of active and historical records</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm text-muted-foreground">Total Records</p>
                        <p className="text-3xl font-bold">{emiRecords.length}</p>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <Badge variant={emiRecords.some(r => r.status !== 'paid') ? 'secondary' : 'default'} className="mt-1">
                            {emiRecords.some(r => r.status !== 'paid') ? 'Active EMI' : 'All Settled'}
                        </Badge>
                    </div>
                </div>
                {customer.last_location_update && (
                   <div className="mt-6 space-y-2 border-t pt-4">
                      <Label className="text-xs uppercase text-muted-foreground">Last Location Update</Label>
                      <p className="text-sm">{format(customer.last_location_update.toDate(), "PPP p")}</p>
                      <p className="text-xs text-muted-foreground">
                        Coords: {customer.latitude?.toFixed(4)}, {customer.longitude?.toFixed(4)}
                      </p>
                   </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* EMI Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>EMI Transaction History</CardTitle>
            <CardDescription>All EMI records associated with this customer's mobile number.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Record ID</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emiRecords.length > 0 ? emiRecords.map((emi) => (
                  <TableRow key={emi.uid}>
                    <TableCell className="font-mono text-xs">{emi.uid.substring(0, 8)}...</TableCell>
                    <TableCell className="font-semibold">${emi.totalAmount}</TableCell>
                    <TableCell className="text-green-600">${emi.paidAmount}</TableCell>
                    <TableCell className="text-destructive font-medium">
                      ${emi.totalAmount - emi.paidAmount}
                    </TableCell>
                    <TableCell>
                      <Badge variant={emi.status === 'paid' ? 'default' : 'secondary'} className="capitalize">
                        {emi.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {emi.createdAt ? format(new Date(emi.createdAt), "MMM d, yyyy") : 'N/A'}
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center py-8 text-muted-foreground">
                      No EMI records found for this customer.
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
