import { useConfirmStore } from '@/utils/confirm-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

export function GlobalConfirmDialog() {
  const {
    isOpen,
    title,
    description,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    variant,
    close,
  } = useConfirmStore();

  const handleConfirm = () => {
    onConfirm();
    close();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    close();
  };

  const Icon = variant === 'destructive' ? AlertTriangle : AlertCircle;
  const iconBg = variant === 'destructive'
    ? 'bg-destructive/10 text-destructive border-destructive/20 shadow-destructive/10'
    : 'bg-primary/10 text-primary border-primary/20 shadow-primary/10';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden gap-0 border-border bg-card shadow-lg shadow-black/5">
        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center">
          <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-full border shadow-sm transition-all ${iconBg}`}>
            <Icon className="h-6 w-6" />
          </div>
          <DialogHeader className="flex flex-col items-center">
            <DialogTitle className="text-[19px] font-semibold tracking-tight text-foreground">{title}</DialogTitle>
            <DialogDescription className="text-[14px] mt-2.5 text-muted-foreground leading-relaxed max-w-[280px]">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="bg-muted/40 px-6 py-4 border-t border-border flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:w-auto shadow-sm bg-background hover:bg-muted"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant}
            onClick={handleConfirm}
            className="w-full sm:w-auto shadow-sm"
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
