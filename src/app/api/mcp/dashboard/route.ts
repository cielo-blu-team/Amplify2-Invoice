export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

// GET /api/mcp/dashboard
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await tools.getDashboard({
      fromDate: sp.get('fromDate') ?? undefined,
      toDate: sp.get('toDate') ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
