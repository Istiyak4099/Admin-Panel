'use client';
import { Suspense } from 'react';
import { CredentialsLoginForm } from "@/components/credentials-login-form";
import { Skeleton } from "@/components/ui/skeleton";

function CredentialsLoginFormSkeleton() {
    return (
        <div className="w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6">
                 <Skeleton className="h-7 w-24" />
                 <Skeleton className="h-4 w-72 mt-2" />
            </div>
            <div className="p-6 pt-0">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
}

// This wrapper is important for Suspense to work correctly with client components.
function CredentialsLogin() {
    return <CredentialsLoginForm />
}

export default function CredentialsLoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Suspense fallback={<CredentialsLoginFormSkeleton />}>
                <CredentialsLogin />
            </Suspense>
        </div>
    );
}
