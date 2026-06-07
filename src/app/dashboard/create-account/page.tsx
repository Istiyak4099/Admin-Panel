
"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/create-user-form";
import { useRouter } from "next/navigation";

export default function CreateAccountPage() {
  const router = useRouter();

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Create Dealer Account" />
      <main className="flex-1 p-4 md:p-8 flex justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Fill out the form below to create a new Admin, Super Distributor, Distributor, or Retailer account.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm onSuccess={() => router.push('/dashboard/users')} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
