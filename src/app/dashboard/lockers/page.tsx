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
import { lockers } from "@/lib/data";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { LockerStatus } from "@/lib/types";

const statusVariant: Record<LockerStatus, "default" | "secondary" | "destructive"> = {
  occupied: "secondary",
  available: "default",
  maintenance: "destructive"
}


export default function LockersPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Locker Management" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Locker Overview</CardTitle>
            <CardDescription>
              View and manage individual lockers, including status and details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Locker ID</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned User</TableHead>
                  <TableHead>Last Maintenance</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lockers.map((locker) => (
                  <TableRow key={locker.id}>
                    <TableCell className="font-medium">{locker.id}</TableCell>
                    <TableCell>{locker.location}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[locker.status]} className="capitalize">
                        {locker.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{locker.userId || "N/A"}</TableCell>
                    <TableCell>{locker.lastMaintenance}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Set Maintenance</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
