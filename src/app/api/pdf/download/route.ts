export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserId } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  // 認証チェック
  try {
    await getCurrentUserId();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return NextResponse.json({ error: 'key is required' }, { status: 400 });
  }

  // パストラバーサル防止
  if (key.includes('..') || key.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
  }

  try {
    // ビルド時評価を避けるため動的インポート
    const { storage, BUCKET_NAME } = await import('@/lib/storage-gcs');
    const [buffer] = await storage.bucket(BUCKET_NAME!).file(key).download();
    const filename = key.split('/').pop() ?? 'document.pdf';

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('PDF download error:', error);
    return NextResponse.json({ error: 'PDF not found' }, { status: 404 });
  }
}
