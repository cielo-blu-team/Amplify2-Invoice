export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

// POST /api/mcp/payments/check
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { invoiceId } = body;
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 });
    }
    // 入金照合はスタブ（実装時に paymentService.matchPayments と連携）
    return NextResponse.json({
      invoiceId,
      status: 'unmatched',
      message: '入金照合機能は未実装です。',
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
