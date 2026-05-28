import { useState, useEffect } from 'react';
import { useHeaderInfo } from '@/utils/header-store';
import { useAuthStore } from '@/utils/store';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Users as UsersIcon, ShieldAlert, CheckCircle2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { UserFormDialog } from '@/components/users/user-form-dialog';
import { LearnerDetailModal } from '@/components/users/learner-detail-modal';
import { Skeleton } from '@/components/ui/skeleton';
import { confirmDialog } from '@/utils/confirm-store';
import { useDebounce } from '@/hooks/use-debounce';
import { Pagination } from '@/components/shared/pagination';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminUsers, updateAdminUser, LandaUser } from '@/api/landa-admin';
import { getOrgGroups, getSubGroups } from '@/api/landa-groups';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20',
  pending: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
};

const ROLE_COLORS: Record<string, string> = {
  superuser: 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
  staff: 'text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
  learner: 'text-emerald-600 dark:text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
  learner_plus: 'text-purple-600 dark:text-purple-500 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20',
};

export default function UsersPage() {
  useHeaderInfo('Tài Khoản');

  const [mounted, setMounted] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupFilter, setGroupFilter] = useState('all');
  const [subgroupFilter, setSubgroupFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<LandaUser | undefined>();
  const [selectedLearnerUsername, setSelectedLearnerUsername] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const currentUser = useAuthStore((s) => s.user);
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const isLoggingOut = useAuthStore((s) => s.isLoggingOut);
  const queryClient = useQueryClient();

  const isSuperadmin = currentUser?.role === 'superadmin' || (currentUser?.role as string) === 'superuser';
  const canAdd = hasPermission('account', 'general', 'can_add') || true; // Currently assumed true for staff/superuser

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setPage(1); }, [debouncedSearch, roleFilter, statusFilter, groupFilter, subgroupFilter, limit]);

  const { data: groupsData } = useQuery({
    queryKey: ['org-groups-all'],
    queryFn: () => getOrgGroups({ page_size: 100 }),
    enabled: mounted && !isLoggingOut,
    staleTime: 60000,
  });

  const { data: subgroupsData } = useQuery({
    queryKey: ['subgroups-all', groupFilter],
    queryFn: () => getSubGroups(Number(groupFilter), { search: '' }),
    enabled: mounted && !isLoggingOut && groupFilter !== 'all',
    staleTime: 60000,
  });

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['admin-users', page, limit, debouncedSearch, roleFilter, groupFilter, subgroupFilter],
    queryFn: () => getAdminUsers({
      page,
      page_size: limit,
      search: debouncedSearch,
      role: roleFilter === 'all' ? undefined : roleFilter,
      group_id: groupFilter === 'all' ? undefined : groupFilter,
      subgroup_id: subgroupFilter === 'all' ? undefined : subgroupFilter,
    }),
    enabled: mounted && !isLoggingOut,
    staleTime: 5000,
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: number) => updateAdminUser(id, { is_active: false }),
    onSuccess: () => {
      toast.success('Đã vô hiệu hóa tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Vô hiệu hóa thất bại');
    }
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) => updateAdminUser(id, { is_active: true }),
    onSuccess: () => {
      toast.success('Đã duyệt tài khoản');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Duyệt tài khoản thất bại');
    }
  });

  const rawUsers = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Client-side status filter (API chưa hỗ trợ filter is_active)
  const users = statusFilter === 'all'
    ? rawUsers
    : rawUsers.filter((u) => {
      if (statusFilter === 'pending') return !u.is_active && u.role === 'learner';
      if (statusFilter === 'active') return u.is_active;
      if (statusFilter === 'inactive') return !u.is_active && u.role !== 'learner';
      return true;
    });

  const handleDeactivate = (user: LandaUser) => {
    confirmDialog({
      title: 'Vô hiệu hóa tài khoản',
      description: `Bạn có chắc muốn vô hiệu hóa ${user.username}? Người dùng này sẽ không thể đăng nhập.`,
      variant: 'destructive',
      onConfirm: () => deactivateMutation.mutate(user.id),
    });
  };

  if (!mounted || isLoggingOut) return null;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm theo tên hoặc email..."
        filters={[
          {
            key: 'group',
            placeholder: 'Nhóm',
            options: groupsData?.groups?.map(g => ({ value: g.id.toString(), label: g.name })) || [],
          },
          ...(groupFilter !== 'all' ? [{
            key: 'subgroup',
            placeholder: 'Team',
            options: subgroupsData?.subgroups?.map(sg => ({ value: sg.id.toString(), label: sg.name })) || [],
          }] : []),
          {
            key: 'role',
            placeholder: 'Vai trò',
            options: [
              { value: 'superuser', label: 'Superuser' },
              { value: 'staff', label: 'Staff' },
              { value: 'learner', label: 'Learner' },
              { value: 'learner_plus', label: 'Learner Plus' },
            ],
          },
          {
            key: 'status',
            placeholder: 'Trạng thái',
            options: [
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Đã khóa' },
              { value: 'pending', label: 'Chờ duyệt' },
            ],
          },
        ]}
        filterValues={{ role: roleFilter, status: statusFilter, group: groupFilter, subgroup: subgroupFilter }}
        onFilterChange={(key, val) => {
          if (key === 'role') setRoleFilter(val);
          if (key === 'status') setStatusFilter(val);
          if (key === 'group') {
            setGroupFilter(val);
            setSubgroupFilter('all');
          }
          if (key === 'subgroup') setSubgroupFilter(val);
        }}
        onReset={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setGroupFilter('all'); setSubgroupFilter('all'); }}
        actions={
          canAdd && (
            <Button onClick={() => { setSelectedUser(undefined); setIsDialogOpen(true); }} className="shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> Thêm tài khoản
            </Button>
          )
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden mt-3">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider h-11 pl-5">Người dùng</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Vai trò</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Điện thoại</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Trạng thái</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Ngày tham gia</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider text-right pr-5">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching && users.length > 0 ? "opacity-50 pointer-events-none transition-opacity duration-200" : "transition-opacity duration-200"}>
              {isLoading && users.length === 0 ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="pl-5 py-3"><div className="flex items-center gap-3"><Skeleton className="h-9 w-9 rounded-full" /><div className="space-y-1.5"><Skeleton className="h-4 w-28" /><Skeleton className="h-3 w-36" /></div></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="pr-5"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <UsersIcon className="w-10 h-10 mb-3 opacity-20" />
                      <p className="text-sm font-medium">Không tìm thấy người dùng</p>
                      <p className="text-xs mt-1 text-muted-foreground/70">Hãy thử thay đổi từ khóa hoặc bộ lọc.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const statusKey = u.is_active ? 'active' : 'inactive';
                  const displayStatus = !u.is_active && u.role === 'learner' ? 'pending' : statusKey;

                  // Role-based actions logic
                  let canEditDelete = true;
                  if (!isSuperadmin) {
                    if (u.role === 'superuser' || u.role === 'staff') {
                      canEditDelete = false;
                    }
                  }

                  return (
                    <TableRow key={u.id} className="group hover:bg-muted/30 transition-colors border-border">
                      <TableCell className="pl-5 py-3">
                        <div className="flex items-center gap-3">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.username} className="w-9 h-9 flex-shrink-0 rounded-full object-cover border border-border" />
                          ) : (
                            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground font-semibold text-xs transition-colors">
                              {u.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-sm text-foreground truncate">{u.username}</span>
                            <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`text-[11px] font-mono font-medium px-2.5 py-1 rounded-md border ${ROLE_COLORS[u.role] || ROLE_COLORS.learner}`}>
                          {u.role}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground text-sm font-medium">
                        {u.phone || <span className="text-muted-foreground/40">—</span>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-medium shadow-none font-sans ${STATUS_COLORS[displayStatus]}`}>
                          <span className="capitalize">{displayStatus === 'pending' ? 'Chờ duyệt' : statusKey === 'active' ? 'Hoạt động' : 'Đã khóa'}</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {u.date_joined ? format(new Date(u.date_joined), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          {!canEditDelete ? (
                            <span title="Không có quyền">
                              <ShieldAlert className="h-4 w-4 text-muted-foreground/50" />
                            </span>
                          ) : (
                            <>
                              {/* Nút Xem chi tiết — chỉ hiện cho learner và learner_plus */}
                              {(u.role === 'learner' || u.role === 'learner_plus') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedLearnerUsername(u.username)}
                                  className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10 transition-colors rounded-md"
                                  title="Xem chi tiết học tập"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {displayStatus === 'pending' && (
                                <Button variant="ghost" size="icon" onClick={() => approveMutation.mutate(u.id)}
                                  disabled={approveMutation.isPending}
                                  className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30 transition-colors rounded-md" title="Duyệt tài khoản">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setIsDialogOpen(true); }}
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md" title="Chỉnh sửa">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {u.is_active && (
                                <Button variant="ghost" size="icon" onClick={() => handleDeactivate(u)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-md" title="Vô hiệu hóa">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} onLimitChange={setLimit} label="tài khoản" />
      </div>

      <UserFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        user={selectedUser}
        onSuccess={() => setIsDialogOpen(false)}
      />

      <LearnerDetailModal
        username={selectedLearnerUsername}
        isOpen={!!selectedLearnerUsername}
        onClose={() => setSelectedLearnerUsername(null)}
      />
    </div>
  );
}
