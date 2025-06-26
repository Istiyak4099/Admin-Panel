import type { Locker, User, Payment, Device } from "@/lib/types";

export const lockers: Locker[] = [
  { id: "LKR-001", location: "Sector A, Row 1", status: "occupied", userId: "USR-001", lastMaintenance: "2024-05-01" },
  { id: "LKR-002", location: "Sector A, Row 1", status: "available", userId: null, lastMaintenance: "2024-05-01" },
  { id: "LKR-003", location: "Sector A, Row 2", status: "maintenance", userId: null, lastMaintenance: "2024-07-15" },
  { id: "LKR-004", location: "Sector B, Row 1", status: "occupied", userId: "USR-002", lastMaintenance: "2024-06-10" },
  { id: "LKR-005", location: "Sector B, Row 1", status: "available", userId: null, lastMaintenance: "2024-06-10" },
  { id: "LKR-006", location: "Sector C, Row 3", status: "occupied", userId: "USR-003", lastMaintenance: "2024-07-01" },
];

export const users: User[] = [
  { id: "USR-001", name: "Alice Johnson", email: "alice@example.com", role: "Retailer", createdAt: "2024-01-15", lockerId: "LKR-001" },
  { id: "USR-002", name: "Bob Williams", email: "bob@example.com", role: "Distributor", createdAt: "2024-02-20", lockerId: "LKR-004" },
  { id: "USR-003", name: "Charlie Brown", email: "charlie@example.com", role: "Retailer", createdAt: "2024-03-10", lockerId: "LKR-006" },
  { id: "USR-004", name: "Diana Miller", email: "diana@example.com", role: "Admin", createdAt: "2023-12-01", lockerId: null },
  { id: "USR-005", name: "Ethan Davis", email: "ethan@example.com", role: "Super Distributor", createdAt: "2024-04-05", lockerId: null },
];

export const payments: Payment[] = [
  { id: "PAY-001", userId: "USR-001", lockerId: "LKR-001", amount: 25.00, date: "2024-07-01", status: "paid" },
  { id: "PAY-002", userId: "USR-002", lockerId: "LKR-004", amount: 25.00, date: "2024-07-05", status: "paid" },
  { id: "PAY-003", userId: "USR-003", lockerId: "LKR-006", amount: 25.00, date: "2024-07-10", status: "pending" },
  { id: "PAY-004", userId: "USR-001", lockerId: "LKR-001", amount: 25.00, date: "2024-06-01", status: "paid" },
  { id: "PAY-005", userId: "USR-002", lockerId: "LKR-004", amount: 25.00, date: "2024-05-05", status: "overdue" },
];

export const devices: Device[] = [
  { id: "DEV-001", code: "A7B3C9", assignedTo: "USR-001", status: "generated", lastActivity: "2024-07-10" },
  { id: "DEV-002", code: "D4E8F1", assignedTo: "USR-002", status: "transferred", lastActivity: "2024-07-05" },
  { id: "DEV-003", code: "G2H5I6", assignedTo: "USR-003", status: "generated", lastActivity: "2024-07-01" },
  { id: "DEV-004", code: "J9K2L3", assignedTo: "N/A", status: "returned", lastActivity: "2024-06-20" },
];

export const paymentForecast = [
    { name: 'Week 1', forecast: 4000 },
    { name: 'Week 2', forecast: 3000 },
    { name: 'Week 3', forecast: 2000 },
    { name: 'Week 4', forecast: 2780 },
];
