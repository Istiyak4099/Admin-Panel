import { CredentialsLoginForm } from "@/components/auth-components";
import { Suspense } from "react";

function CredentialsLoginContent() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <CredentialsLoginForm />
        </div>
    );
}

// Wrap the component in Suspense because useSearchParams() opts the page into dynamic rendering.
export default function CredentialsLoginPage() {
    return (
        <Suspense>
            <CredentialsLoginContent />
        </Suspense>
    );
}
