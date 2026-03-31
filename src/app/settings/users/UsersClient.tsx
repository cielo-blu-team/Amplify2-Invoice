'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Mail, Plus, Trash2, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { createInvitation, deleteInvitation } from '@/actions/invitation';
import { updateUserRoleAction } from '@/actions/user';
import { showError, showSuccess } from '@/lib/toast';
import type { Role, User } from '@/types';
import type { Invitation } from '@/types/invitation';

const ROLE_LABELS: Record<Role, string> = {
  user: '一般',
  accountant: '経理',
  admin: '管理者',
};

type BadgeVariant = 'default' | 'info' | 'secondary';

const ROLE_VARIANTS: Record<Role, BadgeVariant> = {
  admin: 'default',
  accountant: 'info',
  user: 'secondary',
};

const STATUS_ICONS = {
  pending: <Clock className="h-4 w-4 text-yellow-500" />,
  used: <CheckCircle2 className="h-4 w-4 text-green-500" />,
  expired: <XCircle className="h-4 w-4 text-zinc-400" />,
};

const STATUS_LABELS = {
  pending: '待機中',
  used: '使用済',
  expired: '期限切れ',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

interface Props {
  users: User[];
  invitations: Invitation[];
}

export default function UsersClient({ users: initialUsers, invitations: initialInvitations }: Props) {
  const [users] = useState(initialUsers);
  const [invitations, setInvitations] = useState(initialInvitations);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('user');
  const [inviting, setInviting] = useState(false);

  const activeUsers = users.filter((u) => u.isActive);

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      showError('メールアドレスを入力してください');
      return;
    }
    setInviting(true);
    try {
      const result = await createInvitation({ email: inviteEmail.trim(), role: inviteRole });
      if ('success' in result && result.success && 'invitation' in result) {
        setInvitations((prev) => [result.invitation as Invitation, ...prev]);
        setInviteEmail('');
        setInviteRole('user');
        setShowInviteForm(false);
        showSuccess('招待を作成しました（有効期限: 7日間）');
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : '招待の作成に失敗しました');
    } finally {
      setInviting(false);
    }
  };

  const handleDeleteInvitation = async (id: string) => {
    try {
      await deleteInvitation(id);
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      showSuccess('招待を削除しました');
    } catch {
      showError('削除に失敗しました');
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRoleAction(userId, newRole);
      showSuccess('ロールを更新しました');
    } catch (e) {
      showError(e instanceof Error ? e.message : 'ロールの更新に失敗しました');
    }
  };

  return (
    <div className="space-y-8">
      {/* ユーザー一覧 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: '#0f0f1a' }}>
            ユーザー一覧
          </h2>
          <Button onClick={() => setShowInviteForm((v) => !v)}>
            <Plus className="h-4 w-4 mr-1" />
            ユーザー招待
          </Button>
        </div>

        {/* 招待フォーム */}
        {showInviteForm && (
          <div className="border border-zinc-200 rounded-lg p-4 bg-zinc-50 space-y-3">
            <p className="text-sm font-medium text-zinc-700">新規ユーザーを招待</p>
            <div className="flex gap-2 items-start">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="招待するメールアドレス"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.currentTarget.value)}
                  disabled={inviting}
                />
              </div>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">一般</SelectItem>
                  <SelectItem value="accountant">経理</SelectItem>
                  <SelectItem value="admin">管理者</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite} disabled={inviting}>
                <Mail className="h-4 w-4 mr-1" />
                {inviting ? '送信中...' : '招待'}
              </Button>
              <Button variant="outline" onClick={() => setShowInviteForm(false)} disabled={inviting}>
                キャンセル
              </Button>
            </div>
            <p className="text-xs text-zinc-500">
              招待されたユーザーは Google または メール/パスワードでこのシステムにログインできます（有効期限: 7日間）
            </p>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>表示名</TableHead>
              <TableHead>メールアドレス</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>登録日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeUsers.length > 0 ? (
              activeUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>{user.displayName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Select
                      defaultValue={user.role}
                      onValueChange={(v) => handleRoleChange(user.userId, v as Role)}
                    >
                      <SelectTrigger className="w-28 h-7 text-sm">
                        <SelectValue>
                          <Badge variant={ROLE_VARIANTS[user.role]}>
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">一般</SelectItem>
                        <SelectItem value="accountant">経理</SelectItem>
                        <SelectItem value="admin">管理者</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-zinc-400">
                  ユーザーが登録されていません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* 招待一覧 */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: '#0f0f1a' }}>
          招待一覧
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>メールアドレス</TableHead>
              <TableHead>ロール</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>有効期限</TableHead>
              <TableHead>作成者</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.length > 0 ? (
              invitations.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>
                    <Badge variant={ROLE_VARIANTS[inv.role]}>{ROLE_LABELS[inv.role]}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      {STATUS_ICONS[inv.status]}
                      {STATUS_LABELS[inv.status]}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(inv.expiresAt)}</TableCell>
                  <TableCell>{inv.createdByName}</TableCell>
                  <TableCell>
                    {inv.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteInvitation(inv.id)}
                        title="招待を削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-zinc-400">
                  招待がありません
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
