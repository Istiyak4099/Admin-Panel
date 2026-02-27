import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function setCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin') || ''
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map(o => o.trim())
  
  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true')
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}
