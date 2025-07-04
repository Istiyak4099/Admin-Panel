import { CredentialsLoginForm } from "@/components/credentials-login-form";

export const dynamic = 'force-dynamic';

export default function CredentialsLoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <CredentialsLoginForm />
        </div>
    );
}
