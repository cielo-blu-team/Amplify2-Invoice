export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

type Context = { params: Promise<{ id: string }> };

// POST /api/mcp/documents/[id]/status
export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await tools.updateStatus(
      { documentId: id, newStatus: body.newStatus, comment: body.comment },
      body.updatedBy ?? 'mcp-system',
    );
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
