import type { Locker, User, Payment, Device, CodeTransfer } from "@/lib/types";

// All mock data has been removed to switch to live Firestore data.
// These arrays are now empty.

export const lockers: Locker[] = [];

export const users: User[] = [];

export const payments: Payment[] = [];

export const devices: Device[] = [];

export const paymentForecast: { name: string, forecast: number }[] = [];

export const codeTransfers: CodeTransfer[] = [];
