
import { type NextRequest, NextResponse } from 'next/server';
import { loginFlow } from '@/ai/flows/login-flow';

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, password } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 });
    }

    const result = await loginFlow({ mobileNumber, password });

    if (result.error) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ customToken: result.customToken });

  } catch (error) {
    console.error('Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
