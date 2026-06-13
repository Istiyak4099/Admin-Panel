
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Bell, LoaderCircle, CheckCircle2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { firebaseApp } from '@/lib/firebase-client';
import { getFirestore, collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { fulfillKeyRequestAction } from '@/app/users/actions';
import { useToast } from '@/hooks/use-toast';
import type { KeyRequest } from '@/lib/types';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function NotificationsDropdown() {
  const [requests, setRequests] = useState<KeyRequest[]>([]);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<KeyRequest | null>(null);
  const [fulfillQty, setFulfillQty] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth || !db) return;
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserUid(user.uid);
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    if (!db || !currentUserUid) return;

    const q = query(collection(db, "KeyRequests"), where("status", "==", "pending"));
    const unsub = onSnapshot(q, async (snap) => {
      const allPending = snap.docs.map(d => ({ ...d.data(), uid: d.id } as KeyRequest));
      
      // Filter for requests from retailers created by this manager
      const filtered: KeyRequest[] = [];
      for (const req of allPending) {
        let rDoc = await getDoc(doc(db, "Dealers", req.retailerUid));
        if (!rDoc.exists()) rDoc = await getDoc(doc(db, "Retailers", req.retailerUid));
        
        if (rDoc.exists() && rDoc.data().createdByUid === currentUserUid) {
          filtered.push({ ...req, requesterName: rDoc.data().name });
        }
      }
      setRequests(filtered);
    });

    return unsub;
  }, [currentUserUid]);

  const handleFulfill = () => {
    if (!selectedRequest || !currentUserUid) return;
    const qty = parseInt(fulfillQty);
    if (isNaN(qty) || qty <= 0) return;

    startTransition(async () => {
      const res = await fulfillKeyRequestAction(
        selectedRequest.uid,
        currentUserUid,
        selectedRequest.retailerUid,
        qty
      );

      if (res.error) {
        toast({ variant: "destructive", title: "Failed", description: res.error });
      } else {
        toast({ title: "Success", description: res.success });
        setSelectedRequest(null);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {requests.length > 0 && (
              <Badge className="absolute -right-1 -top-1 h-4 w-4 justify-center p-0 text-[10px]" variant="destructive">
                {requests.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end">
          <DropdownMenuLabel>Key Requests</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {requests.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">No pending requests</div>
          ) : (
            requests.map((req) => (
              <DropdownMenuItem
                key={req.uid}
                className="flex flex-col items-start gap-1 p-3"
                onSelect={() => {
                    setSelectedRequest(req);
                    setFulfillQty(req.quantity.toString());
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold">{req.requesterName}</span>
                  <Badge variant="outline">{req.quantity} Keys</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Click to assign keys</p>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Keys to {selectedRequest?.requesterName}</DialogTitle>
            <DialogDescription>
              Adjust the amount and click "Send Keys" to update the balance.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
             <Label htmlFor="qty">Quantity</Label>
             <Input 
                id="qty" 
                type="number" 
                value={fulfillQty} 
                onChange={(e) => setFulfillQty(e.target.value)} 
                className="mt-2"
             />
          </div>
          <DialogFooter>
            <Button onClick={handleFulfill} disabled={isPending}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                Send Keys
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
