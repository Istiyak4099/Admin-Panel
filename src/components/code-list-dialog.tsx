'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { firebaseApp } from '@/lib/firebase-client';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import type { GeneratedCode } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';

const db = firebaseApp ? getFirestore(firebaseApp) : null;

interface CodeListDialogProps {
  userId: string;
  userName: string;
  children: React.ReactNode;
}

export function CodeListDialog({ userId, userName, children }: CodeListDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && db) {
      const fetchCodes = async () => {
        setIsLoading(true);
        try {
          // Querying without ordering to avoid composite index requirement.
          const codesQuery = query(collection(db, 'codes'), where('ownerUid', '==', userId));
          const querySnapshot = await getDocs(codesQuery);
          const codesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GeneratedCode));
          
          // Sorting on the client-side.
          codesList.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

          setCodes(codesList);
        } catch (error) {
          console.warn("Warning fetching codes:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCodes();
    }
  }, [isOpen, userId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Codes for {userName}</DialogTitle>
          <DialogDescription>
            List of all codes currently assigned to this user.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72 border rounded-md">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : codes.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id}>
                    <TableCell className="font-mono text-xs">{code.code}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={code.status === 'available' ? 'default' : 'secondary'} className="capitalize">{code.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-10">No codes found for this user.</p>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
