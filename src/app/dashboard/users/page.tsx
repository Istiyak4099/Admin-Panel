"use client";

import { useState } from "react";
import Link from "next/link";
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
import { DashboardHeader } from "@/components/dashboard-header";
import { users } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { PlusCircle, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateUserForm } from "@/components/create-user-form";

// Mocking the logged-in user. In a real app, this would come from an auth context.
const MOCK_LOGGED_IN_USER_ID = "USR-004"; // This is the Admin User

export default function UsersPage() {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // Filter users to show only those created by the logged-in user.
  // For the Admin (USR-004), this will be Super Distributors.
  const managedUsers = users.filter(user => user.createdByUid === MOCK_LOGGED_IN_USER_ID);

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="User Accounts">
        <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create User
              </span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create a new user</DialogTitle>
              <DialogDescription>
                Fill out the form to add a new user to Firebase Auth and Firestore.
              </DialogDescription>
            </DialogHeader>
            <CreateUserForm onSuccess={() => setIsCreateUserOpen(false)} />
          </DialogContent>
        </Dialog>
      </DashboardHeader>
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              Viewing users directly under your management. Click a user to see their full profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden sm:table-cell">Shop Name</TableHead>
                  <TableHead className="hidden md:table-cell">Codes</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {managedUsers.map((user) => (
                  <TableRow key={user.uid} className="group hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <Link href={`/dashboard/users/${user.uid}`} className="block hover:underline">
                        {user.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                       <Link href={`/dashboard/users/${user.uid}`} className="block">
                         <Badge variant="outline">{user.role}</Badge>
                       </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Link href={`/dashboard/users/${user.uid}`} className="block">
                        {user.shopName}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Link href={`/dashboard/users/${user.uid}`} className="block">
                        {user.codeBalance}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/users/${user.uid}`}>
                          <ChevronRight className="h-4 w-4" />
                          <span className="sr-only">View User</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
             {managedUsers.length === 0 && (
              <div className="py-10 text-center text-muted-foreground">
                No users found under your management.
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
