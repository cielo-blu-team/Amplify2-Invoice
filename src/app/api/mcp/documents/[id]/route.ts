export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import * as tools from '@/lib/mcp-tools';
import * as documentService from '@/services/document.service';

type Context = { params: Promise<{ id: string }> };

// GET /api/mcp/documents/[id]
export async function GET(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const result = await tools.getDocument({ documentId: id });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 404 });
  }
}

// PUT /api/mcp/documents/[id]
export async function PUT(request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const result = await tools.updateDocument({ documentId: id, ...body });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

// DELETE /api/mcp/documents/[id]
export async function DELETE(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    await documentService.deleteDocument(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
