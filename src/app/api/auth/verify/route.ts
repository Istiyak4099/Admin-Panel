import { NextResponse, type NextRequest } from "next/server";
import * as jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // 1. If no token provided
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    // 4. If valid
    return NextResponse.json({ valid: true, user: decoded }, { status: 200 });

  } catch (error) {
    // 5. If invalid or expired, jwt.verify throws an error
    return NextResponse.json(
      { valid: false, error: "Invalid or expired token" },
      { status: 401 }
    );
  }
}
