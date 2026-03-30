import { NextResponse } from 'next/server';
import { parseSlackMessage, invokeMcpTool } from '@/lib/slack-mcp-bridge';

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN ?? '';

// Slack Events API エンドポイント
export async function POST(request: Request) {
  const body = await request.json();

  // URL検証（Slack Events API セットアップ時）
  if (body.type === 'url_verification') {
    return NextResponse.json({ challenge: body.challenge });
  }

  if (body.type !== 'event_callback') {
    return NextResponse.json({ ok: true });
  }

  const event = body.event;

  // メンション or DM のみ処理（bot_message は無視して無限ループを防ぐ）
  if (
    event.type !== 'app_mention' &&
    !(event.type === 'message' && event.channel_type === 'im')
  ) {
    return NextResponse.json({ ok: true });
  }
  if (event.subtype === 'bot_message' || event.bot_id) {
    return NextResponse.json({ ok: true });
  }

  const text: string = (event.text ?? '').replace(/<@[^>]+>\s*/g, '').trim();
  const channel: string = event.channel;

  // コマンドを非同期で処理（Slack の 3秒タイムアウトに引っかからないよう即レスポンス）
  handleCommand(text, channel, SLACK_BOT_TOKEN).catch((e) =>
    console.error('[SlackBot] handleCommand error:', e),
  );

  return NextResponse.json({ ok: true });
}

async function handleCommand(text: string, channel: string, token: string): Promise<void> {
  const parsed = parseSlackMessage(text);

  if (!parsed) {
    await postSlackMessage(channel, token, '認識できないコマンドです。`ヘルプ` と送信すると使い方を確認できます。');
    return;
  }

  // ヘルプはそのまま返す
  if (parsed.tool === 'help') {
    await postSlackMessage(channel, token, parsed.replyHint ?? 'ヘルプ');
    return;
  }

  if (!token) {
    await postSlackMessage(channel, token, 'SLACK_BOT_TOKEN が設定されていないため返信できません。');
    return;
  }

  try {
    const result = await invokeMcpTool(parsed.tool, parsed.args, token);
    const reply = formatMcpResult(parsed.tool, result);
    await postSlackMessage(channel, token, reply);
  } catch (e) {
    console.error('[SlackBot] MCP error:', e);
    await postSlackMessage(channel, token, 'ツール呼び出しに失敗しました。しばらく待ってから再試行してください。');
  }
}

function formatMcpResult(tool: string, result: unknown): string {
  if (typeof result === 'string') return result;
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    if (r.error) return `エラー: ${r.error}`;
    if (r.documentNumber) return `✅ 完了: ${r.documentNumber}`;
    if (Array.isArray(r.items)) {
      const items = r.items as Array<Record<string, unknown>>;
      if (items.length === 0) return '該当する帳票はありません。';
      return items
        .slice(0, 10)
        .map((d) => `• ${d.documentNumber ?? d.documentId} (${d.status ?? ''}) ${d.clientName ?? ''}`)
        .join('\n');
    }
  }
  return `ツール \`${tool}\` を実行しました。`;
}

async function postSlackMessage(channel: string, token: string, text: string): Promise<void> {
  if (!token) return;
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, text }),
  });
}
