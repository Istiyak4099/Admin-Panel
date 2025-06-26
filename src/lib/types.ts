export type LockerStatus = "available" | "occupied" | "maintenance";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type UserRole = "Admin" | "Super Distributor" | "Distributor" | "Retailer";

export type Locker = {
  id: string;
  location: string;
  status: LockerStatus;
  userId: string | null;
  lastMaintenance: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
  lockerId: string | null;
};

export type Payment = {
  id: string;
  userId: string;
  lockerId: string;
  amount: number;
  date: string;
  status: PaymentStatus;
};

export type Device = {
  id: string;
  code: string;
  assignedTo: string;
  status: "generated" | "transferred" | "returned";
  lastActivity: string;
};
