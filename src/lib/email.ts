/**
 * メール送信ユーティリティ（Resend）
 *
 * 必要な環境変数:
 *   RESEND_API_KEY  - Resend の API キー（https://resend.com）
 *   APP_URL         - アプリの URL（例: https://courage-invoice-xxx.run.app）
 *   EMAIL_FROM      - 送信元メールアドレス（例: noreply@example.com）
 */

const APP_URL = process.env.APP_URL ?? 'https://courage-invoice-uy4whq3gaa-an.a.run.app';
const EMAIL_FROM = process.env.EMAIL_FROM ?? 'noreply@courage-invoice.app';

export function getInvitationUrl(invitationId: string): string {
  return `${APP_URL}/invite/${invitationId}`;
}

export async function sendInvitationEmail(params: {
  to: string;
  invitationId: string;
  inviterName: string;
  role: string;
  expiresAt: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY が未設定のため送信をスキップしました');
    return { ok: false, error: 'RESEND_API_KEY が設定されていません' };
  }

  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const inviteUrl = getInvitationUrl(params.invitationId);
  const expiryDate = new Date(params.expiresAt).toLocaleDateString('ja-JP');
  const roleLabel = params.role === 'admin' ? '管理者' : params.role === 'accountant' ? '経理担当' : '一般ユーザー';

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: `【Courage Invoice】${params.inviterName} さんから招待が届いています`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<body style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color: #1a56db;">Courage Invoice への招待</h2>
  <p>${params.inviterName} さんから Courage Invoice に招待されました。</p>
  <table style="margin: 16px 0; border-collapse: collapse;">
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">権限</td><td>${roleLabel}</td></tr>
    <tr><td style="padding: 4px 12px 4px 0; color: #666;">有効期限</td><td>${expiryDate}</td></tr>
  </table>
  <p>
    <a href="${inviteUrl}"
       style="display: inline-block; background: #1a56db; color: white; padding: 12px 24px;
              border-radius: 6px; text-decoration: none; font-weight: bold;">
      招待を承認してアカウントを作成する
    </a>
  </p>
  <p style="color: #888; font-size: 12px;">
    上記ボタンが機能しない場合は、以下の URL をブラウザで開いてください。<br>
    <a href="${inviteUrl}" style="color: #1a56db;">${inviteUrl}</a>
  </p>
  <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">
  <p style="color: #aaa; font-size: 11px;">このメールに心当たりがない場合は無視してください。</p>
</body>
</html>`,
  });

  if (error) {
    console.error('[email] 送信エラー:', error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
