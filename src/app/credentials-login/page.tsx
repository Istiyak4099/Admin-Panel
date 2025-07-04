import { CredentialsLoginForm } from "@/components/credentials-login-form";
import { Suspense } from 'react';
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function CredentialsLoginSkeleton() {
    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-4 w-48 mt-1" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </CardContent>
        </Card>
    )
}

export default function CredentialsLoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <Suspense fallback={<CredentialsLoginSkeleton />}>
                <CredentialsLoginForm />
            </Suspense>
        </div>
    );
}
