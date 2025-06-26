export type LockerStatus = "available" | "occupied" | "maintenance";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type UserRole = "Admin" | "Super Distributor" | "Distributor" | "Retailer";
export type UserStatus = "active" | "inactive";

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
  mobile_number: string;
  password?: string; // Hashed password, should not be sent to client
  role: UserRole;
  createdAt: string;
  lockerId: string | null;
  parentId: string | null; // ID of the creating user
  status: UserStatus;
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
