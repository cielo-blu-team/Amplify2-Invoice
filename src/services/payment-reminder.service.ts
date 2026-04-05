/**
 * 支払催促通知サービス
 *
 * 支払期日に基づく5段階の通知:
 * - pre_due:     支払期日1日前（リマインド）
 * - overdue:     期限超過（即時催促）
 * - overdue_3d:  3日超過
 * - overdue_7d:  7日超過
 * - overdue_14d: 14日超過
 *
 * 重複送信防止: reminderLogs コレクションで管理
 */

import { randomUUID } from 'crypto';
import type { DocumentHeader } from '@/types';
import type { ReminderType, PaymentReminderLog } from '@/types';
import { getFirestoreClient } from '@/repositories/_firestore-client';
import { COLLECTIONS } from '@/lib/constants';
import * as reminderLogRepo from '@/repositories/reminder-log.repository';
import * as settingsRepo from '@/repositories/system-settings.repository';
import { notificationService } from './notification.service';

// ── 型定義 ────────────────────────────────────────────────────────────────────

interface ReminderCheckResult {
  checked: number;
  sent: number;
  skippedAlreadySent: number;
  details: Array<{
    documentNumber: string;
    reminderType: ReminderType;
    sent: boolean;
  }>;
}

interface ReminderCandidate {
  document: DocumentHeader;
  reminderType: ReminderType;
  daysOverdue: number;
  label: string;
}

// ── 通知判定 ─────────────────────────────────────────────────────────────────

function getReminderCandidates(
  doc: DocumentHeader,
  today: Date,
): ReminderCandidate[] {
  if (!doc.dueDate) return [];
  if (doc.status === 'paid' || doc.status === 'cancelled') return [];

  const dueDate = new Date(doc.dueDate + 'T00:00:00');
  const diffMs = today.getTime() - dueDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const candidates: ReminderCandidate[] = [];

  if (diffDays === -1) {
    candidates.push({
      document: doc,
      reminderType: 'pre_due',
      daysOverdue: -1,
      label: '明日が支払期日',
    });
  }

  if (diffDays >= 0) {
    candidates.push({
      document: doc,
      reminderType: 'overdue',
      daysOverdue: diffDays,
      label: diffDays === 0 ? '本日が支払期日（超過）' : `${diffDays}日超過`,
    });
  }

  if (diffDays >= 3) {
    candidates.push({
      document: doc,
      reminderType: 'overdue_3d',
      daysOverdue: diffDays,
      label: `${diffDays}日超過（3日超過通知）`,
    });
  }

  if (diffDays >= 7) {
    candidates.push({
      document: doc,
      reminderType: 'overdue_7d',
      daysOverdue: diffDays,
      label: `${diffDays}日超過（7日超過通知）`,
    });
  }

  if (diffDays >= 14) {
    candidates.push({
      document: doc,
      reminderType: 'overdue_14d',
      daysOverdue: diffDays,
      label: `${diffDays}日超過（14日超過通知）`,
    });
  }

  return candidates;
}

// ── Slack通知メッセージ構築 ──────────────────────────────────────────────────

function buildSlackMessage(candidate: ReminderCandidate): {
  text: string;
  blocks: Array<Record<string, unknown>>;
} {
  const { document: doc, reminderType, daysOverdue } = candidate;

  const isPreDue = reminderType === 'pre_due';
  const emoji = isPreDue ? '📋' : daysOverdue >= 14 ? '🔴' : daysOverdue >= 7 ? '🟠' : '⚠️';
  const title = isPreDue
    ? '明日が支払期日の請求書があります'
    : '支払期限を超過した請求書があります';

  const dueDateLabel = isPreDue
    ? `${doc.dueDate}（明日）`
    : `${doc.dueDate}（${daysOverdue}日超過）`;

  return {
    text: `${emoji} ${title}: ${doc.documentNumber}`,
    blocks: [
      {
        type: 'header',
        text: { type: 'plain_text', text: `${emoji} ${title}` },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*請求書番号:*\n${doc.documentNumber}` },
          { type: 'mrkdwn', text: `*取引先:*\n${doc.clientName}` },
          { type: 'mrkdwn', text: `*金額:*\n¥${doc.totalAmount.toLocaleString('ja-JP')}` },
          { type: 'mrkdwn', text: `*支払期日:*\n${dueDateLabel}` },
        ],
      },
      { type: 'divider' },
    ],
  };
}

// ── メイン処理 ───────────────────────────────────────────────────────────────

/**
 * 未払い請求書をチェックし、条件に該当するものにSlack通知を送信する
 */
export async function checkAndSendReminders(): Promise<ReminderCheckResult> {
  const settings = await settingsRepo.getSystemSettings();
  const channel = settings.slackReminderChannel;

  if (!channel) {
    console.warn('[PaymentReminder] Slack催促通知チャンネルが未設定です');
    return { checked: 0, sent: 0, skippedAlreadySent: 0, details: [] };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 未払い請求書を取得（sent, overdue ステータス）
  const db = getFirestoreClient();
  const unpaidStatuses = ['sent', 'overdue', 'confirmed', 'approved'];

  const invoices: DocumentHeader[] = [];
  for (const status of unpaidStatuses) {
    const snap = await db
      .collection(COLLECTIONS.DOCUMENTS)
      .where('isDeleted', '==', false)
      .where('documentType', '==', 'invoice')
      .where('status', '==', status)
      .get();
    for (const doc of snap.docs) {
      invoices.push({ ...doc.data(), documentId: doc.id } as DocumentHeader);
    }
  }

  const result: ReminderCheckResult = {
    checked: invoices.length,
    sent: 0,
    skippedAlreadySent: 0,
    details: [],
  };

  for (const invoice of invoices) {
    const candidates = getReminderCandidates(invoice, today);

    for (const candidate of candidates) {
      const alreadySent = await reminderLogRepo.hasReminderBeenSent(
        invoice.documentId,
        candidate.reminderType,
      );

      if (alreadySent) {
        result.skippedAlreadySent++;
        result.details.push({
          documentNumber: invoice.documentNumber,
          reminderType: candidate.reminderType,
          sent: false,
        });
        continue;
      }

      // Slack通知送信
      try {
        const message = buildSlackMessage(candidate);
        await notificationService.sendToChannel(channel, message.text, message.blocks);

        // ログ記録
        const log: PaymentReminderLog = {
          logId: randomUUID(),
          documentId: invoice.documentId,
          documentNumber: invoice.documentNumber,
          reminderType: candidate.reminderType,
          sentAt: new Date().toISOString(),
          slackChannel: channel,
        };
        await reminderLogRepo.createReminderLog(log);

        result.sent++;
        result.details.push({
          documentNumber: invoice.documentNumber,
          reminderType: candidate.reminderType,
          sent: true,
        });
      } catch (err) {
        console.error(
          `[PaymentReminder] 通知送信失敗: ${invoice.documentNumber} (${candidate.reminderType})`,
          err,
        );
      }
    }
  }

  return result;
}
