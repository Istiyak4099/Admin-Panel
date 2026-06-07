
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { LoaderCircle, User, Phone, MapPin, Mail, Smartphone, Receipt, CalendarDays } from "lucide-react";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { Customer, EmiDetail } from "@/lib/types";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";

const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function CustomerProfilePage() {
  const params = useParams();
  const customerId = params.customerId as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [creatorName, setCreatorName] = useState<string>("System");
  const [emiRecords, setEmiRecords] = useState<EmiDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!customerId || !db) return;

    const fetchCustomerData = async () => {
      setLoading(true);
      try {
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
            last_location_update: data.last_location_update,
            createdAt: data.createdAt
          };
          setCustomer(customerData);

          // Fetch creator (Retailer)
          if (data.created_by_uid) {
            const rDoc = await getDoc(doc(db, "Retailers", data.created_by_uid));
            if (rDoc.exists()) {
              setCreatorName(rDoc.data().name);
            }
          }

          const emiQuery = query(
            collection(db, "EmiDetails"),
            where("customerId", "==", customerId)
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Personal Details
              </CardTitle>
              <CardDescription>Primary account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Created By</Label>
                <p className="font-semibold text-primary">{creatorName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Full Name</Label>
                <p className="font-bold text-lg">{customer.full_name}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Mobile Number</Label>
                <p className="flex items-center gap-1 font-medium text-base">
                  <Phone className="h-3 w-3" />
                  {customer.mobile_number}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Email Address</Label>
                <p className="flex items-center gap-1 font-medium text-sm break-all">
                  <Mail className="h-3 w-3 shrink-0" />
                  {customer.email_address}
                </p>
              </div>
              <div className="pt-2">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge variant={customer.status === 'unlocked' ? 'default' : 'destructive'} className="capitalize">
                      {customer.status}
                  </Badge>
                </div>
              </div>
              <Separator className="my-4" />
              <div className="space-y-1">
                <Label className="text-xs uppercase font-semibold text-muted-foreground">Address</Label>
                <p className="flex items-start gap-1 font-medium text-sm">
                  <MapPin className="mt-1 h-3 w-3 shrink-0" />
                  {customer.address}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                EMI & Loan Overview
              </CardTitle>
              <CardDescription>Linked finance and device details</CardDescription>
            </CardHeader>
            <CardContent>
              {emiRecords.length > 0 ? (
                <div className="space-y-8">
                  {emiRecords.map((record, index) => (
                    <div key={record.uid} className="space-y-6">
                      {index > 0 && <Separator className="my-6" />}
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="flex items-center gap-1 text-xs uppercase font-semibold text-muted-foreground">
                            <Smartphone className="h-3 w-3" />
                            Product Name
                          </Label>
                          <p className="text-lg font-bold">{record.product_name}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase font-semibold text-muted-foreground">Unit Price</Label>
                          <p className="text-lg font-bold">${record.price}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase font-semibold text-muted-foreground">Down Payment</Label>
                          <p className="text-lg font-bold text-green-600">${record.down_payment}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase font-semibold text-muted-foreground">Monthly Installment</Label>
                          <p className="text-lg font-bold text-primary">${record.emi_monthly_amount}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase font-semibold text-muted-foreground">Total EMI Amount</Label>
                          <p className="text-lg font-bold">${record.total_emi}</p>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs uppercase font-semibold text-muted-foreground">EMI Count</Label>
                          <p className="text-lg font-bold">{record.number_of_emi} Months</p>
                        </div>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 bg-muted/30 p-4 rounded-lg border border-dashed">
                        <div className="space-y-1">
                           <Label className="text-xs uppercase font-semibold text-muted-foreground">Processing Fee</Label>
                           <p className="font-medium">${record.processing_fee}</p>
                        </div>
                        <div className="space-y-1">
                           <Label className="flex items-center gap-1 text-xs uppercase font-semibold text-muted-foreground">
                              <CalendarDays className="h-3 w-3" />
                              Created Date
                           </Label>
                           <p className="font-medium text-sm">
                             {record.created_time ? format(record.created_time.toDate(), "PPP") : "N/A"}
                           </p>
                        </div>
                        <div className="space-y-1">
                           <Label className="text-xs uppercase font-semibold text-muted-foreground">Android ID</Label>
                           <p className="font-mono text-[10px] break-all">{customer.android_id || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground/20 mb-4" />
                  <p className="text-muted-foreground font-medium">No EMI records found for this customer.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
