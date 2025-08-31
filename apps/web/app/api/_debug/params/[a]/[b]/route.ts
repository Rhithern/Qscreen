import { NextRequest, NextResponse } from 'next/server'

// Debug route to verify param typing works correctly
export async function GET(
  request: NextRequest,
  { params }: { params: { a: string; b: string } }
) {
  // Params should be directly accessible without await
  const { a, b } = params;
  
  return NextResponse.json({
    message: 'Param typing verification successful',
    params: { a, b },
    types: {
      a: typeof a,
      b: typeof b,
      params: typeof params
    }
  });
}
