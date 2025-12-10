import { run } from 'genkit';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result: any = await run('deleteUserFlow', { userId });
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      // The flow itself should throw, but handle cases where it might return an error message
      return NextResponse.json({ error: result.message || 'An unknown error occurred in the deletion flow.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in /api/delete-user:', error);
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}

    