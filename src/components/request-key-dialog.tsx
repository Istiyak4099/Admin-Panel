
'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { LoaderCircle } from 'lucide-react';
import { requestKeysAction } from '@/app/users/actions';

interface RequestKeyDialogProps {
  uid: string;
  children: React.ReactNode;
}

export function RequestKeyDialog({ uid, children }: RequestKeyDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState('10');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleRequest = () => {
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    startTransition(async () => {
      const res = await requestKeysAction(uid, qty);
      if (res.error) {
        toast({ variant: "destructive", title: "Request Failed", description: res.error });
      } else {
        toast({ title: "Success", description: res.success });
        setIsOpen(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Keys</DialogTitle>
          <DialogDescription>
            Submit a request for additional keys to your manager.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity</Label>
            <Input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleRequest} disabled={isPending}>
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Submit Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
