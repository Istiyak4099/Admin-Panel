export type LockerStatus = "available" | "occupied" | "maintenance";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type UserRole = "Admin" | "Super" | "Distributor" | "Retailer";
export type UserStatus = "active" | "inactive";

export type Locker = {
  id: string;
  location: string;
  status: LockerStatus;
  userId: string | null;
  lastMaintenance: string;
};

export type GeneratedCode = {
  id: string; // The document ID
  code: string; // The unique code string
  ownerUid: string; // The UID of the user who currently owns/holds the code
  generatedByUid: string; // The UID of the admin who generated the code
  generatedAt: string; // ISO date string
  status: 'available' | 'used'; // 'available' for transfer, 'used' when activated in a device
};

export type CodeTransfer = {
  id: string;
  from: string; // From User's name
  to: string; // To User's name
  fromUid: string; // From User's UID
  toUid: string; // To User's UID
  quantity: number;
  date: string;
  type: "assigned" | "retrieved";
};

export type User = {
  /** The unique identifier from Firebase Authentication. */
  uid: string;
  /** The full name of the user. */
  name: string;
  /** The user's email address. */
  email: string;
  /** The user's mobile phone number. */
  mobileNumber: string;
  /** The plain text password, stored for admin visibility. */
  password?: string;
  /** The hashed password for the user (only stored for non-Admin roles). */
  hashedPassword: string;
  /** The user's role in the system hierarchy. */
  role: UserRole;
  /** The date the user account was created. */
  createdAt: string;
  /** The ID of a locker assigned to the user, if any. */
  lockerId: string | null;
  /** The UID of the user who created this user, establishing the hierarchy. Null for Admin. */
  createdByUid: string | null;
  /** The current status of the user's account. */
  status: UserStatus;
  /** The user's physical or mailing address. */
  address: string;
  /** The name of the user's shop or business. */
  shopName: string;
  /** A unique code assigned to a dealer. */
  dealerCode: string;
  /** The number of codes the user currently holds. */
  codeBalance: number;
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
