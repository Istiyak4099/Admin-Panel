'use client';

import { useState, useEffect, useTransition } from 'react';
import { Bell, LoaderCircle, CheckCircle2, XCircle, Check, X } from 'lucide-react';
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
import { fulfillKeyRequestAction, rejectKeyRequestAction } from '@/app/users/actions';
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
import { Textarea } from "@/components/ui/textarea";

const db = firebaseApp ? getFirestore(firebaseApp) : null;
const auth = firebaseApp ? getAuth(firebaseApp) : null;

export function NotificationsDropdown() {
  const [requests, setRequests] = useState<KeyRequest[]>([]);
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<KeyRequest | null>(null);
  const [rejectingRequest, setRejectingRequest] = useState<KeyRequest | null>(null);
  const [fulfillQty, setFulfillQty] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
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

  const handleReject = () => {
    if (!rejectingRequest) return;
    if (!rejectionReason.trim()) {
        toast({ variant: "destructive", title: "Missing Reason", description: "Please provide a reason for rejection." });
        return;
    }

    startTransition(async () => {
        const res = await rejectKeyRequestAction(rejectingRequest.uid, rejectionReason);
        if (res.error) {
            toast({ variant: "destructive", title: "Failed", description: res.error });
        } else {
            toast({ title: "Request Rejected" });
            setRejectingRequest(null);
            setRejectionReason('');
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
              <div
                key={req.uid}
                className="flex flex-col gap-2 p-3 hover:bg-accent/50 rounded-sm"
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-semibold">{req.requesterName}</span>
                  <Badge variant="outline">{req.quantity} Keys</Badge>
                </div>
                <div className="flex items-center gap-2">
                    <Button 
                        size="sm" 
                        className="flex-1 h-8 text-xs gap-1"
                        onClick={() => {
                            setSelectedRequest(req);
                            setFulfillQty(req.quantity.toString());
                        }}
                    >
                        <Check className="h-3 w-3" />
                        Accept
                    </Button>
                    <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 h-8 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => {
                            setRejectingRequest(req);
                        }}
                    >
                        <X className="h-3 w-3" />
                        Reject
                    </Button>
                </div>
              </div>
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

      <Dialog open={!!rejectingRequest} onOpenChange={(open) => !open && setRejectingRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Key Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting the request from {rejectingRequest?.requesterName}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
             <Label htmlFor="reason">Reason</Label>
             <Textarea 
                id="reason" 
                placeholder="Insufficient keys / Need more information..."
                value={rejectionReason} 
                onChange={(e) => setRejectionReason(e.target.value)} 
             />
          </div>
          <DialogFooter>
            <Button variant="destructive" onClick={handleReject} disabled={isPending}>
                {isPending ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                Reject Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
