
export type LockerStatus = "available" | "occupied" | "maintenance";
export type PaymentStatus = "paid" | "pending" | "overdue";
export type UserRole = "Admin" | "Super Distributor" | "Distributor" | "Retailer";
export type UserStatus = "active" | "inactive" | "removed";

export type Locker = {
  id: string;
  location: string;
  status: LockerStatus;
  userId: string | null;
  lastMaintenance: string;
};

export type Customer = {
  uid: string;
  full_name: string;
  mobile_number: string;
  email_address: string;
  address: string;
  created_by_uid: string;
  status: string;
  android_id?: string;
  latitude?: number;
  longitude?: number;
  last_location_update?: any;
  createdAt?: any; // Firestore Timestamp
};

export type EmiDetail = {
  uid: string;
  customerId: string;
  product_name: string;
  price: number;
  down_payment: number;
  emi_monthly_amount: number;
  number_of_emi: number;
  processing_fee: number;
  total_emi: number;
  created_time: any; // Firestore Timestamp
  live_photo?: string | null;
  nid_front?: string | null;
  nid_back?: string | null;
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

export type KeyRequest = {
  uid: string;
  retailerUid: string;
  quantity: number;
  status: "pending" | "completed" | "rejected";
  timestamp: any;
  requesterName?: string;
};

export type User = {
  /** The unique identifier from Firebase Authentication. */
  uid: string;
  /** The full name of the dealer/user. */
  name: string;
  /** The user's email address. */
  email: string;
  /** The user's mobile phone number. */
  mobileNumber: string;
  /** The plain text password, stored for admin visibility. */
  password?: string;
  /** The hashed password for the user. */
  hashedPassword: string;
  /** The user's role in the system hierarchy. */
  role: UserRole;
  /** The date the user account was created. */
  createdAt: string;
  /** The ID of a locker assigned to the user, if any. */
  lockerId: string | null;
  /** The UID of the user who created this user. */
  createdByUid: string | null;
  /** The current status of the user's account. */
  status: UserStatus;
  /** The user's physical or mailing address. */
  address: string;
  /** The name of the user's shop or business. */
  shopName: string;
  /** A unique code assigned to a dealer. */
  dealerCode: string;
  /** The number of keys the user currently holds. */
  key_balance: number;
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

export interface AuthUser {
  userId: string
  mobileNumber: string
  iat: number
  exp: number
}
