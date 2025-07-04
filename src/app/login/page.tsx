import { LoginHub } from '@/components/login-hub';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
         <h1 className="text-4xl font-bold tracking-tight">EMI Locker System</h1>
         <p className="text-muted-foreground">Select your panel to access the system</p>
      </div>
      <LoginHub />
       <div className="mt-8 max-w-4xl text-left text-sm text-muted-foreground">
        <h3 className="font-semibold text-foreground mb-2">Access Information:</h3>
        <p><span className="font-medium text-foreground">Admin:</span> Full system control, user creation, settings management</p>
        <p><span className="font-medium text-foreground">Super:</span> Manage distributors, code allocation, regional oversight</p>
        <p><span className="font-medium text-foreground">Distributor:</span> Manage retailers, device tracking, sales reports</p>
      </div>
    </div>
  );
}
