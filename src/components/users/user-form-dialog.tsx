import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input, PasswordInput } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/utils/store';
import { toast } from 'sonner';
import { UserPlus, Pencil } from 'lucide-react';
import { LandaUser, createAdminUser, updateAdminUser } from '@/api/landa-admin';

const createUserSchema = z.object({
  username: z.string().min(2, 'Tên đăng nhập là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại là bắt buộc'),
  password: z.string().min(6, 'Tối thiểu 6 ký tự'),
  role: z.enum(['superuser', 'staff', 'learner', 'learner_plus']),
  is_active: z.string().transform(v => v === 'true'),
});

const updateUserSchema = z.object({
  username: z.string().min(2, 'Tên đăng nhập là bắt buộc'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(8, 'Số điện thoại là bắt buộc'),
  password: z.string().optional().or(z.literal('')),
  role: z.enum(['superuser', 'staff', 'learner', 'learner_plus']),
  is_active: z.string().transform(v => v === 'true'),
});

type UserFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: LandaUser;
  onSuccess: () => void;
};

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  onSuccess,
}: UserFormProps) {
  const currentUser = useAuthStore((state) => state.user);
  const isSuperadmin = currentUser?.role === 'superadmin' || (currentUser?.role as string) === 'superuser';
  const isEditing = !!user;
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'learner',
      is_active: 'true',
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        username: user.username,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        is_active: user.is_active ? 'true' : 'false',
        password: '',
      });
    } else if (!user && open) {
      form.reset({
        username: '',
        email: '',
        phone: '',
        password: '',
        role: 'learner',
        is_active: 'true',
      });
    }
  }, [user, open, form]);

  const onSubmit = async (values: any) => {
    try {
      setIsLoading(true);
      const payload: any = { ...values };

      if (isEditing && !payload.password) {
        delete payload.password;
      }

      if (isEditing) {
        await updateAdminUser(user!.id, payload);
        toast.success('Đã cập nhật tài khoản');
      } else {
        await createAdminUser(payload);
        toast.success('Đã tạo tài khoản mới');
      }
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 gap-0 border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderBottom: '1px solid transparent', borderImage: 'linear-gradient(to right, transparent, var(--border), transparent) 1' }}>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center ring-1 ring-primary/20">
            {isEditing
              ? <Pencil className="h-4 w-4 text-primary" />
              : <UserPlus className="h-4 w-4 text-primary" />
            }
          </div>
          <div>
            <DialogTitle className="text-[15px] font-semibold">
              {isEditing ? 'Chỉnh sửa tài khoản' : 'Tạo tài khoản mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {isEditing ? `Đang chỉnh sửa tài khoản ${user?.username}` : 'Thêm thành viên mới vào hệ thống'}
            </DialogDescription>
          </div>
        </div>

        {/* Form */}
        <Form {...form}>
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="overflow-y-auto max-h-[60vh]">
            {/* Section: Account */}
            <div className="px-6 pt-5 pb-4">
              <div className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3">Thông tin tài khoản</div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Tên đăng nhập</FormLabel>
                        <FormControl>
                          <Input disabled={isEditing} placeholder="nguyenvana" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@congty.com"
                            {...field}
                            className="h-9 text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Số điện thoại</FormLabel>
                        <FormControl>
                          <Input placeholder="0123456789" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">
                          {isEditing ? 'Mật khẩu mới' : 'Mật khẩu'}
                          {isEditing && <span className="text-muted-foreground/40 ml-1 font-normal">— bỏ trống nếu không đổi</span>}
                        </FormLabel>
                        <FormControl>
                          <PasswordInput placeholder="••••••••" {...field} className="h-9 text-sm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-6 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

            {/* Section: Access Control */}
            <div className="px-6 pt-4 pb-5">
              <div className="text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-[0.12em] mb-3">Phân quyền</div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Vai trò</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Chọn vai trò" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isSuperadmin && (
                              <>
                                <SelectItem value="superuser">
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                    Superuser
                                  </span>
                                </SelectItem>
                                <SelectItem value="staff">
                                  <span className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Staff
                                  </span>
                                </SelectItem>
                              </>
                            )}
                            <SelectItem value="learner">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Learner
                              </span>
                            </SelectItem>
                            <SelectItem value="learner_plus">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                Learner Plus
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-muted-foreground">Trạng thái</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Chọn trạng thái" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Hoạt động
                              </span>
                            </SelectItem>
                            <SelectItem value="false">
                              <span className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Đã khóa
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Footer inside form to trigger HTML5 validation and focus */}
            <div className="flex justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid transparent', borderImage: 'linear-gradient(to right, transparent, var(--border), transparent) 1' }}>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                className="h-9 px-4 text-[13px]"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="h-9 px-5 text-[13px] transition-all duration-200 active:scale-[0.97]"
              >
                {isLoading ? (isEditing ? 'Đang lưu...' : 'Đang tạo...') : (isEditing ? 'Lưu thay đổi' : 'Tạo tài khoản')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

