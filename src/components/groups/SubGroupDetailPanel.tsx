import { useState } from 'react';
import { UserPlus, BookPlus, Trash2, Users, BookOpen, Loader2, FolderOpen, FolderPlus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { confirmDialog } from '@/utils/confirm-store';
import { format } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import {
  getSubGroupDetail, removeMember, revokeCourse, revokeCategory,
  type SubGroupDetail,
} from '@/api/landa-groups';
import { AddMembersModal } from './AddMembersModal';
import { AssignCoursesModal } from './AssignCoursesModal';
import { AssignCategoriesModal } from './AssignCategoriesModal';


interface Props {
  sgId: number;
}

type Tab = 'members' | 'courses' | 'categories';

export function SubGroupDetailPanel({ sgId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [assignCoursesOpen, setAssignCoursesOpen] = useState(false);
  const [assignCategoriesOpen, setAssignCategoriesOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const qc = useQueryClient();

  const { data: sg, isLoading } = useQuery<SubGroupDetail>({
    queryKey: ['subgroup-detail', sgId],
    queryFn: () => getSubGroupDetail(sgId),
    enabled: sgId > 0,
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) => removeMember(sgId, userId),
    onSuccess: () => {
      toast.success('Đã xóa thành viên');
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi xóa thành viên'),
  });

  const revokeMutation = useMutation({
    mutationFn: (courseId: string) => revokeCourse(sgId, courseId),
    onSuccess: () => {
      toast.success('Đã thu hồi course');
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi thu hồi course'),
  });

  const removeMultipleMembersMutation = useMutation({
    mutationFn: async (userIds: number[]) => {
      await Promise.all(userIds.map(id => removeMember(sgId, id)));
    },
    onSuccess: () => {
      toast.success('Đã xóa các thành viên đã chọn');
      setSelectedMembers([]);
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi xóa thành viên'),
  });

  const revokeMultipleCoursesMutation = useMutation({
    mutationFn: async (courseIds: string[]) => {
      await Promise.all(courseIds.map(id => revokeCourse(sgId, id)));
    },
    onSuccess: () => {
      toast.success('Đã thu hồi các course đã chọn');
      setSelectedCourses([]);
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi thu hồi course'),
  });

  const revokeCategoryMutation = useMutation({
    mutationFn: (categoryId: number) => revokeCategory(sgId, categoryId),
    onSuccess: () => {
      toast.success('Đã thu hồi danh mục');
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi thu hồi danh mục'),
  });

  const revokeMultipleCategoriesMutation = useMutation({
    mutationFn: async (categoryIds: number[]) => {
      await Promise.all(categoryIds.map(id => revokeCategory(sgId, id)));
    },
    onSuccess: () => {
      toast.success('Đã thu hồi các danh mục đã chọn');
      setSelectedCategories([]);
      qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
      qc.invalidateQueries({ queryKey: ['sub-groups', sg?.org_group_id] });
    },
    onError: () => toast.error('Lỗi thu hồi danh mục'),
  });

  const handleRemoveMember = (id: number, username: string) => {
    confirmDialog({
      title: 'Xóa thành viên',
      description: `Xóa "${username}" khỏi nhóm? User sẽ không còn thấy courses của nhóm này.`,
      variant: 'destructive',
      onConfirm: () => removeMemberMutation.mutate(id),
    });
  };

  const handleRevokeCourse = (courseId: string, displayName: string) => {
    confirmDialog({
      title: 'Thu hồi Course',
      description: `Thu hồi "${displayName}"? Các thành viên sẽ không còn thấy course này.`,
      variant: 'destructive',
      onConfirm: () => revokeMutation.mutate(courseId),
    });
  };

  const handleBulkRemoveMembers = () => {
    confirmDialog({
      title: 'Xóa nhiều thành viên',
      description: `Xóa ${selectedMembers.length} thành viên khỏi nhóm?`,
      variant: 'destructive',
      onConfirm: () => removeMultipleMembersMutation.mutate(selectedMembers),
    });
  };

  const handleBulkRevokeCourses = () => {
    confirmDialog({
      title: 'Thu hồi nhiều Course',
      description: `Thu hồi ${selectedCourses.length} course khỏi nhóm?`,
      variant: 'destructive',
      onConfirm: () => revokeMultipleCoursesMutation.mutate(selectedCourses),
    });
  };

  const handleRevokeCategory = (categoryId: number, name: string) => {
    confirmDialog({
      title: 'Thu hồi danh mục',
      description: `Thu hồi "${name}"? Các thành viên sẽ không còn thấy danh mục này.`,
      variant: 'destructive',
      onConfirm: () => revokeCategoryMutation.mutate(categoryId),
    });
  };

  const handleBulkRevokeCategories = () => {
    confirmDialog({
      title: 'Thu hồi nhiều danh mục',
      description: `Thu hồi ${selectedCategories.length} danh mục khỏi nhóm?`,
      variant: 'destructive',
      onConfirm: () => revokeMultipleCategoriesMutation.mutate(selectedCategories),
    });
  };

  const toggleMember = (id: number) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllMembers = () => {
    if (sg?.members.length && selectedMembers.length === sg.members.length) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(sg?.members.map(m => m.id) ?? []);
    }
  };

  const toggleCourse = (id: string) => {
    setSelectedCourses(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllCourses = () => {
    if (sg?.courses.length && selectedCourses.length === sg.courses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(sg?.courses.map(c => c.course_id) ?? []);
    }
  };

  const toggleCategory = (id: number) => {
    setSelectedCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAllCategories = () => {
    if (sg?.categories.length && selectedCategories.length === sg.categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(sg?.categories.map(c => c.category_id) ?? []);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-2 mt-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (!sg) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
        <h3 className="font-semibold text-foreground text-base">{sg.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{sg.org_group_name}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border shrink-0 overflow-x-auto">
        {(['members', 'courses', 'categories'] as Tab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-1.5 px-5 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
          >
            {tab === 'members' ? <Users className="h-3.5 w-3.5" /> : tab === 'courses' ? <BookOpen className="h-3.5 w-3.5" /> : <FolderOpen className="h-3.5 w-3.5" />}
            {tab === 'members' ? `Thành viên (${sg.member_count})` : tab === 'courses' ? `Courses (${sg.course_count})` : `Danh mục (${sg.category_count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'members' && (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={sg.members.length > 0 && selectedMembers.length === sg.members.length}
                  onCheckedChange={toggleAllMembers}
                  disabled={sg.members.length === 0}
                  id="select-all-members"
                />
                <label htmlFor="select-all-members" className="text-sm font-medium cursor-pointer">Chọn tất cả</label>
                {selectedMembers.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 ml-2 text-xs"
                    onClick={handleBulkRemoveMembers}
                    disabled={removeMultipleMembersMutation.isPending}
                  >
                    {removeMultipleMembersMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                    Xóa ({selectedMembers.length})
                  </Button>
                )}
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setAddMembersOpen(true)}>
                <UserPlus className="h-3.5 w-3.5" /> Thêm thành viên
              </Button>
            </div>
            {sg.members.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <Users className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có thành viên</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sg.members.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 group">
                    <Checkbox
                      checked={selectedMembers.includes(m.id)}
                      onCheckedChange={() => toggleMember(m.id)}
                    />
                    <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                      {m.username[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 hidden group-hover:block shrink-0">
                      {format(new Date(m.added_at), 'dd/MM/yyyy')}
                    </span>
                    <button
                      onClick={() => handleRemoveMember(m.id, m.username)}
                      disabled={removeMemberMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      {removeMemberMutation.isPending && removeMemberMutation.variables === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'courses' && (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={sg.courses.length > 0 && selectedCourses.length === sg.courses.length}
                  onCheckedChange={toggleAllCourses}
                  disabled={sg.courses.length === 0}
                  id="select-all-courses"
                />
                <label htmlFor="select-all-courses" className="text-sm font-medium cursor-pointer">Chọn tất cả</label>
                {selectedCourses.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 ml-2 text-xs"
                    onClick={handleBulkRevokeCourses}
                    disabled={revokeMultipleCoursesMutation.isPending}
                  >
                    {revokeMultipleCoursesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                    Xóa ({selectedCourses.length})
                  </Button>
                )}
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setAssignCoursesOpen(true)}>
                <BookPlus className="h-3.5 w-3.5" /> Phân course
              </Button>
            </div>
            {sg.courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có course nào được phân</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sg.courses.map(c => (
                  <div key={c.course_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 group">
                    <Checkbox
                      checked={selectedCourses.includes(c.course_id)}
                      onCheckedChange={() => toggleCourse(c.course_id)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <BookOpen className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.display_name}</p>
                      <p className="text-[11px] text-muted-foreground truncate font-mono">{c.course_id}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 hidden group-hover:block shrink-0">
                      {format(new Date(c.assigned_at), 'dd/MM/yyyy')}
                    </span>
                    <button
                      onClick={() => handleRevokeCourse(c.course_id, c.display_name)}
                      disabled={revokeMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      {revokeMutation.isPending && revokeMutation.variables === c.course_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={sg.categories.length > 0 && selectedCategories.length === sg.categories.length}
                  onCheckedChange={toggleAllCategories}
                  disabled={sg.categories.length === 0}
                  id="select-all-categories"
                />
                <label htmlFor="select-all-categories" className="text-sm font-medium cursor-pointer">Chọn tất cả</label>
                {selectedCategories.length > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 ml-2 text-xs"
                    onClick={handleBulkRevokeCategories}
                    disabled={revokeMultipleCategoriesMutation.isPending}
                  >
                    {revokeMultipleCategoriesMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <Trash2 className="h-3.5 w-3.5 mr-1.5" />}
                    Xóa ({selectedCategories.length})
                  </Button>
                )}
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs" onClick={() => setAssignCategoriesOpen(true)}>
                <FolderPlus className="h-3.5 w-3.5" /> Phân danh mục
              </Button>
            </div>
            {sg.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <FolderOpen className="h-10 w-10 text-muted-foreground/20 mb-2" />
                <p className="text-sm text-muted-foreground">Chưa có danh mục nào được phân</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sg.categories.map(c => (
                  <div key={c.category_id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 group">
                    <Checkbox
                      checked={selectedCategories.includes(c.category_id)}
                      onCheckedChange={() => toggleCategory(c.category_id)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                      <FolderOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground/60 hidden group-hover:block shrink-0">
                      {format(new Date(c.assigned_at), 'dd/MM/yyyy')}
                    </span>
                    <button
                      onClick={() => handleRevokeCategory(c.category_id, c.name)}
                      disabled={revokeCategoryMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                    >
                      {revokeCategoryMutation.isPending && revokeCategoryMutation.variables === c.category_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <AddMembersModal
        open={addMembersOpen}
        sgId={sgId}
        existingMemberIds={sg.members.map(m => m.id)}
        onOpenChange={setAddMembersOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
          qc.invalidateQueries({ queryKey: ['sub-groups', sg.org_group_id] });
        }}
      />
      <AssignCoursesModal
        open={assignCoursesOpen}
        sgId={sgId}
        assignedCourseIds={sg.courses.map(c => c.course_id)}
        onOpenChange={setAssignCoursesOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
          qc.invalidateQueries({ queryKey: ['sub-groups', sg.org_group_id] });
        }}
      />
      <AssignCategoriesModal
        open={assignCategoriesOpen}
        sgId={sgId}
        assignedCategoryIds={sg.categories.map(c => c.category_id)}
        onOpenChange={setAssignCategoriesOpen}
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ['subgroup-detail', sgId] });
          qc.invalidateQueries({ queryKey: ['sub-groups', sg.org_group_id] });
        }}
      />
    </div>
  );
}
