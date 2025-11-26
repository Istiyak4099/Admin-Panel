
import { LoginHub } from '@/components/login-hub';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
         <h1 className="text-4xl font-bold tracking-tight">EMI Locker System</h1>
         <p className="text-muted-foreground">Select your panel to access the system</p>
      </div>
      <LoginHub />
    </div>
  );
}
