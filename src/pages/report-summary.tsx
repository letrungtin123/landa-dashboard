import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useHeaderInfo } from '@/utils/header-store';
import { useAuthStore } from '@/utils/store';
import { 
  getReportSummary, 
  getLearnerDetail, 
  LearnerDetailResult,
  getReportChart,
  getReportTopCourses,
  getReportUncompletedLearners
} from '@/api/landa-admin';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, BookOpen, GraduationCap, UserCheck, Percent, Award, AlertTriangle, ShieldAlert,
  ArrowUpRight, Calendar, Download, RefreshCcw, ChevronLeft, ChevronRight, BarChart3, ChevronDown, Check
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart, Area, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip as ReTooltip, Cell, CartesianGrid
} from 'recharts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef, useCallback } from 'react';

const cardVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const generateSparkline = (base: number) => {
  const data = [];
  let current = base * 0.8;
  for (let i = 0; i < 10; i++) {
    current = current + (Math.random() - 0.4) * (base * 0.1);
    data.push({ value: Math.max(0, Math.floor(current)) });
  }
  data[data.length - 1].value = base; 
  return data;
};

function ChartTrendModal({ 
  metricKey, 
  title, 
  isOpen, 
  onClose 
}: { 
  metricKey: string | null; 
  title: string; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['report-chart', year, metricKey],
    queryFn: () => getReportChart(year, metricKey!),
    enabled: !!metricKey && isOpen,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl bg-background border-border shadow-2xl">
        <DialogHeader>
          <div className="flex justify-between items-center pr-8">
            <div>
              <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
              <DialogDescription>Biểu đồ 12 tháng</DialogDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-background text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary hover:bg-muted transition-colors">
                Năm {year}
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[120px] rounded-lg">
                {[currentYear, currentYear - 1, currentYear - 2].map(y => (
                  <DropdownMenuItem
                    key={y}
                    onClick={() => setYear(y)}
                    className={`cursor-pointer text-[13px] mx-1 rounded-md mb-0.5 justify-between transition-colors ${year === y ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    Năm {y}
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${year === y ? 'bg-foreground' : 'bg-transparent'}`} />
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogHeader>
        <div className="h-[300px] w-full mt-4">
          {isLoading ? (
            <Skeleton className="h-full w-full rounded-xl" />
          ) : isError ? (
            <div className="flex flex-col h-full items-center justify-center text-muted-foreground gap-2">
              <AlertTriangle className="h-8 w-8 opacity-50" />
              <span>Lỗi tải biểu đồ</span>
            </div>
          ) : data && data.data ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.3} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <ReTooltip cursor={{ fill: 'var(--muted)', opacity: 0.4 }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }} />
                <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TopCoursesWidget({ month, year }: { month: number, year: number }) {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ['report-top-courses', month, year, page],
    queryFn: () => getReportTopCourses({ month, year, page, page_size: 5 }),
  });

  return (
    <Card className="shadow-sm border-border h-full flex flex-col bg-gradient-to-br from-background to-muted/20 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none" />
      <CardHeader className="p-5 pb-0">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Bảng xếp hạng Khóa học
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">Top các khóa học có lượng đăng ký cao nhất.</p>
          </div>
          <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-md border border-primary/20">
            <ArrowUpRight className="h-3 w-3 text-primary" />
            <span className="text-[9px] font-black text-primary tracking-widest uppercase">Thịnh hành</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5 flex-grow flex flex-col">
        {isLoading ? (
          <Skeleton className="w-full flex-grow rounded-xl" />
        ) : !data || data.results.length === 0 ? (
          <div className="flex-grow flex items-center justify-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl bg-muted/20">Không có dữ liệu</div>
        ) : (
          <>
            <div className="flex-grow w-full mt-4 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={data.results}
                  margin={{ left: 10, right: 60, top: 0, bottom: 0 }}
                  barGap={12}
                >
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    tick={({ x, y, payload, index }) => {
                      const rank = index + 1 + (page - 1) * 5;
                      return (
                        <g transform={`translate(${x},${y})`}>
                          <circle cx={-25} cy={-12} r={9} fill={rank === 1 ? '#fbbf24' : rank === 2 ? '#94a3b8' : rank === 3 ? '#92400e' : 'transparent'} opacity={rank <= 3 ? 1 : 0} />
                          <text x={-25} y={-12} dy={3.5} textAnchor="middle" fill={rank <= 3 ? 'white' : 'var(--muted-foreground)'} className="text-[9px] font-black">{rank}</text>
                          <text x={10} y={-15} dy={0} textAnchor="start" fill="var(--foreground)" className="text-[11px] font-bold fill-foreground">
                            {payload.value.length > 35 ? payload.value.substring(0, 35) + '...' : payload.value}
                          </text>
                        </g>
                      )
                    }}
                    width={40}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReTooltip cursor={{ fill: 'var(--primary)', opacity: 0.05 }} />
                  <Bar dataKey="enrollments" radius={[0, 4, 4, 0]} barSize={8} fill="var(--primary)" background={{ fill: 'var(--muted)', radius: 4, opacity: 0.2 }}>
                    {data.results.map((_, index) => {
                      const rank = index + 1 + (page - 1) * 5;
                      return <Cell key={`cell-${index}`} fill={rank === 1 ? '#3b82f6' : rank === 2 ? '#60a5fa' : rank === 3 ? '#93c5fd' : '#bfdbfe'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {data.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                <span className="text-xs text-muted-foreground font-medium">Trang {page} / {data.total_pages}</span>
                <div className="flex gap-2">
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-md bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <button disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-md bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function UncompletedLearnersWidget({ month, year, onSelectLearner, trendData }: { month: number, year: number, onSelectLearner: (u: string) => void, trendData?: Array<{day: string, count: number}> }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ['report-uncompleted-learners', month, year, page, debouncedSearch],
    queryFn: () => getReportUncompletedLearners({ month, year, page, search: debouncedSearch, page_size: 5 }),
  });

  return (
    <Card className="shadow-sm border-border h-full flex flex-col bg-muted/5 backdrop-blur-sm">
      <CardHeader className="p-5 pb-2 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Cần chú ý
          </CardTitle>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-tighter">Chưa hoàn thành</span>
          </div>
        </div>
        <div className="mt-3 relative">
          <Input 
            placeholder="Tìm theo username hoặc email..." 
            className="h-9 text-xs bg-background border-border"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        {trendData && trendData.length > 0 && (
          <div className="h-28 w-full border-b border-border/40 bg-muted/10 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="uncompletedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 9 }} />
                <YAxis hide />
                <ReTooltip cursor={{ fill: 'var(--muted)', opacity: 0.1 }} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} />
                <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={2} fill="url(#uncompletedGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {isLoading ? (
          <div className="p-4 space-y-3 h-[325px] overflow-hidden">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
          </div>
        ) : !data || data.results.length === 0 ? (
          <div className="flex items-center justify-center p-12 text-center text-sm text-muted-foreground italic h-[325px]">
            Không có dữ liệu
          </div>
        ) : (
          <div className="divide-y divide-border/40 overflow-y-auto custom-scrollbar h-[325px]">
            <AnimatePresence>
              {data.results.map((u, i) => (
                <motion.div key={u.username} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-all cursor-pointer group"
                  onClick={() => onSelectLearner(u.username)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center text-[10px] font-bold text-amber-600 group-hover:bg-amber-500 group-hover:text-white transition-all shrink-0">
                      {u.username.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-amber-600 transition-colors truncate">{u.username}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="flex items-center justify-end gap-1 mb-1">
                      <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">
                        {u.enrolled_at ? new Date(u.enrolled_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Đang học</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
      {data && data.total_pages > 1 && (
        <div className="p-3 border-t border-border/40 flex items-center justify-between bg-muted/5">
          <span className="text-xs text-muted-foreground font-medium">Trang {page} / {data.total_pages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-md bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page === data.total_pages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-md bg-background border border-border hover:bg-muted disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}
    </Card>
  );
}

function LearnerDetailModal({ 
  username, 
  isOpen, 
  onClose 
}: { 
  username: string | null; 
  isOpen: boolean; 
  onClose: () => void 
}) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch
  } = useInfiniteQuery({
    queryKey: ['learner-detail', username, debouncedSearch],
    queryFn: ({ pageParam = 1 }) => getLearnerDetail(username!, pageParam as number, debouncedSearch),
    enabled: !!username && isOpen,
    getNextPageParam: (lastPage) => 
      lastPage.current_page < lastPage.total_pages ? lastPage.current_page + 1 : undefined,
    initialPageParam: 1,
  });

  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const [target] = entries;
    if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    const element = observerTarget.current;
    if (!element) return;

    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const allResults = data?.pages.flatMap(page => page.results) || [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border shadow-2xl">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
              {username?.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-foreground">Chi tiết học tập: {username}</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Danh sách các khóa học đã đăng ký và tiến độ học tập.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-2">
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm khóa học..." 
              className="pl-9 h-10 bg-muted/30 border-border focus-visible:ring-primary/30 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-grow overflow-y-auto px-6 pb-6 custom-scrollbar space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
            </div>
          ) : isError ? (
            <div className="text-center py-10 text-muted-foreground">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Lỗi khi tải dữ liệu chi tiết.</p>
              <button onClick={() => refetch()} className="text-primary text-sm font-bold mt-2">Thử lại</button>
            </div>
          ) : allResults.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground italic">Không tìm thấy khóa học nào.</div>
          ) : (
            <div className="grid gap-3">
              {allResults.map((course: LearnerDetailResult) => {
                const radius = 16;
                const stroke = 3;
                const normalizedRadius = radius - stroke;
                const circumference = normalizedRadius * 2 * Math.PI;
                const strokeDashoffset = circumference - ((course.progress || 0) / 100) * circumference;

                return (
                  <div key={course.course_id} className="group p-4 rounded-xl border border-border bg-muted/5 hover:bg-muted/20 hover:border-primary/20 transition-all flex items-center justify-between gap-4">
                    <div className="min-w-0 flex-grow">
                      <p className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{course.course_name}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 truncate">ID: {course.course_id}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center">
                        <div className="relative flex items-center justify-center w-10 h-10">
                          <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                            <circle
                              stroke="currentColor"
                              fill="transparent"
                              strokeWidth={stroke}
                              className="text-muted/50"
                              r={normalizedRadius}
                              cx={radius}
                              cy={radius}
                            />
                            <motion.circle
                              stroke="currentColor"
                              fill="transparent"
                              strokeWidth={stroke}
                              strokeDasharray={`${circumference} ${circumference}`}
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={course.is_completed ? "text-emerald-500" : "text-primary"}
                              strokeLinecap="round"
                              r={normalizedRadius}
                              cx={radius}
                              cy={radius}
                            />
                          </svg>
                          <span className={`absolute text-[9px] font-black tabular-nums ${course.is_completed ? 'text-emerald-600' : 'text-primary'}`}>
                            {Math.round(course.progress || 0)}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${course.is_completed ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                        {course.is_completed ? 'Hoàn thành' : 'Đang học'}
                      </span>
                    </div>
                  </div>
                );
              })}
              
              <div ref={observerTarget} className="h-10 flex items-center justify-center">
                {isFetchingNextPage && <RefreshCcw className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ReportSummaryPage() {
  useHeaderInfo('Báo cáo Tổng hợp');
  const [selectedLearner, setSelectedLearner] = useState<string | null>(null);
  const [chartMetric, setChartMetric] = useState<{ key: string, title: string } | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  const user = useAuthStore((s) => s.user);
  const isSuperadmin = user?.role === 'superadmin' || user?.isSuperuser === true;

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['report-summary', selectedMonth, selectedYear],
    queryFn: () => getReportSummary({ month: selectedMonth, year: selectedYear }),
    enabled: isSuperadmin,
  });

  if (!isSuperadmin) {
    return (
      <div className="p-6 space-y-6 max-w-7xl mx-auto pb-10">
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-12 text-center mt-12 backdrop-blur-sm">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold text-destructive mb-2">Truy cập bị hạn chế</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            Bạn không có quyền cần thiết để xem phân tích hệ thống. 
            Chỉ quản trị viên cấp cao (superuser) mới có thể truy cập báo cáo chi tiết.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-8 max-w-7xl mx-auto pb-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="shadow-sm border-border overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
        <div className="p-4 bg-muted rounded-full">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <p>Không thể tải dữ liệu phân tích thời gian thực. Vui lòng kiểm tra kết nối.</p>
        <button onClick={() => refetch()} className="text-sm text-primary font-medium hover:underline flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" /> Thử lại
        </button>
      </div>
    );
  }

  const overview = data.overview;
  const stats = [
    { title: 'Tổng học viên', value: overview.total_learners, icon: Users, color: '#3b82f6', trend: '+12%', key: 'total_learners' },
    { title: 'Tổng nhân sự', value: overview.total_staff, icon: ShieldAlert, color: '#8b5cf6', trend: '+2%', key: 'total_staff' },
    { title: 'Học viên hoạt động', value: overview.active_learners, icon: UserCheck, color: '#10b981', trend: '+8%', key: 'active_learners' },
    { title: 'Tổng khóa học', value: overview.total_courses, icon: BookOpen, color: '#f59e0b', trend: '+5%', key: 'total_courses' },
  ];

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto pb-20 relative">
      <LearnerDetailModal 
        username={selectedLearner}
        isOpen={!!selectedLearner}
        onClose={() => setSelectedLearner(null)}
      />

      <ChartTrendModal 
        metricKey={chartMetric?.key || null}
        title={chartMetric?.title || ''}
        isOpen={!!chartMetric}
        onClose={() => setChartMetric(null)}
      />

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--foreground) 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Tổng quan Phân tích</h1>
          <p className="text-muted-foreground text-sm">Chỉ số hệ thống thời gian thực và hiệu suất người học.</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 h-9 pl-3 pr-2 py-0 text-xs font-medium rounded-full border border-border bg-background hover:bg-muted outline-none focus-visible:ring-1 focus-visible:ring-primary transition-all text-foreground shadow-sm">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Tháng {selectedMonth}/{selectedYear}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[140px] max-h-[300px] overflow-y-auto rounded-lg custom-scrollbar">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(offset => {
                const d = new Date();
                d.setMonth(d.getMonth() - offset);
                const m = d.getMonth() + 1;
                const y = d.getFullYear();
                const isSelected = selectedMonth === m && selectedYear === y;
                return (
                  <DropdownMenuItem
                    key={`${m}-${y}`}
                    onClick={() => {
                      setSelectedMonth(m);
                      setSelectedYear(y);
                    }}
                    className={`cursor-pointer text-[13px] mx-1 rounded-md mb-0.5 justify-between transition-colors ${isSelected ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground'}`}
                  >
                    Tháng {m}/{y}
                    <div className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-foreground' : 'bg-transparent'}`} />
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => refetch()} className={`inline-flex items-center justify-center h-9 w-9 rounded-full border border-border bg-background hover:bg-muted transition-all text-muted-foreground hover:text-foreground active:scale-95 shadow-sm ${isFetching ? 'animate-spin' : ''}`}>
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          <button className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-md">
            <Download className="h-3.5 w-3.5" />
            Xuất dữ liệu
          </button>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.05 } },
        }}
      >
        {stats.map((stat) => (
          <motion.div key={stat.title} variants={cardVariant}>
            <Card 
              className="shadow-sm border-border group hover:border-primary/30 hover:shadow-md transition-all cursor-pointer overflow-hidden relative"
              onClick={() => setChartMetric({ key: stat.key, title: stat.title })}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <BarChart3 className="h-3.5 w-3.5 text-primary/50" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
                <CardTitle className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">{stat.title}</CardTitle>
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <stat.icon className="h-4 w-4 text-muted-foreground/70 group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold text-emerald-500 flex items-center bg-emerald-500/10 px-1.5 rounded-sm">
                    <ArrowUpRight className="h-2 w-2 mr-0.5" />
                    {stat.trend}
                  </div>
                </div>
                
                <div className="h-12 w-full mt-3 -mx-4 pointer-events-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={generateSparkline(typeof stat.value === 'number' ? stat.value : 100)}>
                      <defs>
                        <linearGradient id={`gradient-${stat.title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={stat.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={stat.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={stat.color}
                        strokeWidth={2}
                        fill={`url(#gradient-${stat.title.replace(/\s+/g, '-')})`}
                        isAnimationActive={true}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Charts & Lists */}
      <motion.div
        className="grid gap-6 md:grid-cols-12"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
        }}
      >
        <motion.div variants={cardVariant} className="md:col-span-7">
          <TopCoursesWidget month={selectedMonth} year={selectedYear} />
        </motion.div>

        <motion.div variants={cardVariant} className="md:col-span-5">
          <UncompletedLearnersWidget 
            month={selectedMonth} 
            year={selectedYear} 
            onSelectLearner={setSelectedLearner} 
            trendData={data.lists.uncompleted_trend}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
