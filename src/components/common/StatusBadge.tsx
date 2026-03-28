import { Badge } from '@/components/ui/badge';
import type { DocumentStatus } from '@/types';

const statusConfig: Record<DocumentStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'info' | 'purple' | 'cyan' | 'outline' }> = {
  draft: { label: '下書き', variant: 'secondary' },
  pending_approval: { label: '承認待ち', variant: 'warning' },
  approved: { label: '承認済み', variant: 'info' },
  confirmed: { label: '確定', variant: 'purple' },
  sent: { label: '送付済み', variant: 'cyan' },
  paid: { label: '入金済み', variant: 'success' },
  overdue: { label: '期限超過', variant: 'destructive' },
  cancelled: { label: '取消済み', variant: 'outline' },
  rejected: { label: '差戻し', variant: 'destructive' },
};

export default function StatusBadge({ status }: { status: DocumentStatus }) {
  const config = statusConfig[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
