import { LoginHub } from '@/components/login-hub';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="mb-8 text-center">
         <h1 className="text-4xl font-bold tracking-tight text-primary">LockerAdmin Pro</h1>
         <p className="text-muted-foreground">Please select your login method</p>
      </div>
      <LoginHub />
       {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-4 left-4 rounded-md border bg-muted p-3 text-xs text-muted-foreground shadow-lg">
          <p className="font-bold">Firebase Studio Diagnostic:</p>
          <p>
            App is trying to connect to Project ID:{' '}
            <code className="font-mono text-foreground">
              {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
                'NOT SET! Please check your .env file.'}
            </code>
          </p>
        </div>
      )}
    </div>
  );
}
