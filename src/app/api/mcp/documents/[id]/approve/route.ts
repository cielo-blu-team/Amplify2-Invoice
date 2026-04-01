export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

type Context = { params: Promise<{ id: string }> };

// POST /api/mcp/documents/[id]/approve
export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await tools.approveDoc(
      { documentId: id, action: body.action, comment: body.comment },
      body.approverId ?? 'mcp-system',
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
