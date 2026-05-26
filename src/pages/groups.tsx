// ============================================================
// groups.tsx — Group Management Page (Staff/Superuser only)
// Layout: 4-panel (OrgGroup | SubGroup | Team | Detail)
// ============================================================

import { useState } from 'react';
import { FolderTree, Users, MousePointerClick, UsersRound } from 'lucide-react';
import { OrgGroupPanel } from '@/components/groups/OrgGroupPanel';
import { SubGroupPanel } from '@/components/groups/SubGroupPanel';
import { TeamPanel } from '@/components/groups/TeamPanel';
import { TeamDetailPanel } from '@/components/groups/TeamDetailPanel';

export default function GroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<number>(0);
  const [selectedTeamId, setSelectedTeamId] = useState<number>(0);

  const handleSelectGroup = (id: number) => {
    setSelectedGroupId(id);
    setSelectedSubGroupId(0); // reset subgroup khi đổi group cha
    setSelectedTeamId(0);
  };

  const handleSelectSubGroup = (id: number) => {
    setSelectedSubGroupId(id);
    setSelectedTeamId(0); // reset team khi đổi subgroup
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-border shrink-0 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <FolderTree className="h-4.5 w-4.5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground leading-tight">Quản lý nhóm</h1>
          <p className="text-xs text-muted-foreground">
            Tổ chức học viên theo nhóm và phân quyền xem khóa học
          </p>
        </div>
      </div>

      {/* 4-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1 — Org Groups (fixed width) */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden">
          <OrgGroupPanel
            selectedId={selectedGroupId}
            onSelect={handleSelectGroup}
          />
        </div>

        {/* Panel 2 — Sub Groups (fixed width, chỉ hiện khi có group cha) */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden">
          {selectedGroupId > 0 ? (
            <SubGroupPanel
              groupId={selectedGroupId}
              selectedId={selectedSubGroupId}
              onSelect={handleSelectSubGroup}
            />
          ) : (
            <EmptyHint icon={<Users className="h-8 w-8" />} text="Chọn một tổ chức" />
          )}
        </div>

        {/* Panel 3 — Teams (fixed width, chỉ hiện khi có subgroup) */}
        <div className="w-52 shrink-0 flex flex-col overflow-hidden">
          {selectedSubGroupId > 0 ? (
            <TeamPanel
              subgroupId={selectedSubGroupId}
              selectedId={selectedTeamId}
              onSelect={setSelectedTeamId}
            />
          ) : (
            <EmptyHint icon={<UsersRound className="h-8 w-8" />} text={selectedGroupId > 0 ? 'Chọn một phòng ban' : ''} />
          )}
        </div>

        {/* Panel 4 — Detail (flex-1) */}
        <div className="flex-1 overflow-hidden">
          {selectedTeamId > 0 ? (
            <TeamDetailPanel teamId={selectedTeamId} />
          ) : (
            <EmptyHint
              icon={<MousePointerClick className="h-8 w-8" />}
              text={selectedSubGroupId > 0 ? 'Chọn một team để xem chi tiết' : selectedGroupId > 0 ? 'Chọn phòng ban rồi chọn team' : 'Chọn tổ chức → phòng ban → team'}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyHint({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-8 text-muted-foreground/40">
      <div className="mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
