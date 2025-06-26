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
import { devices } from "@/lib/data";

export default function DevicesPage() {
  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Device Tracking" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Device Status</CardTitle>
            <CardDescription>
              Track device code generation, transfers, and returns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device ID</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell className="font-medium">{device.id}</TableCell>
                    <TableCell>{device.code}</TableCell>
                    <TableCell>{device.assignedTo}</TableCell>
                    <TableCell>
                       <Badge variant={device.status === 'returned' ? 'outline' : 'default'} className="capitalize">{device.status}</Badge>
                    </TableCell>
                    <TableCell>{device.lastActivity}</TableCell>
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
