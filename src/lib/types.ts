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
  uid: string;
  name: string;
  email: string;
  mobileNumber: string;
  hashedPassword?: string;
  role: UserRole;
  createdAt: string;
  lockerId: string | null;
  createdByUid: string | null;
  status: UserStatus;
  address: string;
  shopName: string;
  dealerCode: string;
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
  id:string;
  code: string;
  assignedTo: string;
  status: "generated" | "transferred" | "returned";
  lastActivity: string;
};
