'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import type { Role, User } from '@/types';

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

// モックデータ（今後はAPIから取得）
const MOCK_USERS: Pick<
  User,
  'userId' | 'displayName' | 'email' | 'role' | 'isActive' | 'updatedAt'
>[] = [
  {
    userId: 'user-001',
    displayName: '山田 太郎',
    email: 'yamada@example.com',
    role: 'admin',
    isActive: true,
    updatedAt: '2026-03-20T10:00:00Z',
  },
  {
    userId: 'user-002',
    displayName: '鈴木 花子',
    email: 'suzuki@example.com',
    role: 'accountant',
    isActive: true,
    updatedAt: '2026-03-18T09:00:00Z',
  },
  {
    userId: 'user-003',
    displayName: '田中 一郎',
    email: 'tanaka@example.com',
    role: 'user',
    isActive: true,
    updatedAt: '2026-03-15T14:00:00Z',
  },
];

function formatLastLogin(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export default function UsersClient() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: '#0f0f1a' }}>ユーザー一覧</h2>
        <Button>
          <Plus className="h-4 w-4 mr-1" />
          ユーザー追加
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>表示名</TableHead>
            <TableHead>メールアドレス</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>最終ログイン</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MOCK_USERS.length > 0 ? (
            MOCK_USERS.map((user) => (
              <TableRow key={user.userId}>
                <TableCell>{user.displayName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={ROLE_VARIANTS[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>{formatLastLogin(user.updatedAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      title="編集"
                      className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      title="削除"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10" style={{ color: '#c4c4d0' }}>
                ユーザーが登録されていません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
