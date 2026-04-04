import { NextResponse } from 'next/server';
import { handleSlackMessage, hasConversation } from '@/lib/slack-ai-handler';

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

  // bot_message は無視（無限ループ防止）
  if (event.subtype === 'bot_message' || event.bot_id) {
    return NextResponse.json({ ok: true });
  }

  const text: string = (event.text ?? '').replace(/<@[^>]+>\s*/g, '').trim();
  const channel: string = event.channel;
  const userId: string = event.user ?? 'unknown';
  // スレッド返信用: スレッド内のメッセージならそのスレッドへ、そうでなければ元メッセージへ
  const threadTs: string = event.thread_ts ?? event.ts;
  const isDm = event.channel_type === 'im';
  const conversationKey = isDm ? `dm:${userId}` : `thread:${channel}:${threadTs}`;

  // 処理対象の判定:
  // 1. メンション（app_mention）
  // 2. DM
  // 3. ボットが参加済みのスレッド内メッセージ（メンションなし可）
  const isMention = event.type === 'app_mention';
  const isThreadReply = event.type === 'message' && !!event.thread_ts && hasConversation(conversationKey);
  if (!isMention && !isDm && !isThreadReply) {
    return NextResponse.json({ ok: true });
  }

  // コマンドを非同期で処理（Slack の 3秒タイムアウトに引っかからないよう即レスポンス）
  handleConversation(text, channel, threadTs, conversationKey, event.ts).catch((e) =>
    console.error('[SlackBot] handleConversation error:', e),
  );

  return NextResponse.json({ ok: true });
}

async function handleConversation(
  text: string,
  channel: string,
  threadTs: string,
  conversationKey: string,
  messageTs: string,
): Promise<void> {
  if (!SLACK_BOT_TOKEN) {
    await postSlackMessage(channel, threadTs, 'SLACK_BOT_TOKEN が設定されていないため返信できません。');
    return;
  }

  // 処理中リアクションを付ける
  await addReaction(channel, messageTs, 'hourglass_flowing_sand');

  try {
    const reply = await handleSlackMessage(conversationKey, text);
    await postSlackMessage(channel, threadTs, reply);
  } catch (e) {
    console.error('[SlackBot] AI error:', e);
    await postSlackMessage(channel, threadTs, 'エラーが発生しました。しばらく待ってから再試行してください。');
  } finally {
    // 処理完了リアクションを解除
    await removeReaction(channel, messageTs, 'hourglass_flowing_sand');
  }
}

async function postSlackMessage(channel: string, threadTs: string, text: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, text, thread_ts: threadTs }),
  });
}

async function addReaction(channel: string, timestamp: string, name: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  await fetch('https://slack.com/api/reactions.add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, timestamp, name }),
  }).catch(() => {/* リアクション失敗は無視 */});
}

async function removeReaction(channel: string, timestamp: string, name: string): Promise<void> {
  if (!SLACK_BOT_TOKEN) return;
  await fetch('https://slack.com/api/reactions.remove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
    body: JSON.stringify({ channel, timestamp, name }),
  }).catch(() => {/* リアクション失敗は無視 */});
}
