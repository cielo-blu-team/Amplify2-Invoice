import { NextResponse } from 'next/server';
import { handleSlackMessage } from '@/lib/slack-ai-handler';

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
  const userId: string = event.user ?? 'unknown';

  // DM はユーザーごと、チャンネルメンションはチャンネルごとに会話を管理
  const conversationKey = event.channel_type === 'im' ? `dm:${userId}` : `ch:${channel}`;

  // コマンドを非同期で処理（Slack の 3秒タイムアウトに引っかからないよう即レスポンス）
  handleConversation(text, channel, conversationKey).catch((e) =>
    console.error('[SlackBot] handleConversation error:', e),
  );

  return NextResponse.json({ ok: true });
}

async function handleConversation(
  text: string,
  channel: string,
  conversationKey: string,
): Promise<void> {
  if (!SLACK_BOT_TOKEN) {
    await postSlackMessage(channel, 'SLACK_BOT_TOKEN が設定されていないため返信できません。');
    return;
  }

  try {
    const reply = await handleSlackMessage(conversationKey, text);
    await postSlackMessage(channel, reply);
  } catch (e) {
    console.error('[SlackBot] AI error:', e);
    await postSlackMessage(channel, 'エラーが発生しました。しばらく待ってから再試行してください。');
  }
}

async function postSlackMessage(channel: string, text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, text }),
  });
}
