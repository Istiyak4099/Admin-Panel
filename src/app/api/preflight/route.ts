import { NextResponse } from 'next/server';

/**
 * This route is specifically created to handle preflight OPTIONS requests.
 * Modern browsers send an OPTIONS request before a "complex" cross-origin request
 * (like one with a Content-Type of application/json) to check if the server
 * understands the method and headers.
 * 
 * While Next.js can handle this via `next.config.js` headers, this file
 * provides an explicit catch-all for any preflight requests that might be
 * directed here. It simply acknowledges the request with a 200 OK.
 */
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}
