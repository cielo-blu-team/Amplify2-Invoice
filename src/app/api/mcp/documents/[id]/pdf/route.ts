export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generatePdfAction } from '@/actions/pdf';

type Context = { params: Promise<{ id: string }> };

// POST /api/mcp/documents/[id]/pdf
export async function POST(_request: NextRequest, context: Context) {
  const { id } = await context.params;
  try {
    const result = await generatePdfAction(id);
    if (!result.success) {
      return NextResponse.json({ error: result.error?.message }, { status: 500 });
    }
    return NextResponse.json({ pdfUrl: result.data!.pdfUrl });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
