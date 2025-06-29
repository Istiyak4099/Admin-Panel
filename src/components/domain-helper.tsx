'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export function DomainHelper() {
    const [domain, setDomain] = useState<string | null>(null);

    useEffect(() => {
        // This code runs only on the client, so `window` is available.
        setDomain(window.location.hostname);
    }, []);

    // Don't show the helper if we can't determine the domain or if it's localhost (which is often authorized by default).
    if (!domain || domain === 'localhost') {
        return null;
    }
    
    return (
        <Card className="mt-8 bg-amber-500/10 border-amber-500/50 dark:bg-yellow-900/20 dark:border-yellow-500/30">
            <CardHeader className="flex-row items-center gap-4 space-y-0">
                 <AlertTriangle className="w-6 h-6 text-amber-500" />
                <div className='flex-1'>
                    <CardTitle className="text-base text-amber-700 dark:text-amber-400">Developer Tip</CardTitle>
                    <CardDescription>
                       For Google Sign-In to work, you must authorize this domain in your Firebase project.
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm">
                   Go to <span className="font-semibold">Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains</span> and add the following value:
                </p>
                <div className="mt-2 flex items-center rounded-md bg-muted px-3 py-2">
                    <pre className="text-sm font-mono text-muted-foreground select-all">{domain}</pre>
                </div>
            </CardContent>
        </Card>
    );
}
