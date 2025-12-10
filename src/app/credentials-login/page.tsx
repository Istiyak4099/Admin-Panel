
import { CredentialsLoginForm } from "@/components/credentials-login-form";

export default function CredentialsLoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="mb-8 text-center">
         <h1 className="text-4xl font-bold tracking-tight">EMI Locker System</h1>
         <p className="text-muted-foreground">Enter your credentials to sign in</p>
      </div>
      <CredentialsLoginForm />
    </div>
  );
}
