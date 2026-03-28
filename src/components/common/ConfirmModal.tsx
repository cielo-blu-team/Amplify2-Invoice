'use client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'destructive' | 'default';
  loading?: boolean;
}

export default function ConfirmModal({
  opened, onClose, onConfirm, title, message,
  confirmLabel = '確認', cancelLabel = 'キャンセル',
  variant = 'destructive', loading = false,
}: ConfirmModalProps) {
  return (
    <Dialog open={opened} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={variant} onClick={onConfirm} disabled={loading}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
