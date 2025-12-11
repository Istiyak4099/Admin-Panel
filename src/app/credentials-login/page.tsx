
import { CredentialsLoginForm } from "@/components/credentials-login-form";
import React, { Suspense } from "react";
import { LoaderCircle } from "lucide-react";

function LoginPageLoading() {
    return (
        <div className="flex flex-col items-center gap-4">
            <LoaderCircle className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading Login Form...</p>
        </div>
    )
}

export default function CredentialsLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-8 text-center">
         <h1 className="text-4xl font-bold tracking-tight">EMI Locker System</h1>
         <p className="text-muted-foreground">Enter your credentials to sign in</p>
      </div>
      <Suspense fallback={<LoginPageLoading />}>
        <CredentialsLoginForm />
      </Suspense>
    </div>
  );
}

