import { deleteUser } from '@/ai/flows/delete-user';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await deleteUser({ userId });
    
    if (result.success) {
      return NextResponse.json({ success: true, message: result.message });
    } else {
      return NextResponse.json({ error: result.message || 'An unknown error occurred in the deletion flow.' }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Error in /api/delete-user:', error);
    return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
  }
}
