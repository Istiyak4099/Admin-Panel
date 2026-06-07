"use client";

import { useState, useEffect } from "react";
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { 
  ShieldAlert, 
  Users, 
  Briefcase, 
  Store, 
  UserCheck, 
  Smartphone, 
  CircleDollarSign,
  ClipboardList,
  CheckCircle2,
  LoaderCircle,
  KeyRound
} from "lucide-react";
import { getAuth, onAuthStateChanged, type User as AuthUser } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User, Customer } from "@/lib/types";

const auth = firebaseApp ? getAuth(firebaseApp) : null;
const db = firebaseApp ? getFirestore(firebaseApp) : null;

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    admins: 0,
    supers: 0,
    distributors: 0,
    retailers: 0,
    customers: 0,
    todayDevices: 0,
    todayLoans: 0,
    activeLoans: 0,
    closedLoans: 0,
    myBalance: 0
  });

  useEffect(() => {
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    const fetchData = async (authUser: AuthUser) => {
      try {
        // 1. Get current user's balance
        let myDocRef = doc(db, 'Dealers', authUser.uid);
        let myDoc = await getDoc(myDocRef);
        if (!myDoc.exists()) {
          myDocRef = doc(db, 'Retailers', authUser.uid);
          myDoc = await getDoc(myDocRef);
        }
        const myData = myDoc.data() as User;

        // 2. Fetch all counts
        const dealersSnap = await getDocs(collection(db, "Dealers"));
        const retailersSnap = await getDocs(collection(db, "Retailers"));
        const customersSnap = await getDocs(collection(db, "Customers"));

        const dealers = dealersSnap.docs.map(d => d.data() as User);
        const retailers = retailersSnap.docs.map(d => d.data() as User);
        const customers = customersSnap.docs.map(d => d.data() as Customer);

        // Date calculations for "Today"
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const todayCustomers = customers.filter(c => {
          if (!c.createdAt) return false;
          const createdDate = c.createdAt instanceof Timestamp ? c.createdAt.toDate() : new Date(c.createdAt);
          return createdDate >= startOfToday;
        });

        setCounts({
          admins: dealers.filter(d => d.role === 'Admin').length,
          supers: dealers.filter(d => d.role === 'Super Distributor').length,
          distributors: dealers.filter(d => d.role === 'Distributor').length,
          retailers: retailers.length,
          customers: customers.length,
          todayDevices: todayCustomers.length,
          todayLoans: todayCustomers.length, 
          activeLoans: customers.filter(c => c.status !== 'removed').length,
          closedLoans: customers.filter(c => c.status === 'removed').length,
          myBalance: myData?.key_balance ?? 0
        });
      } catch (error) {
        console.error("Error fetching counts:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchData(user);
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const cardItems = [
    { title: "Admins", count: counts.admins, icon: ShieldAlert, href: "/dashboard/admins", color: "text-red-500" },
    { title: "Super Distributors", count: counts.supers, icon: Users, href: "/dashboard/super-distributors", color: "text-blue-500" },
    { title: "Distributors", count: counts.distributors, icon: Briefcase, href: "/dashboard/distributors", color: "text-indigo-500" },
    { title: "Retailers", count: counts.retailers, icon: Store, href: "/dashboard/retailers", color: "text-green-500" },
    { title: "Customers", count: counts.customers, icon: UserCheck, href: "/dashboard/customers", color: "text-orange-500" },
    { title: "Key Balance", count: counts.myBalance, icon: KeyRound, href: "/dashboard/profile", color: "text-yellow-600" },
  ];

  const loanStats = [
    { title: "Today Activated Devices", count: counts.todayDevices, icon: Smartphone, color: "text-purple-500", href: "/dashboard/customers" },
    { title: "Today Activated Loans", count: counts.todayLoans, icon: CircleDollarSign, color: "text-pink-500", href: "/dashboard/customers" },
    { title: "Active Loans", count: counts.activeLoans, icon: ClipboardList, color: "text-emerald-500", href: "/dashboard/customers" },
    { title: "Closed Loans", count: counts.closedLoans, icon: CheckCircle2, color: "text-slate-500", href: "/dashboard/customers" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="System Dashboard" />
      <main className="flex-1 space-y-8 p-4 pt-6 md:p-8">
        {/* Management Cards */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Management Overview</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cardItems.map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="transition-all hover:shadow-md hover:bg-muted/50 cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <LoaderCircle className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold">{item.count}</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Loan & Device Stats */}
        <div>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Real-time Loan Tracking</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loanStats.map((item) => (
              <Link key={item.title} href={item.href}>
                <Card className="transition-all hover:shadow-md hover:bg-muted/50 cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                    <item.icon className={`h-5 w-5 ${item.color}`} />
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <LoaderCircle className="h-6 w-6 animate-spin" />
                    ) : (
                      <div className="text-2xl font-bold">{item.count}</div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
