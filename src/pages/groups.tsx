// ============================================================
// groups.tsx — Group Management Page (Staff/Superuser only)
// Layout: 3-panel (OrgGroup | SubGroup | Detail)
// ============================================================

import { useState } from 'react';
import { FolderTree, Users, MousePointerClick } from 'lucide-react';
import { OrgGroupPanel } from '@/components/groups/OrgGroupPanel';
import { SubGroupPanel } from '@/components/groups/SubGroupPanel';
import { SubGroupDetailPanel } from '@/components/groups/SubGroupDetailPanel';

export default function GroupsPage() {
  const [selectedGroupId, setSelectedGroupId] = useState<number>(0);
  const [selectedSubGroupId, setSelectedSubGroupId] = useState<number>(0);

  const handleSelectGroup = (id: number) => {
    setSelectedGroupId(id);
    setSelectedSubGroupId(0); // reset subgroup khi đổi group cha
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

      {/* 3-Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1 — Org Groups (fixed width) */}
        <div className="w-56 shrink-0 flex flex-col overflow-hidden">
          <OrgGroupPanel
            selectedId={selectedGroupId}
            onSelect={handleSelectGroup}
          />
        </div>

        {/* Panel 2 — Sub Groups (fixed width, chỉ hiện khi có group cha) */}
        <div className="w-56 shrink-0 flex flex-col overflow-hidden">
          {selectedGroupId > 0 ? (
            <SubGroupPanel
              groupId={selectedGroupId}
              selectedId={selectedSubGroupId}
              onSelect={setSelectedSubGroupId}
            />
          ) : (
            <EmptyHint icon={<Users className="h-8 w-8" />} text="Chọn một tổ chức" />
          )}
        </div>

        {/* Panel 3 — Detail (flex-1) */}
        <div className="flex-1 overflow-hidden">
          {selectedSubGroupId > 0 ? (
            <SubGroupDetailPanel sgId={selectedSubGroupId} />
          ) : (
            <EmptyHint
              icon={<MousePointerClick className="h-8 w-8" />}
              text={selectedGroupId > 0 ? 'Chọn một phòng ban để xem chi tiết' : 'Chọn tổ chức rồi chọn phòng ban'}
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
