export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';

type Context = { params: Promise<{ id: string }> };

// POST /api/mcp/documents/[id]/convert
export async function POST(request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await tools.convertToInvoice(
      { documentId: id, dueDate: body.dueDate },
      body.createdBy ?? 'mcp-system',
    );
    return NextResponse.json(result, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
