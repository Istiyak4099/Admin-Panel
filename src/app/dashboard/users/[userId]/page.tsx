
"use client";

import { useParams } from "next/navigation";
import { users, codeTransfers } from "@/lib/data";
import { DashboardHeader } from "@/components/dashboard-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, ArrowUp } from "lucide-react";
import type { User, CodeTransfer } from "@/lib/types";

// Mocking the logged-in user. In a real app, this would come from an auth context.
const MOCK_LOGGED_IN_USER_ID = "USR-004";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const user = users.find((u) => u.uid === userId);
  const managedByThisUser = users.filter(u => u.createdByUid === userId);
  const transfersForThisUser = codeTransfers.filter(t => t.to === user?.name || t.from === user?.name);

  if (!user) {
    return (
      <div className="flex flex-1 flex-col">
        <DashboardHeader title="User Not Found" />
        <main className="flex-1 p-4 pt-6 md:p-8">
          <p>The requested user could not be found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title={user.name} />
      <main className="flex-1 space-y-6 p-4 pt-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Profile Card */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>User Profile</CardTitle>
              <CardDescription>{user.role}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Shop Name</p>
                <p>{user.shopName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{user.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                <p>{user.mobileNumber}</p>
              </div>
               <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Address</p>
                <p>{user.address}</p>
              </div>
               <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Dealer Code</p>
                <p>{user.dealerCode}</p>
              </div>
            </CardContent>
            <CardFooter>
                 <Button variant="outline">Reset Password</Button>
            </CardFooter>
          </Card>

           {/* Code Management Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Code Management</CardTitle>
              <CardDescription>Assign or retrieve codes from this user.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 rounded-md border p-4">
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Current Code Balance
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total codes this user currently holds.
                    </p>
                  </div>
                  <p className="text-2xl font-bold">{user.codeBalance}</p>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="code-quantity">Quantity</Label>
                  <div className="flex gap-2">
                    <Input id="code-quantity" type="number" placeholder="e.g., 100" />
                    <Button><ArrowDown className="mr-2 h-4 w-4" /> Assign</Button>
                    <Button variant="outline"><ArrowUp className="mr-2 h-4 w-4" /> Retrieve</Button>
                  </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Transfer History */}
        <Card>
            <CardHeader>
                <CardTitle>Code Transfer History</CardTitle>
                <CardDescription>Log of all code assignments and retrievals for this user.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>From</TableHead>
                            <TableHead>To</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Date</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {transfersForThisUser.map((transfer: CodeTransfer) => (
                             <TableRow key={transfer.id}>
                                <TableCell>
                                    <Badge variant={transfer.type === 'assigned' ? 'default' : 'secondary'} className="capitalize">{transfer.type}</Badge>
                                </TableCell>
                                <TableCell>{transfer.from}</TableCell>
                                <TableCell>{transfer.to}</TableCell>
                                <TableCell>{transfer.quantity}</TableCell>
                                <TableCell>{transfer.date}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>

        {/* Managed Users (if any) */}
        {managedByThisUser.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Managed Users</CardTitle>
                    <CardDescription>Users created and managed by {user.name}.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Shop Name</TableHead>
                                <TableHead>Code Balance</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {managedByThisUser.map((managedUser: User) => (
                                <TableRow key={managedUser.uid}>
                                    <TableCell>{managedUser.name}</TableCell>
                                    <TableCell><Badge variant="outline">{managedUser.role}</Badge></TableCell>
                                    <TableCell>{managedUser.shopName}</TableCell>
                                    <TableCell>{managedUser.codeBalance}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        )}
      </main>
    </div>
  );
}
