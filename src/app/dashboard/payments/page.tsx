"use client"

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
import { payments, paymentForecast } from "@/lib/data";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import type { PaymentStatus } from "@/lib/types";

const statusVariant: Record<PaymentStatus, "default" | "secondary" | "destructive"> = {
  paid: "default",
  pending: "secondary",
  overdue: "destructive"
};

export default function PaymentsPage() {
  const chartConfig = {
    forecast: {
      label: 'Forecast',
      color: 'hsl(var(--primary))',
    },
  };

  return (
    <div className="flex flex-1 flex-col">
      <DashboardHeader title="Payment History & Status" />
      <main className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>30-Day Payment Forecast</CardTitle>
            <CardDescription>
              An estimate of revenue for the upcoming 30-day period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentForecast} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      formatter={(value) => `$${value.toLocaleString()}`}
                      indicator="dot"
                    />}
                  />
                  <Bar dataKey="forecast" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              A log of all payment transactions in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Locker ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.id}</TableCell>
                    <TableCell>{payment.userId}</TableCell>
                    <TableCell>{payment.lockerId}</TableCell>
                    <TableCell>${payment.amount.toFixed(2)}</TableCell>
                    <TableCell>{payment.date}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[payment.status]} className="capitalize">
                        {payment.status}
                      </Badge>
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
