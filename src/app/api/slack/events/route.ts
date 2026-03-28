import { NextResponse } from 'next/server';

// Slack Events API エンドポイント
// 本番実装: @slack/bolt を使用
export async function POST(request: Request) {
  const body = await request.json();

  // URL検証（Slack Events API セットアップ時）
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }

  // イベント処理
  if (body.type === 'event_callback') {
    const event = body.event;
    // TODO: Slackメッセージからのコマンド解析 → MCP呼び出し（3A-06）
    console.log('[SlackBot] Event received:', event.type);
  }

  return NextResponse.json({ ok: true });
}
