export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

const SYSTEM_USER_ID = process.env.MCP_SYSTEM_USER_ID ?? 'mcp-system';

// GET /api/mcp/documents — 帳票一覧
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const result = await tools.listDocuments({
      documentType: sp.get('documentType') as 'estimate' | 'invoice' | undefined ?? undefined,
      status: sp.get('status') ?? undefined,
      clientName: sp.get('clientName') ?? undefined,
      fromDate: sp.get('fromDate') ?? undefined,
      toDate: sp.get('toDate') ?? undefined,
      limit: sp.get('limit') ? Number(sp.get('limit')) : undefined,
      cursor: sp.get('cursor') ?? undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// POST /api/mcp/documents — 帳票作成
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { documentType, ...rest } = body;
    const result = documentType === 'invoice'
      ? await tools.createInvoice(rest, rest.createdBy ?? SYSTEM_USER_ID)
      : await tools.createEstimate(rest, rest.createdBy ?? SYSTEM_USER_ID);
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
