import { LoginForm } from '@/components/login-form';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
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
          <p className="mt-2 font-bold">Default Admin Credentials:</p>
          <p>Email: <code className="font-mono">admin@lockersystem.com</code></p>
          <p>Password: <code className="font-mono">admin123</code></p>
        </div>
      )}
    </div>
  );
}
