import { NextResponse } from 'next/server';

// Progress is handled client-side via localStorage.
// These routes are kept for API compatibility but are no-ops.
export async function GET() {
  return NextResponse.json([]);
}
