import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCourses, updateCourse, bulkCourseAction, type LandaCourse } from '@/api/landa-admin';
import { useHeaderInfo } from '@/utils/header-store';
import { useDebounce } from '@/hooks/use-debounce';
import { TableToolbar } from '@/components/shared/table-toolbar';
import { Pagination } from '@/components/shared/pagination';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  BookOpen, Eye, EyeOff, GraduationCap, Globe, ShieldAlert,
} from 'lucide-react';

export default function CoursesPage() {
  useHeaderInfo('Courses');

  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);
  const [visFilter, setVisFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => { setPage(1); }, [debouncedSearch, visFilter]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['landa-courses', page, limit, debouncedSearch, visFilter],
    queryFn: () => getCourses({
      page, page_size: limit,
      search: debouncedSearch || undefined,
      visibility: visFilter !== 'all' ? visFilter as 'staff_only' | 'public' : undefined,
    }),
  });

  const courses = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  // Toggle visibility
  const toggleVis = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      updateCourse(id, { visible_to_staff_only: visible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['landa-courses'] });
      toast.success('Đã cập nhật');
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  // Bulk
  const bulkMut = useMutation({
    mutationFn: ({ action }: { action: 'staff_only' | 'public' }) =>
      bulkCourseAction(selected, action),
    onSuccess: (result, { action }) => {
      queryClient.invalidateQueries({ queryKey: ['landa-courses'] });
      setSelected([]);
      toast.success(`Đã chuyển ${result.updated} khóa học sang ${action === 'public' ? 'công khai' : 'chỉ staff'}`);
    },
    onError: () => toast.error('Cập nhật hàng loạt thất bại'),
  });

  // Selection
  const allSelected = courses.length > 0 && courses.every((c) => selected.includes(c.id));
  const toggleAll = () => setSelected(allSelected ? [] : courses.map((c) => c.id));
  const toggleOne = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto pb-10">
      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Tìm khóa học..."
        filters={[
          {
            key: 'visibility',
            placeholder: 'Hiển thị',
            options: [
              { value: 'public', label: 'Công khai' },
              { value: 'staff_only', label: 'Chỉ Staff' },
            ],
          },
        ]}
        filterValues={{ visibility: visFilter }}
        onFilterChange={(key, val) => {
          if (key === 'visibility') setVisFilter(val);
        }}
        onReset={() => { setSearch(''); setVisFilter('all'); }}
        actions={
          selected.length > 0 ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: 'public' })} className="h-8 text-xs">
                <Globe className="mr-1 h-3.5 w-3.5" /> Công khai ({selected.length})
              </Button>
              <Button size="sm" variant="outline" onClick={() => bulkMut.mutate({ action: 'staff_only' })} className="h-8 text-xs">
                <ShieldAlert className="mr-1 h-3.5 w-3.5" /> Chỉ Staff ({selected.length})
              </Button>
            </div>
          ) : undefined
        }
      />

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-border">
                <TableHead className="w-10 pl-4">
                  <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                </TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Khóa học</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Tổ chức</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Hiển thị</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Bắt đầu</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Kết thúc</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Cập nhật</TableHead>
                <TableHead className="font-medium text-xs text-muted-foreground uppercase tracking-wider text-right pr-5">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={isFetching && courses.length > 0 ? 'opacity-50 pointer-events-none' : ''}>
              {isLoading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <TableRow key={i} className="border-border">
                    <TableCell className="pl-4"><Skeleton className="h-4 w-4" /></TableCell>
                    <TableCell><div className="space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-52" /></div></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-32 text-center">
                    <div className="flex flex-col items-center text-muted-foreground">
                      <GraduationCap className="w-8 h-8 mb-2 opacity-20" />
                      <p className="text-sm">Chưa có khóa học</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id} className="group hover:bg-muted/30 transition-colors border-border">
                    <TableCell className="pl-4">
                      <Checkbox checked={selected.includes(course.id)} onCheckedChange={() => toggleOne(course.id)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <BookOpen className="h-4 w-4 text-primary/60 flex-shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate max-w-[280px]">{course.display_name}</span>
                          <span className="text-[11px] text-muted-foreground font-mono truncate max-w-[280px]">{course.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono font-medium bg-secondary px-2 py-0.5 rounded border border-border">{course.org}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={course.visible_to_staff_only
                          ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                          : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                        }
                      >
                        {course.visible_to_staff_only ? 'Staff Only' : 'Public'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{course.start}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{course.end}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{course.modified}</TableCell>
                    <TableCell className="text-right pr-5">
                      <Button variant="ghost" size="icon"
                        onClick={() => toggleVis.mutate({ id: course.id, visible: !course.visible_to_staff_only })}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        title={course.visible_to_staff_only ? 'Chuyển sang Public' : 'Chuyển sang Staff Only'}
                      >
                        {course.visible_to_staff_only ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination page={page} limit={limit} total={total} totalPages={totalPages} onPageChange={setPage} onLimitChange={setLimit} label="khóa học" />
      </div>
    </div>
  );
}
