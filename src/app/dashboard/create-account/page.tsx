"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateUserForm } from "@/components/create-user-form";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/types";

export default function CreateAccountPage() {
  const router = useRouter();

  const handleSuccess = (role: UserRole) => {
    switch (role) {
      case "Admin":
        router.push("/dashboard/admins");
        break;
      case "Super Distributor":
        router.push("/dashboard/super-distributors");
        break;
      case "Distributor":
        router.push("/dashboard/distributors");
        break;
      case "Retailer":
        router.push("/dashboard/retailers");
        break;
      default:
        router.push("/dashboard/users");
    }
  };

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
            <CreateUserForm onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}