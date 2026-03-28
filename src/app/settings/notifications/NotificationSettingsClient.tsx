'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { updateNotificationSettings } from '@/actions/notification-settings';
import { showError, showSuccess } from '@/lib/toast';
import type { NotificationSettings } from '@/types';

interface Props {
  initialSettings: NotificationSettings | null;
}

const DEFAULT: NotificationSettings = {
  approval_request: true,
  approval_result: true,
  payment_result: true,
  payment_alert_7d: true,
  payment_alert_3d: true,
  payment_alert_today: true,
  overdue: true,
  document_created: true,
};

interface SwitchRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
}

function SwitchRow({ label, description, checked, onCheckedChange }: SwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="space-y-0.5">
        <p className="text-sm font-medium" style={{ color: '#0f0f1a' }}>{label}</p>
        <p className="text-xs" style={{ color: '#71717a' }}>{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export default function NotificationSettingsClient({ initialSettings }: Props) {
  const [settings, setSettings] = useState<NotificationSettings>(
    initialSettings ?? DEFAULT
  );
  const [slackChannel, setSlackChannel] = useState('#approvals');
  const [loading, setLoading] = useState(false);

  const toggle = (key: keyof NotificationSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateNotificationSettings('current-user', settings);
      if (!result.success) {
        showError(result.error.message);
      } else {
        showSuccess('通知設定を保存しました');
      }
    } catch {
      showError('予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid rgba(0,0,0,0.09)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.07), 0 4px 20px rgba(0,0,0,0.09)',
    borderRadius: '0.75rem',
    padding: '1.25rem',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#6366f1',
    marginBottom: '1rem',
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <h2 className="text-lg font-semibold" style={{ color: '#0f0f1a' }}>Slack・メール通知設定</h2>

      <div style={cardStyle}>
        <p style={sectionTitleStyle}>Slack 通知</p>
        <div className="space-y-4">
          <SwitchRow
            label="承認依頼通知"
            description="帳票が承認依頼されたときに通知します"
            checked={settings.approval_request}
            onCheckedChange={() => toggle('approval_request')}
          />
          <Separator />
          <SwitchRow
            label="承認結果通知"
            description="承認または差戻しが行われたときに通知します"
            checked={settings.approval_result}
            onCheckedChange={() => toggle('approval_result')}
          />
          <Separator />
          <SwitchRow
            label="帳票作成通知"
            description="帳票が新規作成されたときに通知します"
            checked={settings.document_created}
            onCheckedChange={() => toggle('document_created')}
          />
          <Separator />
          <SwitchRow
            label="入金確認通知"
            description="入金が確認されたときに通知します"
            checked={settings.payment_result}
            onCheckedChange={() => toggle('payment_result')}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <p style={sectionTitleStyle}>期限アラート</p>
        <div className="space-y-4">
          <SwitchRow
            label="7日前アラート"
            description="支払期限の7日前に通知します"
            checked={settings.payment_alert_7d}
            onCheckedChange={() => toggle('payment_alert_7d')}
          />
          <Separator />
          <SwitchRow
            label="3日前アラート"
            description="支払期限の3日前に通知します"
            checked={settings.payment_alert_3d}
            onCheckedChange={() => toggle('payment_alert_3d')}
          />
          <Separator />
          <SwitchRow
            label="当日アラート"
            description="支払期限当日に通知します"
            checked={settings.payment_alert_today}
            onCheckedChange={() => toggle('payment_alert_today')}
          />
          <Separator />
          <SwitchRow
            label="支払遅延通知"
            description="支払期限を超過したときに通知します"
            checked={settings.overdue}
            onCheckedChange={() => toggle('overdue')}
          />
        </div>
      </div>

      <div style={cardStyle}>
        <p style={sectionTitleStyle}>Slack チャンネル設定</p>
        <div className="space-y-1">
          <label className="text-sm font-medium" style={{ color: '#374151' }} htmlFor="slack-channel">
            承認通知チャンネル
          </label>
          <Input
            id="slack-channel"
            placeholder="#approvals"
            value={slackChannel}
            onChange={(e) => setSlackChannel(e.currentTarget.value)}
          />
          <p className="text-xs" style={{ color: '#71717a' }}>
            承認依頼・承認結果の通知先チャンネル（例: #approvals）
          </p>
        </div>
      </div>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? '保存中...' : '保存する'}
      </Button>
    </div>
  );
}
