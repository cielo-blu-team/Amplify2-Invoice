export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

// GET /api/mcp/clients
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await tools.listClients({
      name: sp.get('name') ?? undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      cursor: sp.get('cursor') ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/mcp/clients
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await tools.createClientTool(body);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
